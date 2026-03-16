import { join } from "path";
import { homedir } from "os";

export const APP_NAME = "devhub";

const DIR_NAME = "devhub";
export const DEFAULT_CONFIG_DIR = join(homedir(), ".config", DIR_NAME);
export const CACHE_DIR = join(homedir(), ".cache", DIR_NAME);
