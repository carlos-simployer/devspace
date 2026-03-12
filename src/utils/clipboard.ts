import { execSync } from "child_process";

export function copyToClipboard(text: string): boolean {
  try {
    const platform = process.platform;
    if (platform === "darwin") {
      execSync("pbcopy", { input: text, stdio: ["pipe", "pipe", "pipe"] });
    } else if (platform === "linux") {
      execSync("xclip -selection clipboard", {
        input: text,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } else if (platform === "win32") {
      execSync("clip", { input: text, stdio: ["pipe", "pipe", "pipe"] });
    } else {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
