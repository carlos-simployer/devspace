import React from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { describe, it, expect } from "vitest";
import { SelectableListItem } from "./selectable-list-item.tsx";

describe("SelectableListItem", () => {
  it('renders "> " prefix when isSelected=true', () => {
    const { lastFrame } = render(
      <SelectableListItem isSelected={true}>
        <Text>Item</Text>
      </SelectableListItem>,
    );
    expect(lastFrame()).toContain("> ");
  });

  it('renders "  " prefix when isSelected=false', () => {
    const { lastFrame } = render(
      <SelectableListItem isSelected={false}>
        <Text>Item</Text>
      </SelectableListItem>,
    );
    const frame = lastFrame()!;
    expect(frame).not.toContain("> ");
    expect(frame).toContain("  Item");
  });

  it("renders children content", () => {
    const { lastFrame } = render(
      <SelectableListItem isSelected={false}>
        <Text>Hello World</Text>
      </SelectableListItem>,
    );
    expect(lastFrame()).toContain("Hello World");
  });
});
