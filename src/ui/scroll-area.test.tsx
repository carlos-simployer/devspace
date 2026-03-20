import React from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { describe, it, expect, beforeEach } from "vitest";
import { ScrollArea } from "./scroll-area.tsx";
import { setTheme } from "./theme.ts";

beforeEach(() => {
  setTheme("default");
});

describe("ScrollArea", () => {
  it("renders children content", () => {
    const { lastFrame } = render(
      <ScrollArea totalItems={5} scrollOffset={0} height={10}>
        <Text>Item 1</Text>
        <Text>Item 2</Text>
      </ScrollArea>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Item 1");
    expect(frame).toContain("Item 2");
  });

  it("does not show scroll bar when items fit in viewport", () => {
    const { lastFrame } = render(
      <ScrollArea totalItems={3} scrollOffset={0} height={10}>
        <Text>A</Text>
        <Text>B</Text>
        <Text>C</Text>
      </ScrollArea>,
    );
    const frame = lastFrame()!;
    // No scroll bar characters
    expect(frame).not.toMatch(/[┃│]/);
  });

  it("shows scroll bar when items exceed viewport", () => {
    const { lastFrame } = render(
      <ScrollArea totalItems={50} scrollOffset={0} height={10}>
        <Text>Visible content</Text>
      </ScrollArea>,
    );
    const frame = lastFrame()!;
    // Should contain scroll bar characters (thumb or track)
    expect(frame).toMatch(/[┃│]/);
  });

  it("hides scroll bar when showScrollBar is false", () => {
    const { lastFrame } = render(
      <ScrollArea
        totalItems={50}
        scrollOffset={0}
        height={10}
        showScrollBar={false}
      >
        <Text>Content</Text>
      </ScrollArea>,
    );
    const frame = lastFrame()!;
    // Only the content text, no scroll indicators
    expect(frame).toContain("Content");
    expect(frame).not.toMatch(/[┃│]/);
  });

  it("renders with scroll bar alongside content", () => {
    const items = Array.from({ length: 5 }, (_, i) => (
      <Text key={i}>Row {i}</Text>
    ));
    const { lastFrame } = render(
      <ScrollArea totalItems={50} scrollOffset={0} height={5}>
        {items}
      </ScrollArea>,
    );
    const frame = lastFrame()!;
    // Content should be present
    expect(frame).toContain("Row 0");
    expect(frame).toContain("Row 4");
    // Scroll bar should be present
    expect(frame).toMatch(/[┃│]/);
  });

  it("works with totalItems equal to height (no scroll bar)", () => {
    const { lastFrame } = render(
      <ScrollArea totalItems={10} scrollOffset={0} height={10}>
        <Text>Exact fit</Text>
      </ScrollArea>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Exact fit");
    expect(frame).not.toMatch(/[┃│]/);
  });

  it("renders empty children without errors", () => {
    const { lastFrame } = render(
      <ScrollArea totalItems={0} scrollOffset={0} height={10}>
        {null}
      </ScrollArea>,
    );
    const frame = lastFrame()!;
    // Should render without crashing
    expect(frame).toBeDefined();
  });
});
