import { Writable } from "stream";

/**
 * Creates a patched stdout wrapper that replaces Ink's clearTerminal
 * (\x1b[2J\x1b[3J\x1b[H) with just cursor-home (\x1b[H) + clear-below (\x1b[J).
 *
 * This eliminates fullscreen flicker because instead of:
 *   clear entire screen → write output (visible blank flash)
 * we get:
 *   move cursor to top → overwrite in place → clear leftover lines
 */

const CLEAR_TERMINAL = "\x1b[2J\x1b[3J\x1b[H";
const CURSOR_HOME = "\x1b[H";
const CLEAR_BELOW = "\x1b[J";
const CLEAR_EOL = "\x1b[K";

export function createPatchedStdout(): typeof process.stdout {
  const original = process.stdout;

  const patched = new Writable({
    write(
      chunk: Buffer | string,
      encoding: BufferEncoding,
      callback: () => void,
    ) {
      let str = typeof chunk === "string" ? chunk : chunk.toString("utf-8");

      if (str.includes(CLEAR_TERMINAL)) {
        str = str.replace(CLEAR_TERMINAL, CURSOR_HOME);
        // Add clear-to-end-of-line after each line so leftover chars
        // from the previous frame (including ANSI bg colors) are erased
        str = str
          .split("\n")
          .map((line) => line + CLEAR_EOL)
          .join("\n");
        str += CLEAR_BELOW;
      }

      original.write(str, "utf-8", callback);
    },
  });

  // Proxy all properties and methods from the real stdout
  return new Proxy(patched, {
    get(target, prop, receiver) {
      // Use patched write
      if (prop === "write") {
        return target.write.bind(target);
      }
      // Everything else goes to the real stdout
      const value = (original as any)[prop];
      if (typeof value === "function") {
        return value.bind(original);
      }
      return value;
    },
    set(_target, prop, value) {
      (original as any)[prop] = value;
      return true;
    },
  }) as unknown as typeof process.stdout;
}
