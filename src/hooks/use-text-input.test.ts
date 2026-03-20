import { describe, it, expect } from "vitest";
import { handleTextInput, type InkKey } from "./use-text-input.ts";

const noMods: InkKey = {
  backspace: false,
  delete: false,
  ctrl: false,
  meta: false,
};

describe("handleTextInput", () => {
  it("appends a printable character", () => {
    const result = handleTextInput("hello", "x", noMods);
    expect(result.handled).toBe(true);
    expect(result.value).toBe("hellox");
  });

  it("appends multiple characters one by one", () => {
    let value = "";
    value = handleTextInput(value, "a", noMods).value;
    value = handleTextInput(value, "b", noMods).value;
    value = handleTextInput(value, "c", noMods).value;
    expect(value).toBe("abc");
  });

  it("removes the last character on backspace", () => {
    const result = handleTextInput("abc", "", {
      ...noMods,
      backspace: true,
    });
    expect(result.handled).toBe(true);
    expect(result.value).toBe("ab");
  });

  it("removes the last character on delete", () => {
    const result = handleTextInput("abc", "", {
      ...noMods,
      delete: true,
    });
    expect(result.handled).toBe(true);
    expect(result.value).toBe("ab");
  });

  it("handles backspace on empty string without error", () => {
    const result = handleTextInput("", "", {
      ...noMods,
      backspace: true,
    });
    expect(result.handled).toBe(true);
    expect(result.value).toBe("");
  });

  it("handles delete on empty string without error", () => {
    const result = handleTextInput("", "", {
      ...noMods,
      delete: true,
    });
    expect(result.handled).toBe(true);
    expect(result.value).toBe("");
  });

  it("ignores ctrl key combos", () => {
    const result = handleTextInput("abc", "c", {
      ...noMods,
      ctrl: true,
    });
    expect(result.handled).toBe(false);
    expect(result.value).toBe("abc");
  });

  it("ignores meta key combos", () => {
    const result = handleTextInput("abc", "v", {
      ...noMods,
      meta: true,
    });
    expect(result.handled).toBe(false);
    expect(result.value).toBe("abc");
  });

  it("ignores empty input with no modifier", () => {
    const result = handleTextInput("abc", "", noMods);
    expect(result.handled).toBe(false);
    expect(result.value).toBe("abc");
  });

  it("ignores input with both ctrl and meta set", () => {
    const result = handleTextInput("", "a", {
      ...noMods,
      ctrl: true,
      meta: true,
    });
    expect(result.handled).toBe(false);
    expect(result.value).toBe("");
  });

  it("backspace takes priority over printable character", () => {
    const result = handleTextInput("abc", "x", {
      ...noMods,
      backspace: true,
    });
    expect(result.handled).toBe(true);
    expect(result.value).toBe("ab");
  });

  it("handles spaces", () => {
    const result = handleTextInput("hello", " ", noMods);
    expect(result.handled).toBe(true);
    expect(result.value).toBe("hello ");
  });

  it("handles special printable characters", () => {
    const result = handleTextInput("", "@", noMods);
    expect(result.handled).toBe(true);
    expect(result.value).toBe("@");
  });

  it("preserves value when input is not handled", () => {
    const result = handleTextInput("existing", "c", {
      ...noMods,
      ctrl: true,
    });
    expect(result.value).toBe("existing");
  });

  it("can rebuild a query through a sequence of operations", () => {
    let value = "";
    // Type "react"
    value = handleTextInput(value, "r", noMods).value;
    value = handleTextInput(value, "e", noMods).value;
    value = handleTextInput(value, "a", noMods).value;
    value = handleTextInput(value, "c", noMods).value;
    value = handleTextInput(value, "t", noMods).value;
    expect(value).toBe("react");

    // Backspace twice
    value = handleTextInput(value, "", { ...noMods, backspace: true }).value;
    value = handleTextInput(value, "", { ...noMods, backspace: true }).value;
    expect(value).toBe("rea");

    // Type "lly"
    value = handleTextInput(value, "l", noMods).value;
    value = handleTextInput(value, "l", noMods).value;
    value = handleTextInput(value, "y", noMods).value;
    expect(value).toBe("really");
  });

  it("handles keys with undefined modifier fields", () => {
    // Ink key objects may omit fields (they'd be undefined, not false)
    const result = handleTextInput("test", "a", {});
    expect(result.handled).toBe(true);
    expect(result.value).toBe("testa");
  });

  it("handles backspace with undefined other fields", () => {
    const result = handleTextInput("test", "", { backspace: true });
    expect(result.handled).toBe(true);
    expect(result.value).toBe("tes");
  });
});
