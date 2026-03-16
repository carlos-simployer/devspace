import { readFileSync } from "fs";
import { join } from "path";
import { DEFAULT_CONFIG_DIR } from "../constants.ts";

const CONFIG_PATH = join(DEFAULT_CONFIG_DIR, "config.json");

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function readConfigFile(): any {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return null;
  }
}
