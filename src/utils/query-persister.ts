import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

const CONFIG_DIR = join(homedir(), ".config", "devhub");
const CACHE_PATH = join(CONFIG_DIR, "query-cache.json");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

function isCacheEnabled(): boolean {
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    return raw.persistCache !== false;
  } catch {
    return true; // default enabled
  }
}

/** Debounce writes to avoid thrashing disk on rapid updates */
let writeTimer: ReturnType<typeof setTimeout> | null = null;
const WRITE_DEBOUNCE_MS = 2000;

export function createFilePersister(): Persister {
  return {
    persistClient(client: PersistedClient) {
      if (!isCacheEnabled()) return;
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(() => {
        try {
          mkdirSync(CONFIG_DIR, { recursive: true });
          writeFileSync(CACHE_PATH, JSON.stringify(client));
        } catch {
          // ignore write errors
        }
      }, WRITE_DEBOUNCE_MS);
    },

    restoreClient(): PersistedClient | undefined {
      if (!isCacheEnabled()) return undefined;
      try {
        const data = readFileSync(CACHE_PATH, "utf-8");
        return JSON.parse(data) as PersistedClient;
      } catch {
        return undefined;
      }
    },

    removeClient() {
      try {
        unlinkSync(CACHE_PATH);
      } catch {
        // ignore
      }
    },
  };
}

/** Delete the cache file from disk. */
export function clearQueryCache(): void {
  try {
    unlinkSync(CACHE_PATH);
  } catch {
    // ignore if not exists
  }
}

/** Get the cache file size in bytes (0 if not found). */
export function getQueryCacheSize(): number {
  try {
    const data = readFileSync(CACHE_PATH);
    return data.length;
  } catch {
    return 0;
  }
}
