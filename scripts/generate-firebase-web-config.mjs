import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(path, "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

const env = { ...process.env, ...loadEnvLocal() };

const config = {
  apiKey: required(env, "NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: required(env, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: required(env, "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
  messagingSenderId: required(env, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: required(env, "NEXT_PUBLIC_FIREBASE_APP_ID"),
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
};

const out = resolve(process.cwd(), "public/firebase-web-config.js");
const body = `window.__FIREBASE_WEB_CONFIG__=${JSON.stringify(config)};\n`;
writeFileSync(out, body, "utf8");
console.log(`Wrote ${out}`);
