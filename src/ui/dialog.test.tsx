import React from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { describe, it, expect } from "vitest";
import { Dialog, DialogLayer } from "./dialog.tsx";

describe("Dialog", () => {
  it("renders title and children", () => {
    const { lastFrame } = render(
      <Dialog title="Confirm" width={40}>
        <Text>Are you sure?</Text>
      </Dialog>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Confirm");
    expect(frame).toContain("Are you sure?");
  });

  it("renders footer when provided", () => {
    const { lastFrame } = render(
      <Dialog
        title="Save"
        width={40}
        footer={<Text>Press Enter to confirm</Text>}
      >
        <Text>Save changes?</Text>
      </Dialog>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Save changes?");
    expect(frame).toContain("Press Enter to confirm");
  });
});

describe("DialogLayer", () => {
  it("renders children when no dialog", () => {
    const { lastFrame } = render(
      <DialogLayer dialog={null} height={20} width={60}>
        <Text>Main content</Text>
      </DialogLayer>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Main content");
  });

  it("renders both children and dialog when dialog is provided", () => {
    const { lastFrame } = render(
      <DialogLayer
        dialog={
          <Dialog title="Alert" width={30}>
            <Text>Dialog body</Text>
          </Dialog>
        }
        height={20}
        width={60}
      >
        <Text>Main content</Text>
      </DialogLayer>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Main content");
    expect(frame).toContain("Alert");
    expect(frame).toContain("Dialog body");
  });

  it("renders dialog overlay on top of content", () => {
    const ref = render(
      <DialogLayer dialog={null} height={10} width={40}>
        <Text>Background text</Text>
      </DialogLayer>,
    );
    const withoutDialog = ref.lastFrame()!;
    expect(withoutDialog).toContain("Background text");
    expect(withoutDialog).not.toContain("Modal");

    ref.rerender(
      <DialogLayer
        dialog={
          <Dialog title="Modal" width={20}>
            <Text>Hi</Text>
          </Dialog>
        }
        height={10}
        width={40}
      >
        <Text>Background text</Text>
      </DialogLayer>,
    );
    const withDialog = ref.lastFrame()!;
    expect(withDialog).toContain("Background text");
    expect(withDialog).toContain("Modal");
    expect(withDialog).toContain("Hi");
  });
});
