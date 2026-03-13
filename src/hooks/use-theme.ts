import { getTheme, type Theme } from "../ui/theme.ts";

export function useTheme(): Theme {
  return getTheme();
}
