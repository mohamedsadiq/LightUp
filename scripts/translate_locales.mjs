#!/usr/bin/env node
/*
  Script: translate_locales.mjs
  Description: Iterates over ./locales/*/messages.json and fills in non-English
  locales by translating any message value that is still in English.  It keeps
  "description" fields untouched.

  Usage:
    # 1. Install deps: npm i -D @google/generative-ai
    # 2. Export your Gemini key: export GEMINI_API_KEY="..."
    # 3. Run: npm run translate-locales
*/
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");
const localesDir = path.join(root, "locales");
const enMessages = JSON.parse(
  await fs.readFile(path.join(localesDir, "en", "messages.json"), "utf8")
);

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "❌  GEMINI_API_KEY environment variable not set. Aborting translation."
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const localeDirs = (await fs.readdir(localesDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && d.name !== "en")
  .map((d) => d.name);

const translate = async (text, targetLang) => {
  const prompt = `Translate the following text to ${targetLang}. Return ONLY the translated text with no extra commentary.\n\n"""${text}"""`;
  const resp = await model.generateContent(prompt);
  return resp.response.text().trim();
};

for (const locale of localeDirs) {
  const fp = path.join(localesDir, locale, "messages.json");
  const data = JSON.parse(await fs.readFile(fp, "utf8"));
  let changed = false;

  for (const [key, obj] of Object.entries(data)) {
    const eng = enMessages[key]?.message?.trim();
    if (!eng) continue;

    let current = obj.message?.trim();
    // Detect untranslated English or placeholder prefix [Lang]
    const stillEnglish =
      current === eng || /\[[A-Za-z\-]+]/.test(current) || /[A-Za-z]{4,}/.test(current) && !/[^A-Za-z0-9 ,.'"!?]/.test(current);

    if (stillEnglish) {
      const translated = await translate(eng, locale);
      obj.message = translated;
      changed = true;
      console.log(`  • ${locale}/${key} translated`);
    }
  }

  if (changed) {
    await fs.writeFile(fp, JSON.stringify(data, null, 2) + "\n");
    console.log(`✔  Updated ${locale}/messages.json`);
  } else {
    console.log(`✓  ${locale} already complete`);
  }
}

console.log("🎉 Translation pass complete");
