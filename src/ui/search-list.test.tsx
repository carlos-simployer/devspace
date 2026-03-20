import React from "react";
import { render } from "ink-testing-library";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchList } from "./search-list.tsx";
import { setTheme } from "./theme.ts";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  setTheme("default");
});

describe("SearchList", () => {
  const items = [
    { key: "alpha", label: "alpha-repo" },
    { key: "beta", label: "beta-repo" },
    { key: "gamma", label: "gamma-repo" },
  ];

  it("renders title and search input", () => {
    const { lastFrame } = render(
      <SearchList
        title="Add Repo"
        items={items}
        width={50}
        height={15}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Add Repo");
    expect(frame).toContain("Search:");
  });

  it("shows items in list", () => {
    const { lastFrame } = render(
      <SearchList
        title="Add Repo"
        items={items}
        width={50}
        height={15}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("alpha-repo");
    expect(frame).toContain("beta-repo");
    expect(frame).toContain("gamma-repo");
  });

  it("highlights active item", () => {
    const { lastFrame } = render(
      <SearchList
        title="Add Repo"
        items={items}
        width={50}
        height={15}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("alpha-repo");
    expect(frame).toContain("beta-repo");
  });

  it("calls onClose on Escape", async () => {
    const onClose = vi.fn();
    const { stdin } = render(
      <SearchList
        title="Add Repo"
        items={items}
        width={50}
        height={15}
        onSelect={vi.fn()}
        onClose={onClose}
      />,
    );
    await delay(0);
    stdin.write("\x1B");
    await delay(150);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onSelect on Enter", async () => {
    const onSelect = vi.fn();
    const { stdin } = render(
      <SearchList
        title="Add Repo"
        items={items}
        width={50}
        height={15}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );
    await delay(0);
    stdin.write("\r");
    await delay(0);
    expect(onSelect).toHaveBeenCalledWith(0, items[0]);
  });

  it("filters items based on query input", async () => {
    const { lastFrame, stdin } = render(
      <SearchList
        title="Add Repo"
        items={items}
        width={50}
        height={15}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await delay(0);
    stdin.write("b");
    await delay(0);
    stdin.write("e");
    await delay(0);
    stdin.write("t");
    await delay(0);
    stdin.write("a");
    await delay(0);
    const frame = lastFrame()!;
    expect(frame).toContain("beta-repo");
    expect(frame).not.toContain("alpha-repo");
    expect(frame).not.toContain("gamma-repo");
  });

  it("shows loading spinner when loading=true", async () => {
    const { lastFrame } = render(
      <SearchList
        title="Add Repo"
        items={[]}
        loading={true}
        loadingLabel="Loading repos..."
        width={50}
        height={15}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await delay(0);
    const frame = lastFrame()!;
    expect(frame).toContain("Loading repos...");
  });

  it("shows empty label when no items match", async () => {
    const { lastFrame, stdin } = render(
      <SearchList
        title="Add Repo"
        items={items}
        emptyLabel="No repos match"
        width={50}
        height={15}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await delay(0);
    stdin.write("z");
    await delay(0);
    stdin.write("z");
    await delay(0);
    stdin.write("z");
    await delay(0);
    const frame = lastFrame()!;
    expect(frame).toContain("No repos match");
  });
});
