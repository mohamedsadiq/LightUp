#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");
const localesDir = path.join(root, "locales");
const enMessagesPath = path.join(localesDir, "en", "messages.json");

const languages = [
  { code: "es", name: "Spanish" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "pt", name: "Portuguese" },
  { code: "bn", name: "Bengali" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pl", name: "Polish" },
  { code: "uk", name: "Ukrainian" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
  { code: "cs", name: "Czech" },
  { code: "sk", name: "Slovak" },
  { code: "hu", name: "Hungarian" },
  { code: "ro", name: "Romanian" },
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "sl", name: "Slovenian" },
  { code: "et", name: "Estonian" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "el", name: "Greek" },
  { code: "tr", name: "Turkish" },
  { code: "ko", name: "Korean" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "ms", "Malay" },
  { code: "tl", name: "Filipino" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ur", name: "Urdu" },
  { code: "fa", name: "Persian" },
  { code: "he", name: "Hebrew" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "es-MX", name: "Spanish (Mexico)" },
  { code: "sw", name: "Swahili" },
  { code: "am", name: "Amharic" },
  { code: "yo", name: "Yoruba" },
  { code: "ig", name: "Igbo" },
  { code: "ha", name: "Hausa" },
  { code: "zu", name: "Zulu" },
  { code: "af", name: "Afrikaans" },
];

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "❌ GEMINI_API_KEY environment variable not set. Aborting translation."
    );
    process.exit(1);
  }

  const enMessagesContent = await fs.readFile(enMessagesPath, "utf8");
  const enMessages = JSON.parse(enMessagesContent);
  const messagesToTranslate = {};
  for (const key in enMessages) {
    if (enMessages[key].message) {
      messagesToTranslate[key] = enMessages[key].message;
    }
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const successfulTranslations = [];
  const failedTranslations = [];

  for (const lang of languages) {
    const { code, name } = lang;
    const targetPath = path.join(localesDir, code);
    const targetMessagesPath = path.join(targetPath, "messages.json");

    try {
      console.log(`\nTranslating to ${name} (${code})...`);

      const prompt = `
        Translate the 'message' values in the following JSON object to ${name} (${code}).
        Do not translate the keys.
        Return ONLY the translated JSON object, with the same structure.
        Do not include any extra commentary, explanations, or markdown formatting.
        The output must be a valid JSON object.

        Original JSON:
        ${JSON.stringify(messagesToTranslate, null, 2)}
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const cleanedResponse = responseText.replace(/^```json\n?/, "").replace(/```$/, "");
      const translatedMessages = JSON.parse(cleanedResponse);

      const finalJson = JSON.parse(enMessagesContent);
      for (const key in translatedMessages) {
        if (finalJson[key]) {
          finalJson[key].message = translatedMessages[key];
        }
      }

      await fs.mkdir(targetPath, { recursive: true });
      await fs.writeFile(targetMessagesPath, JSON.stringify(finalJson, null, 2) + "\n");

      console.log(`✔ Successfully translated to ${name} (${code})`);
      successfulTranslations.push(lang);
    } catch (error) {
      console.error(`❌ Error translating to ${name} (${code}): ${error.message}`);
      failedTranslations.push({ ...lang, error: error.message });
    }
  }

  console.log("\n\n--- Translation Summary ---");
  console.log(`✅ ${successfulTranslations.length} languages translated successfully.`);
  if (failedTranslations.length > 0) {
    console.log(`\n❌ ${failedTranslations.length} languages failed:`);
    for (const failed of failedTranslations) {
      console.log(`  - ${failed.name} (${failed.code}): ${failed.error}`);
    }
  }
  console.log("---------------------------\n");
}

main();
