import React from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { describe, it, expect } from "vitest";
import { DetailPanel } from "./detail-panel.tsx";
import type { DetailTab, ContentLine } from "./detail-panel.tsx";

const makeTabs = (): DetailTab[] => [
  { id: "overview", label: "d Overview" },
  { id: "files", label: "f Files (3)" },
];

const makeLines = (count: number): ContentLine[] =>
  Array.from({ length: count }, (_, i) => ({
    key: `line-${i}`,
    node: <Text>Line {i}</Text>,
  }));

describe("DetailPanel", () => {
  it("renders tab bar with active tab highlighted", () => {
    const { lastFrame } = render(
      <DetailPanel
        tabs={makeTabs()}
        activeTab="overview"
        lines={makeLines(3)}
        scrollOffset={0}
        height={12}
        width={50}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("d Overview");
    expect(frame).toContain("f Files (3)");
  });

  it("renders content lines", () => {
    const { lastFrame } = render(
      <DetailPanel
        tabs={makeTabs()}
        activeTab="overview"
        lines={makeLines(3)}
        scrollOffset={0}
        height={12}
        width={50}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Line 0");
    expect(frame).toContain("Line 1");
    expect(frame).toContain("Line 2");
  });

  it("renders footer when provided", () => {
    const { lastFrame } = render(
      <DetailPanel
        tabs={makeTabs()}
        activeTab="overview"
        lines={makeLines(2)}
        scrollOffset={0}
        height={12}
        width={50}
        footer={<Text>Esc: close | o: browser</Text>}
      />,
    );
    expect(lastFrame()!).toContain("Esc: close");
  });

  it("scrolls content based on scrollOffset", () => {
    // height=8, borders=2, tabBar+sep=2, no footer => viewport=4
    const lines = makeLines(10);
    const { lastFrame } = render(
      <DetailPanel
        tabs={makeTabs()}
        activeTab="overview"
        lines={lines}
        scrollOffset={3}
        height={8}
        width={50}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Line 3");
    expect(frame).toContain("Line 4");
    expect(frame).toContain("Line 5");
    expect(frame).toContain("Line 6");
    expect(frame).not.toContain("Line 0");
    expect(frame).not.toContain("Line 1");
    expect(frame).not.toContain("Line 2");
  });

  it("shows scrollbar when content exceeds viewport", () => {
    // height=8, borders=2, tabBar+sep=2, no footer => viewport=4
    // 10 lines > 4 viewport => scrollbar should appear
    const lines = makeLines(10);
    const { lastFrame } = render(
      <DetailPanel
        tabs={makeTabs()}
        activeTab="overview"
        lines={lines}
        scrollOffset={0}
        height={8}
        width={50}
      />,
    );
    const frame = lastFrame()!;
    // ScrollBar renders "┃" for thumb and "│" for track
    expect(frame).toContain("\u2503");
  });
});
