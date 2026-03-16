import type { PullRequest } from "../api/types.ts";

export type TimeBucket = "Today" | "This week" | "Last week" | "Older";

const BUCKET_ORDER: TimeBucket[] = ["Today", "This week", "Last week", "Older"];

export function getBucket(createdAt: string): TimeBucket {
  const now = new Date();
  const created = new Date(createdAt);

  // Start of today (midnight local)
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  if (created >= startOfToday) return "Today";

  // Start of this week (Monday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset,
  );

  if (created >= startOfWeek) return "This week";

  // Start of last week
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  if (created >= startOfLastWeek) return "Last week";

  return "Older";
}

export interface PRGroup {
  label: TimeBucket;
  prs: PullRequest[];
}

export function groupByTimeBucket(prs: PullRequest[]): PRGroup[] {
  const buckets = new Map<TimeBucket, PullRequest[]>();

  for (const pr of prs) {
    const bucket = getBucket(pr.createdAt);
    const list = buckets.get(bucket);
    if (list) {
      list.push(pr);
    } else {
      buckets.set(bucket, [pr]);
    }
  }

  return BUCKET_ORDER.filter((b) => buckets.has(b)).map((b) => ({
    label: b,
    prs: buckets.get(b)!,
  }));
}

/** Return PRs reordered to match the time-bucket display order. */
export function orderByTimeBucket(prs: PullRequest[]): PullRequest[] {
  return groupByTimeBucket(prs).flatMap((g) => g.prs);
}

/** Build a flat row list with headers, mapping each PR to its original index. */
export type FlatRow =
  | { type: "header"; label: TimeBucket; count: number }
  | { type: "pr"; pr: PullRequest; prIndex: number };

export function flattenGroups(groups: PRGroup[]): FlatRow[] {
  const rows: FlatRow[] = [];
  let prIndex = 0;
  for (const group of groups) {
    rows.push({
      type: "header",
      label: group.label,
      count: group.prs.length,
    });
    for (const pr of group.prs) {
      rows.push({ type: "pr", pr, prIndex });
      prIndex++;
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Generic versions for any item type
// ---------------------------------------------------------------------------

export interface GenericGroup<T> {
  label: TimeBucket;
  items: T[];
}

/** Group items by time bucket using a date accessor. */
export function groupByTimeBucketGeneric<T>(
  items: T[],
  getDate: (item: T) => string,
): GenericGroup<T>[] {
  const buckets = new Map<TimeBucket, T[]>();

  for (const item of items) {
    const bucket = getBucket(getDate(item));
    const list = buckets.get(bucket);
    if (list) {
      list.push(item);
    } else {
      buckets.set(bucket, [item]);
    }
  }

  return BUCKET_ORDER.filter((b) => buckets.has(b)).map((b) => ({
    label: b,
    items: buckets.get(b)!,
  }));
}

export type GenericFlatRow<T> =
  | { type: "header"; label: TimeBucket; count: number }
  | { type: "item"; item: T; itemIndex: number };

/** Build a flat row list with headers for any item type. */
export function flattenGroupsGeneric<T>(
  groups: GenericGroup<T>[],
): GenericFlatRow<T>[] {
  const rows: GenericFlatRow<T>[] = [];
  let itemIndex = 0;
  for (const group of groups) {
    rows.push({
      type: "header",
      label: group.label,
      count: group.items.length,
    });
    for (const item of group.items) {
      rows.push({ type: "item", item, itemIndex });
      itemIndex++;
    }
  }
  return rows;
}
