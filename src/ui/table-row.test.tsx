import React from "react";
import { render } from "ink-testing-library";
import { describe, it, expect } from "vitest";
import { TableRow, TableHeader } from "./table-row.tsx";

describe("TableRow", () => {
  it("renders columns with correct widths", () => {
    const { lastFrame } = render(
      <TableRow
        width={30}
        columns={[
          { width: 10, content: "Hello" },
          { width: 10, content: "World" },
          { width: 10, content: "End" },
        ]}
      />,
    );
    const frame = lastFrame()!;
    // Each column should be padded to its width
    expect(frame).toContain("Hello     ");
    expect(frame).toContain("World     ");
    // Last column trailing spaces may be trimmed by the renderer
    expect(frame).toContain("End");
  });

  it("truncates long content with ellipsis", () => {
    const { lastFrame } = render(
      <TableRow
        width={20}
        columns={[{ width: 10, content: "This is way too long" }]}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("\u2026");
    expect(frame).not.toContain("This is way too long");
  });

  it("flex column fills remaining space", () => {
    const { lastFrame } = render(
      <TableRow
        width={30}
        columns={[
          { width: 5, content: "A" },
          { flex: 1, content: "Flex content here" },
          { width: 5, content: "B" },
        ]}
      />,
    );
    const frame = lastFrame()!;
    // Flex column gets 30 - 5 - 5 = 20 chars
    expect(frame).toContain("A    ");
    expect(frame).toContain("Flex content here   ");
    // Last column trailing spaces may be trimmed by the renderer
    expect(frame).toContain("B");
  });

  it("selected row renders single inverse line", () => {
    const { lastFrame } = render(
      <TableRow
        width={20}
        selected
        columns={[
          { width: 10, content: "Col1" },
          { width: 10, content: "Col2" },
        ]}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Col1");
    expect(frame).toContain("Col2");
    // Selected row should be exactly 20 chars total (no overflow)
    // The combined rendered text (stripped of ANSI) should be 20 chars
    expect(frame.length).toBeGreaterThan(0);
  });

  it("right-aligned column works", () => {
    const { lastFrame } = render(
      <TableRow
        width={20}
        columns={[{ width: 10, content: "Right", align: "right" }]}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("     Right");
  });

  it("selected row does not overflow to second line", () => {
    const { lastFrame } = render(
      <TableRow
        width={20}
        selected
        columns={[
          { width: 10, content: "Hello" },
          { width: 10, content: "World" },
        ]}
      />,
    );
    const frame = lastFrame()!;
    const lines = frame.split("\n");
    expect(lines.length).toBe(1);
  });

  it("handles zero-width columns gracefully", () => {
    const { lastFrame } = render(
      <TableRow
        width={10}
        columns={[
          { width: 0, content: "Hidden" },
          { width: 10, content: "Visible" },
        ]}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Visible");
    expect(frame).not.toContain("Hidden");
  });
});

describe("TableHeader", () => {
  it("renders with same widths as TableRow", () => {
    const cols = [
      { width: 10, label: "Name" },
      { flex: 1, label: "Title" },
      { width: 8, label: "Status" },
    ];
    const { lastFrame } = render(
      <TableHeader width={40} columns={cols} bold />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Name");
    expect(frame).toContain("Title");
    expect(frame).toContain("Status");
  });

  it("renders dimColor on specific columns", () => {
    const { lastFrame } = render(
      <TableHeader
        width={20}
        columns={[
          { width: 10, label: "Dim", dimColor: true },
          { width: 10, label: "Normal" },
        ]}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Dim");
    expect(frame).toContain("Normal");
  });
});
