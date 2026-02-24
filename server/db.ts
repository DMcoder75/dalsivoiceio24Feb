import { eq, and, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, voiceProfiles, userSessions, generationHistory, InsertUserSession, InsertGenerationHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Use PostgreSQL upsert syntax
    await db.insert(users).values(values).onConflict((t) => ({
      target: t.openId,
      do: db.update(users).set(updateSet),
    }));
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all available voice profiles
 */
export async function getAllVoiceProfiles() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get voice profiles: database not available");
    return [];
  }
  return db.select().from(voiceProfiles);
}

/**
 * Get a specific voice profile by ID
 */
export async function getVoiceProfileById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get voice profile: database not available");
    return undefined;
  }
  const result = await db.select().from(voiceProfiles).where(eq(voiceProfiles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create or get user session
 */
export async function createOrGetUserSession(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user session: database not available");
    return null;
  }

  try {
    const sessionToken = `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session: InsertUserSession = {
      userId,
      sessionToken,
      generationCount: 0,
      remainingGenerations: 2,
      expiresAt,
    };

    await db.insert(userSessions).values(session);
    return sessionToken;
  } catch (error) {
    console.error("[Database] Failed to create user session:", error);
    return null;
  }
}

/**
 * Get user session by token
 */
export async function getUserSessionByToken(sessionToken: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user session: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(userSessions)
    .where(and(eq(userSessions.sessionToken, sessionToken), lt(userSessions.expiresAt, new Date())))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Increment generation count for a session
 */
export async function incrementGenerationCount(sessionId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot increment generation count: database not available");
    return false;
  }

  try {
    const session = await db.select().from(userSessions).where(eq(userSessions.id, sessionId)).limit(1);
    if (session.length === 0) return false;

    const newCount = (session[0].generationCount || 0) + 1;
    await db.update(userSessions).set({ generationCount: newCount }).where(eq(userSessions.id, sessionId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to increment generation count:", error);
    return false;
  }
}

/**
 * Create generation history record
 */
export async function createGenerationRecord(
  userId: number,
  voiceProfileId: number,
  text: string,
  audioUrl: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create generation record: database not available");
    return null;
  }

  try {
    const record: InsertGenerationHistory = {
      userId,
      voiceProfileId,
      inputText: text,
      audioUrl,
      status: "completed",
      completedAt: new Date(),
    };

    await db.insert(generationHistory).values(record);
    return record;
  } catch (error) {
    console.error("[Database] Failed to create generation record:", error);
    return null;
  }
}

/**
 * Seed voice profiles
 */
export async function seedVoiceProfiles() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot seed voice profiles: database not available");
    return;
  }

  try {
    const existing = await db.select().from(voiceProfiles);
    if (existing.length > 0) {
      return; // Already seeded
    }

    const profiles = [
      {
        name: "Alex - US Young",
        languageCode: "en-US",
        ssmlGender: "MALE",
        description: "Friendly and energetic young American voice",
        ttsVoiceId: "en-US-Neural2-A",
        sampleAudioUrl: "https://example.com/samples/alex.mp3",
      },
      {
        name: "Emma - US Professional",
        languageCode: "en-US",
        ssmlGender: "FEMALE",
        description: "Professional and confident American voice",
        ttsVoiceId: "en-US-Neural2-C",
        sampleAudioUrl: "https://example.com/samples/emma.mp3",
      },
      {
        name: "James - UK Mature",
        languageCode: "en-GB",
        ssmlGender: "MALE",
        description: "Sophisticated and distinguished British voice",
        ttsVoiceId: "en-GB-Neural2-A",
        sampleAudioUrl: "https://example.com/samples/james.mp3",
      },
      {
        name: "Sophie - UK Casual",
        languageCode: "en-GB",
        ssmlGender: "FEMALE",
        description: "Friendly and approachable British voice",
        ttsVoiceId: "en-GB-Neural2-B",
        sampleAudioUrl: "https://example.com/samples/sophie.mp3",
      },
      {
        name: "Liam - Australian Casual",
        languageCode: "en-AU",
        ssmlGender: "MALE",
        description: "Relaxed and friendly Australian voice",
        ttsVoiceId: "en-AU-Neural2-A",
        sampleAudioUrl: "https://example.com/samples/liam.mp3",
      },
      {
        name: "Priya - Indian Professional",
        languageCode: "en-IN",
        ssmlGender: "FEMALE",
        description: "Professional and articulate Indian voice",
        ttsVoiceId: "en-IN-Neural2-A",
        sampleAudioUrl: "https://example.com/samples/priya.mp3",
      },
      {
        name: "Casey - Non-binary Young",
        languageCode: "en-US",
        ssmlGender: "NEUTRAL",
        description: "Contemporary and inclusive voice",
        ttsVoiceId: "en-US-Neural2-D",
        sampleAudioUrl: "https://example.com/samples/casey.mp3",
      },
    ];

    await db.insert(voiceProfiles).values(profiles);
  } catch (error) {
    console.error("[Database] Failed to seed voice profiles:", error);
  }
}
