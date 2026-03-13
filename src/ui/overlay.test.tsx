import React from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { describe, it, expect } from "vitest";
import { Overlay } from "./overlay.tsx";

describe("Overlay", () => {
  it("renders title text", () => {
    const { lastFrame } = render(
      <Overlay title="My Title" width={40}>
        <Text>Body</Text>
      </Overlay>,
    );
    expect(lastFrame()).toContain("My Title");
  });

  it("renders children content", () => {
    const { lastFrame } = render(
      <Overlay title="Title" width={40}>
        <Text>Overlay content here</Text>
      </Overlay>,
    );
    expect(lastFrame()).toContain("Overlay content here");
  });

  it("renders footer when provided", () => {
    const { lastFrame } = render(
      <Overlay title="Title" width={40} footer={<Text>Footer text</Text>}>
        <Text>Body</Text>
      </Overlay>,
    );
    expect(lastFrame()).toContain("Footer text");
  });
});
