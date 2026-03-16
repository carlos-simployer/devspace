import { exec } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { promisify } from "util";

const execAsync = promisify(exec);

export type AzureAuthType = "bearer" | "basic";

interface CachedToken {
  token: string;
  authType: AzureAuthType;
  expiresOn: number;
}

let cachedToken: CachedToken | null = null;

const AZURE_RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";
const EXPIRY_BUFFER_MS = 60_000; // refresh 60s before expiry

export async function getAzureToken(): Promise<{
  token: string;
  authType: AzureAuthType;
} | null> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresOn - Date.now() > EXPIRY_BUFFER_MS) {
    return { token: cachedToken.token, authType: cachedToken.authType };
  }

  // Check config file for PAT
  try {
    const configPath = join(homedir(), ".config", "devspace", "config.json");
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));
    if (raw.azureToken) {
      cachedToken = {
        token: raw.azureToken,
        authType: "basic",
        expiresOn: Date.now() + 365 * 24 * 60 * 60_000, // PATs don't expire via this check
      };
      return { token: raw.azureToken, authType: "basic" };
    }
  } catch {
    // no config or no token
  }

  // Try az CLI
  try {
    const { stdout } = await execAsync(
      `az account get-access-token --resource ${AZURE_RESOURCE} --output json`,
    );
    const parsed = JSON.parse(stdout);
    cachedToken = {
      token: parsed.accessToken,
      authType: "bearer",
      expiresOn: new Date(parsed.expiresOn).getTime(),
    };
    return { token: cachedToken.token, authType: cachedToken.authType };
  } catch {
    // az CLI not available or not logged in
  }

  // Fallback to env var (PAT — no expiry tracking)
  const envToken = process.env.AZURE_DEVOPS_TOKEN;
  if (envToken) return { token: envToken, authType: "basic" };

  return null;
}
