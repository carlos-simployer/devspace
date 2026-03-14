import type { AppView } from "../api/types.ts";

interface Key {
  tab?: boolean;
  shift?: boolean;
  escape?: boolean;
}

interface GlobalKeyOptions {
  onQuit: () => void;
  onSwitchView: (target?: AppView, reverse?: boolean) => void;
  onHelp: () => void;
}

/**
 * Process global key bindings shared across all views.
 * Returns true if the key was handled.
 * Call this inside useInput handlers.
 */
export function handleGlobalKeys(
  input: string,
  key: Key,
  options: GlobalKeyOptions,
): boolean {
  if (input === "q") {
    options.onQuit();
    return true;
  }
  if (key.tab) {
    options.onSwitchView(undefined, key.shift);
    return true;
  }
  if (input === "1") {
    options.onSwitchView("prs");
    return true;
  }
  if (input === "2") {
    options.onSwitchView("dependencies");
    return true;
  }
  if (input === "3") {
    options.onSwitchView("pipelines");
    return true;
  }
  if (input === "4") {
    options.onSwitchView("releases");
    return true;
  }
  if (input === "5") {
    options.onSwitchView("config");
    return true;
  }
  if (input === "?") {
    options.onHelp();
    return true;
  }
  return false;
}
