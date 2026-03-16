import { existsSync, renameSync, mkdirSync } from "fs";
import { join } from "path";
import { DEFAULT_CONFIG_DIR, CACHE_DIR } from "../constants.ts";

const CACHE_FILES = ["query-cache.json", "dep-cache.json"];

/**
 * Move cache files from ~/.config/devhub/ to ~/.cache/devhub/.
 * Called once at startup.
 */
export function migrateCacheFiles(): void {
  for (const file of CACHE_FILES) {
    const oldPath = join(DEFAULT_CONFIG_DIR, file);
    const newPath = join(CACHE_DIR, file);
    if (existsSync(oldPath) && !existsSync(newPath)) {
      try {
        mkdirSync(CACHE_DIR, { recursive: true });
        renameSync(oldPath, newPath);
      } catch {
        // best-effort
      }
    }
  }
}
