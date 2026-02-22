import { drizzle } from "drizzle-orm/mysql2";
import { voiceProfiles } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const profiles = [
  {
    name: "Alex - US Young",
    accent: "US",
    gender: "male",
    voiceType: "young",
    avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-1_1771770678000_na1fn_YXZhdGFyLXVzLW1hbGUteW91bmcu.png",
    description: "Friendly and energetic young American voice",
    ttsVoiceId: "en-US-Neural2-A",
  },
  {
    name: "Emma - US Professional",
    accent: "US",
    gender: "female",
    voiceType: "professional",
    avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-2_1771770682000_na1fn_YXZhdGFyLXVzLWZlbWFsZS1wcm9mZXNzaW9uYWw.png",
    description: "Professional and confident American voice",
    ttsVoiceId: "en-US-Neural2-C",
  },
  {
    name: "James - UK Mature",
    accent: "UK",
    gender: "male",
    voiceType: "mature",
    avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-3_1771770681000_na1fn_YXZhdGFyLXVrLW1hbGUtbWF0dXJl.png",
    description: "Sophisticated and distinguished British voice",
    ttsVoiceId: "en-GB-Neural2-A",
  },
  {
    name: "Sophie - UK Casual",
    accent: "UK",
    gender: "female",
    voiceType: "casual",
    avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-4_1771770682000_na1fn_YXZhdGFyLXVrLWZlbWFsZS1jYXN1YWw.png",
    description: "Friendly and approachable British voice",
    ttsVoiceId: "en-GB-Neural2-B",
  },
  {
    name: "Liam - Australian Casual",
    accent: "Australian",
    gender: "male",
    voiceType: "casual",
    avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/MycS8b1Rygga3ACV4fJK8M-img-5_1771770680000_na1fn_YXZhdGFyLWF1c3RyYWxpYW4tbWFsZS1jYXN1YWw.png",
    description: "Relaxed and friendly Australian voice",
    ttsVoiceId: "en-AU-Neural2-A",
  },
  {
    name: "Priya - Indian Professional",
    accent: "Indian",
    gender: "female",
    voiceType: "professional",
    avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/TC9UdSj0Guxl93g4Vj2L2q-img-1_1771770709000_na1fn_YXZhdGFyLWluZGlhbi1mZW1hbGUtcHJvZmVzc2lvbmFs.png",
    description: "Professional and articulate Indian voice",
    ttsVoiceId: "en-IN-Neural2-A",
  },
  {
    name: "Casey - Non-binary Young",
    accent: "US",
    gender: "non-binary",
    voiceType: "young",
    avatarUrl: "https://private-us-east-1.manuscdn.com/sessionFile/OoWlj0YQ06ufsiBUe8NVUB/sandbox/TC9UdSj0Guxl93g4Vj2L2q-img-2_1771770709000_na1fn_YXZhdGFyLW5vbmJpbmFyeS15b3VuZw.png",
    description: "Contemporary and inclusive voice",
    ttsVoiceId: "en-US-Neural2-D",
  },
];

try {
  await db.insert(voiceProfiles).values(profiles);
  console.log("Voice profiles seeded successfully!");
} catch (error) {
  console.error("Error seeding voice profiles:", error);
  process.exit(1);
}
