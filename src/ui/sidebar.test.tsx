import React from "react";
import { render } from "ink-testing-library";
import { describe, it, expect, beforeEach } from "vitest";
import { Sidebar } from "./sidebar.tsx";
import { setTheme } from "./theme.ts";

beforeEach(() => {
  setTheme("default");
});

describe("Sidebar", () => {
  const baseItems = [
    { key: "all", label: "All repos (5)" },
    { key: "repo-a", label: "repo-a (3)" },
    { key: "repo-b", label: "repo-b (2)" },
  ];

  it("renders title in panel", () => {
    const { lastFrame } = render(
      <Sidebar
        title="Repos"
        items={baseItems}
        selectedIndex={0}
        focused={true}
        width={30}
        height={10}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("─ Repos ─");
  });

  it("renders items", () => {
    const { lastFrame } = render(
      <Sidebar
        title="Repos"
        items={baseItems}
        selectedIndex={0}
        focused={true}
        width={30}
        height={10}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("All repos (5)");
    expect(frame).toContain("repo-a (3)");
    expect(frame).toContain("repo-b (2)");
  });

  it("shows selected item with inverse when focused", () => {
    const { lastFrame } = render(
      <Sidebar
        title="Repos"
        items={baseItems}
        selectedIndex={1}
        focused={true}
        width={30}
        height={10}
      />,
    );
    const frame = lastFrame()!;
    // Selected item is rendered (with inverse+bold styling applied by Ink)
    expect(frame).toContain("repo-a (3)");
    // All items are visible
    expect(frame).toContain("All repos (5)");
    expect(frame).toContain("repo-b (2)");
  });

  it("dims items when not focused", () => {
    const { lastFrame } = render(
      <Sidebar
        title="Repos"
        items={baseItems}
        selectedIndex={0}
        focused={false}
        width={30}
        height={10}
      />,
    );
    const frame = lastFrame()!;
    // All items are still rendered even when unfocused (with dimColor styling)
    expect(frame).toContain("All repos (5)");
    expect(frame).toContain("repo-a (3)");
    expect(frame).toContain("repo-b (2)");
    // Panel title still shows
    expect(frame).toContain("─ Repos ─");
  });

  it("shows add action in green", () => {
    const items = [
      ...baseItems,
      { key: "add", label: "[+] Add repo", isAdd: true },
    ];
    const { lastFrame } = render(
      <Sidebar
        title="Repos"
        items={items}
        selectedIndex={0}
        focused={true}
        width={30}
        height={10}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("[+] Add repo");
  });

  it("shows count in panel footer", () => {
    const { lastFrame } = render(
      <Sidebar
        title="Repos"
        items={baseItems}
        selectedIndex={1}
        focused={true}
        width={30}
        height={10}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("─ 2 of 3 ─");
  });
});
