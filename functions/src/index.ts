import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import postgres from "postgres";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Google TTS Client
const ttsClient = new TextToSpeechClient({
  keyFilename: "./google-cloud-key.json",
});

// Database connection
const sql = postgres("postgresql://postgres:D@lveer@123@db.cdvrstytwgxxkqnmckdz.supabase.co:5432/postgres");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get all voice profiles
app.get("/api/trpc/voice.getAllProfiles", async (req, res) => {
  try {
    const profiles = await sql`SELECT * FROM voice_profiles`;
    res.json({
      result: {
        data: profiles.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          languageCode: p.language_code,
          ssmlGender: p.ssml_gender,
          sampleAudioUrl: p.sample_audio_url,
          accent: p.language_code.split('-')[1],
          gender: p.ssml_gender.toLowerCase(),
          voiceType: "professional",
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`
        }))
      }
    });
  } catch (error: any) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// Session initialization
app.post("/api/trpc/voice.initSession", async (req, res) => {
  try {
    const sessionToken = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    // In a real app, you'd save this to the DB. For now, we'll just return it.
    res.json({
      result: {
        data: { sessionToken }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Generate voice
app.post("/api/trpc/voice.generate", async (req, res) => {
  try {
    const { text, voiceProfileId } = req.body.json;

    // 1. Get voice profile from DB
    const [profile] = await sql`SELECT * FROM voice_profiles WHERE id = ${voiceProfileId}`;
    if (!profile) {
      return res.status(404).json({ error: { message: "Voice profile not found" } });
    }

    // 2. Call Google TTS
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: profile.language_code,
        ssmlGender: profile.ssml_gender,
        name: profile.tts_voice_id || undefined
      },
      audioConfig: { audioEncoding: "MP3" },
    });

    const audioContent = response.audioContent;
    if (!audioContent) {
      throw new Error("Failed to generate audio content");
    }

    // 3. Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `generations/${Date.now()}.mp3`;
    const file = bucket.file(fileName);
    
    await file.save(Buffer.from(audioContent as Uint8Array), {
      metadata: { contentType: "audio/mpeg" }
    });

    // Make file public
    await file.makePublic();
    const audioUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // 4. Save to generation history
    await sql`
      INSERT INTO generation_history (voice_profile_id, input_text, audio_url)
      VALUES (${voiceProfileId}, ${text}, ${audioUrl})
    `;

    res.json({
      result: {
        data: {
          success: true,
          audioUrl,
          voiceProfile: profile
        }
      }
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    res.status(500).json({ error: { message: error.message } });
  }
});

export const api = functions.https.onRequest(app);
