// Shared column widths for PR list header and rows
export const COL = {
  selector: 2, // ">" or " " + space
  repo: 14,
  num: 6, // "#" + number
  author: 34,
  review: 4, // icon + padding
  ci: 4, // icon + padding
  age: 7, // time since opened
  updated: 7,
} as const;

export function getTitleWidth(totalWidth: number): number {
  const fixed =
    COL.selector +
    COL.repo +
    COL.num +
    COL.author +
    COL.review +
    COL.ci +
    COL.age +
    COL.updated;
  return Math.max(10, totalWidth - fixed);
}
