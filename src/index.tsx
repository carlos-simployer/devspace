import React from "react";
import { render } from "ink";
import { execSync } from "child_process";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createClient } from "./api/client.ts";
import { App } from "./app.tsx";
import { createPatchedStdout } from "./patched-stdout.ts";
import { createFilePersister } from "./utils/query-persister.ts";

// Parse CLI args
const args = process.argv.slice(2);
let org: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--org" && args[i + 1]) {
    org = args[i + 1];
    i++;
  }
}

org = org || process.env.GITHUB_ORG;

// Resolve auth token
function getToken(): string {
  try {
    const ghToken = execSync("gh auth token", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (ghToken) return ghToken;
  } catch {
    // gh CLI not available
  }

  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) return envToken;

  console.error(
    "No GitHub token found. Install gh CLI and run `gh auth login`, or set GITHUB_TOKEN.",
  );
  return process.exit(1) as never;
}

const token = getToken();
const client = createClient(token);

// Enter alternate screen buffer + hide cursor
process.stdout.write("\x1b[?1049h\x1b[?25l");

function cleanup() {
  // Show cursor + exit alternate screen buffer
  process.stdout.write("\x1b[?25h\x1b[?1049l");
}

process.on("exit", cleanup);

// Use patched stdout to avoid fullscreen flicker
const patchedStdout = createPatchedStdout();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60_000, // 24h — persist across restarts
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createFilePersister();

// Use non-blocking persistence — doesn't pause queries during restore
persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60_000, // 24h
});

const instance = render(
  <QueryClientProvider client={queryClient}>
    <App client={client} org={org} token={token} />
  </QueryClientProvider>,
  {
    exitOnCtrlC: true,
    stdout: patchedStdout,
  },
);

await instance.waitUntilExit();
cleanup();
process.exit(0);
