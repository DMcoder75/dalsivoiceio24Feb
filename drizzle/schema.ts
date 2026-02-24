import { integer, text, timestamp, varchar, serial, pgTable, pgEnum } from "drizzle-orm/pg-core";

/**
 * PostgreSQL schema matching Supabase database
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  openId: varchar("openId", { length: 64 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Voice profiles with accents, genders, and voice types
 */
export const voiceProfiles = pgTable("voice_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  languageCode: varchar("language_code", { length: 64 }).notNull(),
  ssmlGender: varchar("ssml_gender", { length: 64 }).notNull(),
  sampleAudioUrl: text("sample_audio_url"),
  ttsVoiceId: varchar("tts_voice_id", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VoiceProfile = typeof voiceProfiles.$inferSelect;
export type InsertVoiceProfile = typeof voiceProfiles.$inferInsert;

/**
 * User sessions for tracking generation limits
 */
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionToken: varchar("session_token", { length: 256 }).notNull().unique(),
  generationCount: integer("generation_count").default(0).notNull(),
  remainingGenerations: integer("remaining_generations").default(2).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

/**
 * Generation history for tracking user activity
 */
export const generationHistory = pgTable("generation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  voiceProfileId: integer("voice_profile_id").notNull(),
  inputText: text("input_text").notNull(),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type GenerationHistory = typeof generationHistory.$inferSelect;
export type InsertGenerationHistory = typeof generationHistory.$inferInsert;

/**
 * Voice samples for reference
 */
export const voiceSamples = pgTable("voice_samples", {
  id: serial("id").primaryKey(),
  voiceProfileId: integer("voice_profile_id").notNull(),
  sampleText: text("sample_text").notNull(),
  audioUrl: text("audio_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VoiceSample = typeof voiceSamples.$inferSelect;
export type InsertVoiceSample = typeof voiceSamples.$inferInsert;
