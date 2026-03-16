import { useEffect } from "react";
import { APP_NAME } from "../constants.ts";
import { getTabs, getBaseRoute } from "../ui/tabs.ts";

/**
 * Sets the terminal tab/window title to reflect the current view.
 * Resets the title on unmount.
 */
export function useTerminalTitle(route: string): void {
  useEffect(() => {
    const base = getBaseRoute(route);
    const tab = getTabs().find((t) => t.route === base);
    const title = tab ? `${APP_NAME} — ${tab.label}` : APP_NAME;
    process.stdout.write(`\x1b]0;${title}\x07`);
  }, [route]);

  useEffect(() => {
    return () => {
      process.stdout.write("\x1b]0;\x07");
    };
  }, []);
}
