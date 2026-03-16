import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { CACHE_DIR } from "../constants.ts";
import { readConfigFile } from "./config-file.ts";

const CACHE_PATH = join(CACHE_DIR, "query-cache.json");

function isCacheEnabled(): boolean {
  const raw = readConfigFile();
  return raw?.persistCache !== false;
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
          mkdirSync(CACHE_DIR, { recursive: true });
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
