import React from "react";
import { render } from "ink-testing-library";
import { Box, Text } from "ink";
import { describe, it, expect, beforeEach } from "vitest";
import { ScrollBar } from "./scroll-bar.tsx";
import { setTheme } from "./theme.ts";

beforeEach(() => {
  setTheme("default");
});

describe("ScrollBar", () => {
  it("renders nothing when all items fit in viewport", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={5}
        visibleItems={10}
        scrollOffset={0}
        height={10}
      />,
    );
    expect(lastFrame()).toBe("");
  });

  it("renders nothing when items equal viewport", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={10}
        visibleItems={10}
        scrollOffset={0}
        height={10}
      />,
    );
    expect(lastFrame()).toBe("");
  });

  it("renders nothing when height is 0", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={100}
        visibleItems={10}
        scrollOffset={0}
        height={0}
      />,
    );
    expect(lastFrame()).toBe("");
  });

  it("renders a scroll bar when items exceed viewport", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={100}
        visibleItems={10}
        scrollOffset={0}
        height={10}
      />,
    );
    const frame = lastFrame()!;
    // Should have content (track and/or thumb characters)
    expect(frame.length).toBeGreaterThan(0);
    // Should contain track or thumb characters
    expect(frame).toMatch(/[┃│]/);
  });

  it("renders correct number of rows matching height", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={50}
        visibleItems={10}
        scrollOffset={0}
        height={10}
      />,
    );
    const frame = lastFrame()!;
    const lines = frame.split("\n");
    expect(lines).toHaveLength(10);
  });

  it("has thumb at top when scrollOffset is 0", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={50}
        visibleItems={10}
        scrollOffset={0}
        height={10}
        thumb="X"
        track="."
      />,
    );
    const frame = lastFrame()!;
    const lines = frame.split("\n");
    // First line should be thumb
    expect(lines[0]).toContain("X");
  });

  it("has thumb at bottom when scrolled to end", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={50}
        visibleItems={10}
        scrollOffset={40}
        height={10}
        thumb="X"
        track="."
      />,
    );
    const frame = lastFrame()!;
    const lines = frame.split("\n");
    // Last line should be thumb
    expect(lines[lines.length - 1]).toContain("X");
  });

  it("thumb moves to middle at halfway scroll", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={50}
        visibleItems={10}
        scrollOffset={20}
        height={10}
        thumb="X"
        track="."
      />,
    );
    const frame = lastFrame()!;
    const lines = frame.split("\n");
    // Thumb should be somewhere in the middle, not at top or bottom edges only
    const thumbLines = lines.filter((l) => l.includes("X"));
    const trackLines = lines.filter((l) => l.includes("."));
    expect(thumbLines.length).toBeGreaterThan(0);
    expect(trackLines.length).toBeGreaterThan(0);
  });

  it("thumb size is proportional to visible/total ratio", () => {
    // With 50% visibility, thumb should take about half the height
    const { lastFrame } = render(
      <ScrollBar
        totalItems={20}
        visibleItems={10}
        scrollOffset={0}
        height={10}
        thumb="X"
        track="."
      />,
    );
    const frame = lastFrame()!;
    const lines = frame.split("\n");
    const thumbCount = lines.filter((l) => l.includes("X")).length;
    // 10/20 * 10 = 5 rows of thumb
    expect(thumbCount).toBe(5);
  });

  it("thumb size is at least 1 row", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={1000}
        visibleItems={10}
        scrollOffset={0}
        height={10}
        thumb="X"
        track="."
      />,
    );
    const frame = lastFrame()!;
    const lines = frame.split("\n");
    const thumbCount = lines.filter((l) => l.includes("X")).length;
    expect(thumbCount).toBeGreaterThanOrEqual(1);
  });

  it("uses custom thumb and track characters", () => {
    const { lastFrame } = render(
      <ScrollBar
        totalItems={50}
        visibleItems={10}
        scrollOffset={0}
        height={5}
        thumb="#"
        track="-"
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("#");
    expect(frame).toContain("-");
  });

  it("clamps scrollOffset beyond max", () => {
    // scrollOffset > totalItems - visibleItems should clamp to bottom
    const { lastFrame } = render(
      <ScrollBar
        totalItems={50}
        visibleItems={10}
        scrollOffset={999}
        height={10}
        thumb="X"
        track="."
      />,
    );
    const frame = lastFrame()!;
    const lines = frame.split("\n");
    // Thumb should be at the bottom
    expect(lines[lines.length - 1]).toContain("X");
  });
});
