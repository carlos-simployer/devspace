import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface CachedToken {
  token: string;
  expiresOn: number;
}

let cachedToken: CachedToken | null = null;

const AZURE_RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";
const EXPIRY_BUFFER_MS = 60_000; // refresh 60s before expiry

export async function getAzureToken(): Promise<string | null> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresOn - Date.now() > EXPIRY_BUFFER_MS) {
    return cachedToken.token;
  }

  // Try az CLI
  try {
    const { stdout } = await execAsync(
      `az account get-access-token --resource ${AZURE_RESOURCE} --output json`,
    );
    const parsed = JSON.parse(stdout);
    cachedToken = {
      token: parsed.accessToken,
      expiresOn: new Date(parsed.expiresOn).getTime(),
    };
    return cachedToken.token;
  } catch {
    // az CLI not available or not logged in
  }

  // Fallback to env var (PAT — no expiry tracking)
  const envToken = process.env.AZURE_DEVOPS_TOKEN;
  if (envToken) return envToken;

  return null;
}
