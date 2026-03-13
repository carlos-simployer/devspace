import { describe, it, expect } from "vitest";
import { fuzzyMatch, fuzzyScore } from "./fuzzy.ts";

describe("fuzzyMatch", () => {
  it("exact match returns true", () => {
    expect(fuzzyMatch("react", "react")).toBe(true);
  });

  it("substring match returns true", () => {
    expect(fuzzyMatch("my-react-app", "react")).toBe(true);
  });

  it("case insensitive match", () => {
    expect(fuzzyMatch("React", "react")).toBe(true);
    expect(fuzzyMatch("react", "REACT")).toBe(true);
  });

  it("fuzzy subsequence match", () => {
    expect(fuzzyMatch("react", "rct")).toBe(true);
    expect(fuzzyMatch("typescript", "tsc")).toBe(true);
  });

  it("non-matching returns false", () => {
    expect(fuzzyMatch("react", "xyz")).toBe(false);
  });

  it("empty query matches everything", () => {
    expect(fuzzyMatch("anything", "")).toBe(true);
    expect(fuzzyMatch("", "")).toBe(true);
  });

  it("query longer than name returns false if not a subsequence", () => {
    expect(fuzzyMatch("ab", "abcdef")).toBe(false);
  });
});

describe("fuzzyScore", () => {
  it("name starts with query returns score 3", () => {
    expect(fuzzyScore("react-app", "react")).toBe(3);
  });

  it("name contains query returns score 2", () => {
    expect(fuzzyScore("my-react-app", "react")).toBe(2);
  });

  it("fuzzy match only returns score 1", () => {
    expect(fuzzyScore("react", "rct")).toBe(1);
  });

  it("case insensitive scoring", () => {
    expect(fuzzyScore("React-app", "react")).toBe(3);
    expect(fuzzyScore("my-React-app", "react")).toBe(2);
  });
});
