import { describe, it, expect } from "vitest";
import { COL, getTitleWidth } from "./columns.ts";

describe("COL constants", () => {
  it("has expected fixed column sum of 67", () => {
    const sum =
      COL.selector +
      COL.repo +
      COL.num +
      COL.author +
      COL.review +
      COL.ci +
      COL.merge +
      COL.age +
      COL.updated;
    expect(sum).toBe(67);
  });
});

describe("getTitleWidth", () => {
  it("returns totalWidth minus fixed columns for normal width", () => {
    expect(getTitleWidth(120)).toBe(53);
  });

  it("returns correct width for wide terminal", () => {
    expect(getTitleWidth(200)).toBe(133);
  });

  it("returns 10 when totalWidth equals fixed columns (67)", () => {
    expect(getTitleWidth(67)).toBe(10);
  });

  it("returns 10 when totalWidth is less than fixed columns", () => {
    expect(getTitleWidth(50)).toBe(10);
  });

  it("returns 10 when totalWidth is 0", () => {
    expect(getTitleWidth(0)).toBe(10);
  });

  it("returns 10 when totalWidth is very small", () => {
    expect(getTitleWidth(10)).toBe(10);
  });

  it("returns exactly 10 when totalWidth is 77 (67 + 10)", () => {
    expect(getTitleWidth(77)).toBe(10);
  });

  it("returns 11 when totalWidth is 78 (67 + 11)", () => {
    expect(getTitleWidth(78)).toBe(11);
  });
});
