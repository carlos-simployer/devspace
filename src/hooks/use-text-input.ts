import { useState, useCallback } from "react";

/**
 * Manages text input state for manual character-by-character input
 * via Ink's `useInput`. This replaces the duplicated pattern found
 * in search overlays where backspace removes the last character,
 * printable characters are appended, and ctrl/meta combos are ignored.
 *
 * Usage:
 * ```ts
 * const { query, setQuery, handleInput } = useTextInput({ onChange });
 *
 * useInput((input, key) => {
 *   if (key.escape) { ... return; }
 *   if (key.upArrow) { ... return; }
 *   handleInput(input, key);
 * });
 * ```
 */

export interface UseTextInputOptions {
  /** Called whenever the query value changes (after append or delete). */
  onChange?: (value: string) => void;
}

export interface UseTextInputResult {
  /** The current query string. */
  query: string;
  /** Directly set the query (e.g. to reset it). */
  setQuery: (value: string | ((prev: string) => string)) => void;
  /** Clear the query to an empty string. */
  clear: () => void;
  /**
   * Pass this as the body of a `useInput` handler (or call it from within one)
   * to handle backspace/delete and printable character input.
   *
   * Returns `true` if the input was handled (text was modified),
   * `false` otherwise (e.g. ctrl/meta key combo).
   */
  handleInput: (input: string, key: InkKey) => boolean;
}

/** Minimal shape of the key object from Ink's `useInput`. */
export interface InkKey {
  backspace?: boolean;
  delete?: boolean;
  ctrl?: boolean;
  meta?: boolean;
}

export interface TextInputResult {
  /** Whether the input was handled (text was modified). */
  handled: boolean;
  /** The new query value. Only meaningful when `handled` is `true`. */
  value: string;
}

/**
 * Pure function that computes the next query value given the current
 * value and an input event from Ink's `useInput`.
 *
 * Returns `{ handled: true, value }` when the input modified the query,
 * or `{ handled: false, value: current }` when the input was ignored
 * (ctrl/meta combo or empty non-modifier input).
 */
export function handleTextInput(
  current: string,
  input: string,
  key: InkKey,
): TextInputResult {
  if (key.backspace || key.delete) {
    return { handled: true, value: current.slice(0, -1) };
  }
  if (input && !key.ctrl && !key.meta) {
    return { handled: true, value: current + input };
  }
  return { handled: false, value: current };
}

export function useTextInput(
  options?: UseTextInputOptions,
): UseTextInputResult {
  const [query, setQueryRaw] = useState("");
  const onChange = options?.onChange;

  const setQuery = useCallback(
    (value: string | ((prev: string) => string)) => {
      setQueryRaw((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        if (next !== prev && onChange) {
          onChange(next);
        }
        return next;
      });
    },
    [onChange],
  );

  const clear = useCallback(() => {
    setQuery("");
  }, [setQuery]);

  const handleInput = useCallback(
    (input: string, key: InkKey): boolean => {
      if (key.backspace || key.delete) {
        setQuery((q) => q.slice(0, -1));
        return true;
      }
      if (input && !key.ctrl && !key.meta) {
        setQuery((q) => q + input);
        return true;
      }
      return false;
    },
    [setQuery],
  );

  return { query, setQuery, clear, handleInput };
}
