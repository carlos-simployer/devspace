import React from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { describe, it, expect, beforeEach } from "vitest";
import { Panel } from "./panel.tsx";
import { setTheme } from "./theme.ts";

beforeEach(() => {
  setTheme("default");
});

describe("Panel", () => {
  it("renders with title in top border", () => {
    const { lastFrame } = render(
      <Panel title="Files" width={30}>
        <Text>content</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("─ Files ─");
    expect(frame).toContain("╭");
    expect(frame).toContain("╮");
  });

  it("renders children inside borders", () => {
    const { lastFrame } = render(
      <Panel title="Test" width={30}>
        <Text>Hello world</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Hello world");
    expect(frame).toContain("│");
  });

  it("shows count in bottom border", () => {
    const { lastFrame } = render(
      <Panel title="Items" width={30} count="3 of 12">
        <Text>list</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("─ 3 of 12 ─");
    expect(frame).toContain("╰");
    expect(frame).toContain("╯");
  });

  it("renders both focused and unfocused without errors", () => {
    const unfocused = render(
      <Panel title="A" width={20}>
        <Text>x</Text>
      </Panel>,
    );
    const focused = render(
      <Panel title="A" width={20} focused>
        <Text>x</Text>
      </Panel>,
    );
    // Both should render the same structural content
    const unfocusedFrame = unfocused.lastFrame()!;
    const focusedFrame = focused.lastFrame()!;
    expect(unfocusedFrame).toContain("─ A ─");
    expect(focusedFrame).toContain("─ A ─");
    expect(unfocusedFrame).toContain("╭");
    expect(focusedFrame).toContain("╭");
  });

  it("handles merge.top flag", () => {
    const { lastFrame } = render(
      <Panel title="Merged" width={25} merge={{ top: true }}>
        <Text>body</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("├");
    expect(frame).toContain("┤");
    expect(frame).not.toContain("╭");
    expect(frame).not.toContain("╮");
  });

  it("handles merge.bottom flag", () => {
    const { lastFrame } = render(
      <Panel title="Merged" width={25} merge={{ bottom: true }}>
        <Text>body</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    // Top should be normal
    expect(frame).toContain("╭");
    expect(frame).toContain("╮");
    // Bottom should use merged corners
    expect(frame).toContain("├");
    expect(frame).toContain("┤");
    expect(frame).not.toContain("╰");
    expect(frame).not.toContain("╯");
  });

  it("handles merge.left flag (omits left border)", () => {
    const { lastFrame } = render(
      <Panel title="Left" width={20} merge={{ left: true }}>
        <Text>body</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    // Should not have left corner chars
    expect(frame).not.toContain("╭");
    expect(frame).not.toContain("╰");
    // Right corners should still be present
    expect(frame).toContain("╮");
    expect(frame).toContain("╯");
  });

  it("handles merge.right flag (omits right border)", () => {
    const { lastFrame } = render(
      <Panel title="Right" width={20} merge={{ right: true }}>
        <Text>body</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    // Left corners should still be present
    expect(frame).toContain("╭");
    expect(frame).toContain("╰");
    // Right corners should be omitted
    expect(frame).not.toContain("╮");
    expect(frame).not.toContain("╯");
  });

  it("works without optional props", () => {
    const { lastFrame } = render(
      <Panel width={20}>
        <Text>minimal</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("minimal");
    expect(frame).toContain("╭");
    expect(frame).toContain("╯");
    // No title text between dashes
    const lines = frame.split("\n");
    const topLine = lines[0]!;
    // Should just be dashes between corners (no title text)
    expect(topLine).not.toContain("─ ");
  });

  it("renders with explicit borderColor without errors", () => {
    const { lastFrame } = render(
      <Panel title="Custom" width={25} focused borderColor="red">
        <Text>body</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("─ Custom ─");
    expect(frame).toContain("body");
    expect(frame).toContain("╭");
    expect(frame).toContain("╯");
  });
});
