import { useState, useEffect } from "react";
import { execSync } from "child_process";

export function useGithubAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const ghToken = execSync("gh auth token", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      if (ghToken) {
        setToken(ghToken);
        return;
      }
    } catch {
      // gh CLI not available or not authenticated
    }

    const envToken = process.env.GITHUB_TOKEN;
    if (envToken) {
      setToken(envToken);
      return;
    }

    setError(
      "No GitHub token found. Install gh CLI and run `gh auth login`, or set GITHUB_TOKEN env var.",
    );
  }, []);

  return { token, error };
}
