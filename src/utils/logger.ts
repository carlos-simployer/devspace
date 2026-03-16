import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";
import { CACHE_DIR } from "../constants.ts";

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
}

const MAX_ENTRIES = 500;
const LOG_FILE = join(CACHE_DIR, "devhub.log");

// Ring buffer
const entries: LogEntry[] = [];
let dirCreated = false;

// Subscription for React
type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

function notify() {
  version++;
  for (const fn of listeners) fn();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): number {
  return version;
}

function writeToFile(entry: LogEntry) {
  try {
    if (!dirCreated) {
      mkdirSync(CACHE_DIR, { recursive: true });
      dirCreated = true;
    }
    const ts = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const line = `[${ts}] [${level}] [${entry.category}] ${entry.message}\n`;
    appendFileSync(LOG_FILE, line);
  } catch {
    // best-effort
  }
}

export function log(level: LogLevel, category: string, message: string): void {
  const entry: LogEntry = { timestamp: Date.now(), level, category, message };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  writeToFile(entry);
  notify();
}

export function info(category: string, message: string): void {
  log("info", category, message);
}

export function warn(category: string, message: string): void {
  log("warn", category, message);
}

export function error(category: string, message: string): void {
  log("error", category, message);
}

export function getLogEntries(): LogEntry[] {
  return entries;
}

export function clearLog(): void {
  entries.length = 0;
  notify();
}
