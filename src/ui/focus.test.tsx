import React, { act } from "react";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { describe, it, expect, vi } from "vitest";
import {
  FocusProvider,
  useFocus,
  useFocusNode,
  type FocusContextValue,
} from "./focus.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A node that renders its focus state as text. */
function TestNode({ id, order }: { id: string; order: number }) {
  const { isFocused } = useFocusNode({ id, order });
  return (
    <Text>
      {id}:{isFocused ? "focused" : "blurred"}
    </Text>
  );
}

/**
 * Exposes the FocusContextValue to the test by assigning it to a mutable
 * ref object during render (not in an effect). This avoids timing issues
 * with ink-testing-library and useEffect.
 */
function FocusController({
  ctxRef,
}: {
  ctxRef: { current: FocusContextValue | undefined };
}) {
  const ctx = useFocus();
  ctxRef.current = ctx;
  return null;
}

// ===========================================================================
// Tests
// ===========================================================================

describe("FocusProvider", () => {
  it("initializes with initialFocus — the matching node shows focused", () => {
    const { lastFrame } = render(
      <FocusProvider initialFocus="sidebar">
        <TestNode id="sidebar" order={0} />
        <TestNode id="list" order={1} />
      </FocusProvider>,
    );
    expect(lastFrame()).toContain("sidebar:focused");
    expect(lastFrame()).toContain("list:blurred");
  });

  it("useFocusNode returns isFocused=false for non-focused nodes", () => {
    const { lastFrame } = render(
      <FocusProvider initialFocus="sidebar">
        <TestNode id="sidebar" order={0} />
        <TestNode id="list" order={1} />
        <TestNode id="commands" order={2} />
      </FocusProvider>,
    );
    expect(lastFrame()).toContain("list:blurred");
    expect(lastFrame()).toContain("commands:blurred");
  });

  it("setFocus changes focused node, old node becomes blurred", () => {
    const ctxRef: { current: FocusContextValue | undefined } = {
      current: undefined,
    };

    const { lastFrame } = render(
      <FocusProvider initialFocus="sidebar">
        <FocusController ctxRef={ctxRef} />
        <TestNode id="sidebar" order={0} />
        <TestNode id="list" order={1} />
      </FocusProvider>,
    );

    expect(lastFrame()).toContain("sidebar:focused");
    expect(lastFrame()).toContain("list:blurred");

    // Change focus
    ctxRef.current!.setFocus("list");

    expect(lastFrame()).toContain("sidebar:blurred");
    expect(lastFrame()).toContain("list:focused");
  });

  it("focusNext cycles forward by order (wraps around)", () => {
    const ctxRef: { current: FocusContextValue | undefined } = {
      current: undefined,
    };

    const { lastFrame } = render(
      <FocusProvider initialFocus="a">
        <FocusController ctxRef={ctxRef} />
        <TestNode id="a" order={0} />
        <TestNode id="b" order={1} />
        <TestNode id="c" order={2} />
      </FocusProvider>,
    );

    expect(lastFrame()).toContain("a:focused");

    ctxRef.current!.focusNext();
    expect(lastFrame()).toContain("b:focused");
    expect(lastFrame()).toContain("a:blurred");

    ctxRef.current!.focusNext();
    expect(lastFrame()).toContain("c:focused");

    // Wrap around
    ctxRef.current!.focusNext();
    expect(lastFrame()).toContain("a:focused");
    expect(lastFrame()).toContain("c:blurred");
  });

  it("focusPrev cycles backward (wraps around)", () => {
    const ctxRef: { current: FocusContextValue | undefined } = {
      current: undefined,
    };

    const { lastFrame } = render(
      <FocusProvider initialFocus="a">
        <FocusController ctxRef={ctxRef} />
        <TestNode id="a" order={0} />
        <TestNode id="b" order={1} />
        <TestNode id="c" order={2} />
      </FocusProvider>,
    );

    expect(lastFrame()).toContain("a:focused");

    // Wrap backward from first to last
    ctxRef.current!.focusPrev();
    expect(lastFrame()).toContain("c:focused");
    expect(lastFrame()).toContain("a:blurred");

    ctxRef.current!.focusPrev();
    expect(lastFrame()).toContain("b:focused");

    ctxRef.current!.focusPrev();
    expect(lastFrame()).toContain("a:focused");
  });

  it("trap locks focus — setFocus to other nodes is no-op", () => {
    const ctxRef: { current: FocusContextValue | undefined } = {
      current: undefined,
    };

    const { lastFrame } = render(
      <FocusProvider initialFocus="sidebar">
        <FocusController ctxRef={ctxRef} />
        <TestNode id="sidebar" order={0} />
        <TestNode id="dialog" order={1} />
        <TestNode id="list" order={2} />
      </FocusProvider>,
    );

    // Trap focus on dialog
    ctxRef.current!.trap("dialog");
    expect(lastFrame()).toContain("dialog:focused");
    expect(lastFrame()).toContain("sidebar:blurred");

    // Attempt to focus another node — should be ignored
    ctxRef.current!.setFocus("list");
    expect(lastFrame()).toContain("dialog:focused");
    expect(lastFrame()).toContain("list:blurred");

    // focusNext should also be no-op while trapped
    ctxRef.current!.focusNext();
    expect(lastFrame()).toContain("dialog:focused");

    // focusPrev should also be no-op while trapped
    ctxRef.current!.focusPrev();
    expect(lastFrame()).toContain("dialog:focused");
  });

  it("release restores previous focus after trap", () => {
    const ctxRef: { current: FocusContextValue | undefined } = {
      current: undefined,
    };

    const { lastFrame } = render(
      <FocusProvider initialFocus="sidebar">
        <FocusController ctxRef={ctxRef} />
        <TestNode id="sidebar" order={0} />
        <TestNode id="dialog" order={1} />
      </FocusProvider>,
    );

    expect(lastFrame()).toContain("sidebar:focused");

    // Trap then release
    ctxRef.current!.trap("dialog");
    expect(lastFrame()).toContain("dialog:focused");

    ctxRef.current!.release();
    expect(lastFrame()).toContain("sidebar:focused");
    expect(lastFrame()).toContain("dialog:blurred");
  });

  it("unmounting a trapped node triggers auto-release", () => {
    const ctxRef: { current: FocusContextValue | undefined } = {
      current: undefined,
    };
    let setShowDialog: (v: boolean) => void;

    function DialogNode({ visible }: { visible: boolean }) {
      if (!visible) return null;
      return <TestNode id="dialog" order={1} />;
    }

    function Wrapper() {
      const [showDialog, _setShowDialog] = React.useState(true);
      setShowDialog = _setShowDialog;
      return (
        <FocusProvider initialFocus="sidebar">
          <FocusController ctxRef={ctxRef} />
          <TestNode id="sidebar" order={0} />
          <DialogNode visible={showDialog} />
        </FocusProvider>
      );
    }

    const { lastFrame } = render(<Wrapper />);

    // Trap on dialog
    ctxRef.current!.trap("dialog");
    expect(lastFrame()).toContain("dialog:focused");

    // Unmount the dialog node — should auto-release and restore previous
    act(() => {
      setShowDialog!(false);
    });

    expect(lastFrame()).toContain("sidebar:focused");
    expect(lastFrame()).not.toContain("dialog");
  });

  it("setFocus calls onFocus and onBlur callbacks", () => {
    const onFocusSidebar = vi.fn();
    const onBlurSidebar = vi.fn();
    const onFocusList = vi.fn();
    const onBlurList = vi.fn();

    function CallbackNode({
      id,
      order,
      onFocus,
      onBlur,
    }: {
      id: string;
      order: number;
      onFocus: () => void;
      onBlur: () => void;
    }) {
      const { isFocused } = useFocusNode({ id, order, onFocus, onBlur });
      return (
        <Text>
          {id}:{isFocused ? "focused" : "blurred"}
        </Text>
      );
    }

    const ctxRef: { current: FocusContextValue | undefined } = {
      current: undefined,
    };

    render(
      <FocusProvider initialFocus="sidebar">
        <FocusController ctxRef={ctxRef} />
        <CallbackNode
          id="sidebar"
          order={0}
          onFocus={onFocusSidebar}
          onBlur={onBlurSidebar}
        />
        <CallbackNode
          id="list"
          order={1}
          onFocus={onFocusList}
          onBlur={onBlurList}
        />
      </FocusProvider>,
    );

    ctxRef.current!.setFocus("list");

    expect(onBlurSidebar).toHaveBeenCalled();
    expect(onFocusList).toHaveBeenCalled();
  });

  it("isFocused returns correct boolean for each node", () => {
    const ctxRef: { current: FocusContextValue | undefined } = {
      current: undefined,
    };

    render(
      <FocusProvider initialFocus="sidebar">
        <FocusController ctxRef={ctxRef} />
        <TestNode id="sidebar" order={0} />
        <TestNode id="list" order={1} />
      </FocusProvider>,
    );

    expect(ctxRef.current!.isFocused("sidebar")).toBe(true);
    expect(ctxRef.current!.isFocused("list")).toBe(false);
  });

  it("focus() from useFocusNode sets focus to that node", () => {
    let focusListFn: (() => void) | undefined;

    function FocusableNode({ id, order }: { id: string; order: number }) {
      const { isFocused, focus } = useFocusNode({ id, order });
      if (id === "list") focusListFn = focus;
      return (
        <Text>
          {id}:{isFocused ? "focused" : "blurred"}
        </Text>
      );
    }

    const { lastFrame } = render(
      <FocusProvider initialFocus="sidebar">
        <FocusableNode id="sidebar" order={0} />
        <FocusableNode id="list" order={1} />
      </FocusProvider>,
    );

    expect(lastFrame()).toContain("sidebar:focused");

    // Call focus() on the list node
    focusListFn!();
    expect(lastFrame()).toContain("list:focused");
    expect(lastFrame()).toContain("sidebar:blurred");
  });
});
