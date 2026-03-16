import { join } from "path";
import { homedir } from "os";

export const APP_NAME = "devhub";

export const DEFAULT_CONFIG_DIR = join(homedir(), ".config", APP_NAME);
export const CACHE_DIR = join(homedir(), ".cache", APP_NAME);
