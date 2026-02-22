import { eq, and, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, voiceProfiles, userSessions, generationHistory, InsertUserSession, InsertGenerationHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
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
  sessionId: number,
  voiceProfileId: number,
  text: string,
  audioUrl?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create generation record: database not available");
    return null;
  }

  try {
    const record: InsertGenerationHistory = {
      userId,
      sessionId,
      voiceProfileId,
      text,
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
        accent: "US",
        gender: "male" as const,
        voiceType: "young",
        avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-1_1771770678000_na1fn_YXZhdGFyLXVzLW1hbGUteW91bmcu.png",
        description: "Friendly and energetic young American voice",
        ttsVoiceId: "en-US-Neural2-A",
      },
      {
        name: "Emma - US Professional",
        accent: "US",
        gender: "female" as const,
        voiceType: "professional",
        avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-2_1771770682000_na1fn_YXZhdGFyLXVzLWZlbWFsZS1wcm9mZXNzaW9uYWw.png",
        description: "Professional and confident American voice",
        ttsVoiceId: "en-US-Neural2-C",
      },
      {
        name: "James - UK Mature",
        accent: "UK",
        gender: "male" as const,
        voiceType: "mature",
        avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-3_1771770681000_na1fn_YXZhdGFyLXVrLW1hbGUtbWF0dXJl.png",
        description: "Sophisticated and distinguished British voice",
        ttsVoiceId: "en-GB-Neural2-A",
      },
      {
        name: "Sophie - UK Casual",
        accent: "UK",
        gender: "female" as const,
        voiceType: "casual",
        avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-4_1771770682000_na1fn_YXZhdGFyLXVrLWZlbWFsZS1jYXN1YWw.png",
        description: "Friendly and approachable British voice",
        ttsVoiceId: "en-GB-Neural2-B",
      },
      {
        name: "Liam - Australian Casual",
        accent: "Australian",
        gender: "male" as const,
        voiceType: "casual",
        avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-5_1771770680000_na1fn_YXZhdGFyLWF1c3RyYWxpYW4tbWFsZS1jYXN1YWw.png",
        description: "Relaxed and friendly Australian voice",
        ttsVoiceId: "en-AU-Neural2-A",
      },
      {
        name: "Priya - Indian Professional",
        accent: "Indian",
        gender: "female" as const,
        voiceType: "professional",
        avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/TC9UdSj0Guxl93g4Vj2L2q-img-1_1771770709000_na1fn_YXZhdGFyLWluZGlhbi1mZW1hbGUtcHJvZmVzc2lvbmFs.png",
        description: "Professional and articulate Indian voice",
        ttsVoiceId: "en-IN-Neural2-A",
      },
      {
        name: "Casey - Non-binary Young",
        accent: "US",
        gender: "non-binary" as const,
        voiceType: "young",
        avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/TC9UdSj0Guxl93g4Vj2L2q-img-2_1771770709000_na1fn_YXZhdGFyLW5vbmJpbmFyeS15b3VuZw.png",
        description: "Contemporary and inclusive voice",
        ttsVoiceId: "en-US-Neural2-D",
      },
    ];

    await db.insert(voiceProfiles).values(profiles);
  } catch (error) {
    console.error("[Database] Failed to seed voice profiles:", error);
  }
}
