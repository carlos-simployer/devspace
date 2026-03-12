import { marked } from "marked";
// @ts-expect-error no type declarations
import { markedTerminal } from "marked-terminal";

marked.use(
  markedTerminal({
    width: 80,
    reflowText: true,
    showSectionPrefix: false,
    tab: 2,
  }),
);

export function renderMarkdown(text: string): string {
  if (!text) return "No description provided.";
  return (marked.parse(text) as string).trimEnd();
}
