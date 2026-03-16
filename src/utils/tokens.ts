import { readFileSync, writeFileSync, mkdirSync, chmodSync } from "fs";
import { join } from "path";
import { DEFAULT_CONFIG_DIR } from "../constants.ts";

const TOKENS_PATH = join(DEFAULT_CONFIG_DIR, "tokens.json");

export type TokenKey =
  | "githubToken"
  | "azureToken"
  | "jiraToken"
  | "slackToken";

interface TokenStore {
  [key: string]: string;
}

function readTokens(): TokenStore {
  try {
    return JSON.parse(readFileSync(TOKENS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeTokens(store: TokenStore): void {
  mkdirSync(DEFAULT_CONFIG_DIR, { recursive: true });
  writeFileSync(TOKENS_PATH, JSON.stringify(store, null, 2), { mode: 0o600 });
  try {
    chmodSync(TOKENS_PATH, 0o600);
  } catch {
    // best-effort
  }
}

export function getToken(key: TokenKey): string {
  return readTokens()[key] ?? "";
}

export function setToken(key: TokenKey, value: string): void {
  const store = readTokens();
  store[key] = value;
  writeTokens(store);
}

export function deleteToken(key: TokenKey): void {
  const store = readTokens();
  delete store[key];
  writeTokens(store);
}

/**
 * Migrate tokens from config.json to tokens.json.
 * Called once at startup — moves any token fields found in config
 * to the dedicated tokens file, then strips them from config.
 */
export function migrateTokensFromConfig(): void {
  const configPath = join(DEFAULT_CONFIG_DIR, "config.json");
  let raw: any;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return;
  }

  const TOKEN_KEYS: TokenKey[] = [
    "githubToken",
    "azureToken",
    "jiraToken",
    "slackToken",
  ];

  const existing = readTokens();
  let migrated = false;

  for (const key of TOKEN_KEYS) {
    if (raw[key]) {
      // Only migrate if not already in tokens.json
      if (!existing[key]) {
        existing[key] = raw[key];
      }
      delete raw[key];
      migrated = true;
    }
  }

  if (migrated) {
    writeTokens(existing);
    writeFileSync(configPath, JSON.stringify(raw, null, 2));
  }
}
