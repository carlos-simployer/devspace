import React from "react";
import { render } from "ink-testing-library";
import { describe, it, expect, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog.tsx";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("ConfirmDialog", () => {
  it("renders title and message", () => {
    const { lastFrame } = render(
      <ConfirmDialog
        title="Confirm Action"
        message="Are you sure?"
        onSelect={() => {}}
        onCancel={() => {}}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Confirm Action");
    expect(frame).toContain("Are you sure?");
  });

  it("renders default Yes/No options", () => {
    const { lastFrame } = render(
      <ConfirmDialog
        title="Confirm"
        message="Proceed?"
        onSelect={() => {}}
        onCancel={() => {}}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("No");
    expect(frame).toContain("Yes");
  });

  it("renders custom options", () => {
    const { lastFrame } = render(
      <ConfirmDialog
        title="Choose"
        message="Pick one"
        options={[
          { label: "Cancel", value: "cancel" },
          { label: "Delete", value: "delete", color: "red" },
          { label: "Archive", value: "archive", color: "yellow" },
        ]}
        onSelect={() => {}}
        onCancel={() => {}}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Cancel");
    expect(frame).toContain("Delete");
    expect(frame).toContain("Archive");
  });

  it("renders detail text when provided", () => {
    const { lastFrame } = render(
      <ConfirmDialog
        title="Confirm"
        message="Proceed?"
        detail="This action cannot be undone."
        onSelect={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()!).toContain("This action cannot be undone.");
  });

  it("calls onCancel on Escape", async () => {
    const onCancel = vi.fn();
    const { stdin } = render(
      <ConfirmDialog
        title="Confirm"
        message="Proceed?"
        onSelect={() => {}}
        onCancel={onCancel}
      />,
    );
    // Wait for useEffect to subscribe useInput
    await delay(0);
    stdin.write("\x1B");
    await delay(200);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onSelect on Enter with correct value", async () => {
    const onSelect = vi.fn();
    const { stdin } = render(
      <ConfirmDialog
        title="Confirm"
        message="Proceed?"
        onSelect={onSelect}
        onCancel={() => {}}
      />,
    );
    // Wait for useEffect to subscribe useInput
    await delay(0);
    // Move down to "Yes"
    stdin.write("\x1B[B");
    // Wait for React to commit the state update from down arrow
    await delay(0);
    // Press Enter
    stdin.write("\r");
    expect(onSelect).toHaveBeenCalledWith("yes");
  });
});
