import { describe, it, expect } from "vitest";
import {
  matchKey,
  matchShortcut,
  getBarShortcuts,
  getHelpShortcuts,
  getRouteShortcuts,
  displayKey,
  ROUTE_SHORTCUTS,
} from "./route-shortcuts.ts";

// ---------------------------------------------------------------------------
// Helper: builds an InkKey object with all fields false by default
// ---------------------------------------------------------------------------
function inkKey(overrides: Record<string, boolean> = {}) {
  return {
    return: false,
    escape: false,
    tab: false,
    shift: false,
    upArrow: false,
    downArrow: false,
    leftArrow: false,
    rightArrow: false,
    backspace: false,
    delete: false,
    ...overrides,
  };
}

// ===========================================================================
// matchKey
// ===========================================================================
describe("matchKey", () => {
  describe("special keys", () => {
    it("should match return key", () => {
      expect(matchKey("return", "", inkKey({ return: true }))).toBe(true);
    });

    it("should not match return when return is false", () => {
      expect(matchKey("return", "", inkKey())).toBe(false);
    });

    it("should match escape key", () => {
      expect(matchKey("escape", "", inkKey({ escape: true }))).toBe(true);
    });

    it("should not match escape when escape is false", () => {
      expect(matchKey("escape", "", inkKey())).toBe(false);
    });

    it("should match tab key without shift", () => {
      expect(matchKey("tab", "", inkKey({ tab: true }))).toBe(true);
    });

    it("should not match tab when shift is also pressed", () => {
      expect(matchKey("tab", "", inkKey({ tab: true, shift: true }))).toBe(
        false,
      );
    });

    it("should match shift+tab", () => {
      expect(
        matchKey("shift+tab", "", inkKey({ tab: true, shift: true })),
      ).toBe(true);
    });

    it("should not match shift+tab when shift is false", () => {
      expect(matchKey("shift+tab", "", inkKey({ tab: true }))).toBe(false);
    });

    it("should not match shift+tab when tab is false", () => {
      expect(matchKey("shift+tab", "", inkKey({ shift: true }))).toBe(false);
    });

    it("should match up arrow", () => {
      expect(matchKey("up", "", inkKey({ upArrow: true }))).toBe(true);
    });

    it("should not match up when upArrow is false", () => {
      expect(matchKey("up", "", inkKey())).toBe(false);
    });

    it("should match down arrow", () => {
      expect(matchKey("down", "", inkKey({ downArrow: true }))).toBe(true);
    });

    it("should not match down when downArrow is false", () => {
      expect(matchKey("down", "", inkKey())).toBe(false);
    });

    it("should match left arrow", () => {
      expect(matchKey("left", "", inkKey({ leftArrow: true }))).toBe(true);
    });

    it("should not match left when leftArrow is false", () => {
      expect(matchKey("left", "", inkKey())).toBe(false);
    });

    it("should match right arrow", () => {
      expect(matchKey("right", "", inkKey({ rightArrow: true }))).toBe(true);
    });

    it("should not match right when rightArrow is false", () => {
      expect(matchKey("right", "", inkKey())).toBe(false);
    });

    it("should match backspace", () => {
      expect(matchKey("backspace", "", inkKey({ backspace: true }))).toBe(true);
    });

    it("should not match backspace when backspace is false", () => {
      expect(matchKey("backspace", "", inkKey())).toBe(false);
    });

    it("should match delete", () => {
      expect(matchKey("delete", "", inkKey({ delete: true }))).toBe(true);
    });

    it("should not match delete when delete is false", () => {
      expect(matchKey("delete", "", inkKey())).toBe(false);
    });
  });

  describe("regular character keys", () => {
    it("should match a single character", () => {
      expect(matchKey("q", "q", inkKey())).toBe(true);
    });

    it("should not match a different character", () => {
      expect(matchKey("q", "x", inkKey())).toBe(false);
    });

    it("should be case-sensitive", () => {
      expect(matchKey("S", "S", inkKey())).toBe(true);
      expect(matchKey("S", "s", inkKey())).toBe(false);
      expect(matchKey("s", "S", inkKey())).toBe(false);
    });

    it("should match symbol characters", () => {
      expect(matchKey("+", "+", inkKey())).toBe(true);
      expect(matchKey("?", "?", inkKey())).toBe(true);
      expect(matchKey("/", "/", inkKey())).toBe(true);
    });

    it("should not match character when input is empty", () => {
      expect(matchKey("q", "", inkKey())).toBe(false);
    });
  });

  describe("special keys do not match character input", () => {
    it("should not match return for the string 'return'", () => {
      expect(matchKey("return", "return", inkKey())).toBe(false);
    });

    it("should not match escape for the string 'escape'", () => {
      expect(matchKey("escape", "escape", inkKey())).toBe(false);
    });
  });
});

// ===========================================================================
// displayKey
// ===========================================================================
describe("displayKey", () => {
  it("should display escape as 'esc'", () => {
    expect(displayKey("escape")).toBe("esc");
  });

  it("should display return as 'enter'", () => {
    expect(displayKey("return")).toBe("enter");
  });

  it("should display tab as 'tab'", () => {
    expect(displayKey("tab")).toBe("tab");
  });

  it("should display shift+tab as 'shift+tab'", () => {
    expect(displayKey("shift+tab")).toBe("shift+tab");
  });

  it("should display arrow keys as unicode arrows", () => {
    expect(displayKey("up")).toBe("\u2191");
    expect(displayKey("down")).toBe("\u2193");
    expect(displayKey("left")).toBe("\u2190");
    expect(displayKey("right")).toBe("\u2192");
  });

  it("should display backspace as 'bksp'", () => {
    expect(displayKey("backspace")).toBe("bksp");
  });

  it("should display delete as 'del'", () => {
    expect(displayKey("delete")).toBe("del");
  });

  it("should return the key as-is for regular characters", () => {
    expect(displayKey("q")).toBe("q");
    expect(displayKey("o")).toBe("o");
    expect(displayKey("+")).toBe("+");
    expect(displayKey("?")).toBe("?");
    expect(displayKey("S")).toBe("S");
  });
});

// ===========================================================================
// matchShortcut
// ===========================================================================
describe("matchShortcut", () => {
  it("should match a route-specific shortcut", () => {
    const action = matchShortcut("o", inkKey(), "prs");
    expect(action).toBe("open");
  });

  it("should match a global shortcut when no route override exists", () => {
    const action = matchShortcut("q", inkKey(), "prs");
    expect(action).toBe("quit");
  });

  it("should give route-specific shortcuts precedence over globals", () => {
    // "tab" is global (nextView) but overridden in prs/detail (switchTab)
    const action = matchShortcut("", inkKey({ tab: true }), "prs/detail");
    expect(action).toBe("switchTab");
  });

  it("should fall through to global when route has no match", () => {
    // "?" is only defined globally (help) — not overridden in config
    const action = matchShortcut("?", inkKey(), "config");
    expect(action).toBe("help");
  });

  it("should return null when no shortcut matches", () => {
    const action = matchShortcut("Z", inkKey(), "prs");
    expect(action).toBeNull();
  });

  it("should match special keys for route shortcuts", () => {
    // escape in prs/detail is "close"
    const action = matchShortcut("", inkKey({ escape: true }), "prs/detail");
    expect(action).toBe("close");
  });

  it("should match shortcuts in the dependencies route", () => {
    const action = matchShortcut("+", inkKey(), "dependencies");
    expect(action).toBe("add");
  });

  it("should match shortcuts in the config route", () => {
    const action = matchShortcut("e", inkKey(), "config");
    expect(action).toBe("editConfig");
  });

  it("should match arrow keys for navigation", () => {
    const action = matchShortcut("", inkKey({ upArrow: true }), "prs");
    expect(action).toBe("up");
  });

  it("should differentiate sub-routes from parent routes", () => {
    // "escape" in prs is clearSearch, in prs/detail is close
    const prsAction = matchShortcut("", inkKey({ escape: true }), "prs");
    const detailAction = matchShortcut(
      "",
      inkKey({ escape: true }),
      "prs/detail",
    );
    expect(prsAction).toBe("clearSearch");
    expect(detailAction).toBe("close");
  });

  it("should match shortcuts for projects route", () => {
    const action = matchShortcut("s", inkKey(), "projects");
    expect(action).toBe("start");
  });

  it("should match shortcuts for pipelines route", () => {
    const action = matchShortcut("p", inkKey(), "pipelines");
    expect(action).toBe("runs");
  });

  it("should match shortcuts for jira route", () => {
    const action = matchShortcut("o", inkKey(), "jira");
    expect(action).toBe("open");
  });

  it("should match shortcuts for jira/detail sub-route", () => {
    const action = matchShortcut("d", inkKey(), "jira/detail");
    expect(action).toBe("overviewTab");
  });

  it("should return null for a route with no registered shortcuts", () => {
    const action = matchShortcut("x", inkKey(), "nonexistent/route");
    expect(action).toBeNull();
  });

  it("should still match globals for a route with no registered shortcuts", () => {
    const action = matchShortcut("q", inkKey(), "nonexistent/route");
    expect(action).toBe("quit");
  });
});

// ===========================================================================
// getRouteShortcuts
// ===========================================================================
describe("getRouteShortcuts", () => {
  it("should return route-specific shortcuts for a known route", () => {
    const shortcuts = getRouteShortcuts("prs");
    expect(shortcuts).toHaveProperty("o");
    expect(shortcuts.o.action).toBe("open");
    expect(shortcuts.o.key).toBe("o");
  });

  it("should return shortcuts for sub-routes", () => {
    const shortcuts = getRouteShortcuts("prs/detail");
    expect(shortcuts).toHaveProperty("escape");
    expect(shortcuts.escape.action).toBe("close");
  });

  it("should return an empty object for unknown routes", () => {
    const shortcuts = getRouteShortcuts("nonexistent");
    expect(shortcuts).toEqual({});
  });

  it("should return global shortcuts when querying _global", () => {
    const shortcuts = getRouteShortcuts("_global");
    expect(shortcuts).toHaveProperty("q");
    expect(shortcuts.q.action).toBe("quit");
  });

  it("should return shortcuts for jira route", () => {
    const shortcuts = getRouteShortcuts("jira");
    expect(shortcuts).toHaveProperty("o");
    expect(shortcuts).toHaveProperty("m");
    expect(shortcuts).toHaveProperty("t");
    expect(shortcuts.m.action).toBe("filterMine");
  });

  it("should not include global shortcuts in route-specific results", () => {
    const shortcuts = getRouteShortcuts("prs");
    // "q" (quit) is only in _global, not in prs
    expect(shortcuts.q).toBeUndefined();
  });
});

// ===========================================================================
// getBarShortcuts
// ===========================================================================
describe("getBarShortcuts", () => {
  it("should return the correct bar items for the prs route", () => {
    const bar = getBarShortcuts("prs");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual([
      "Open",
      "Detail",
      "Copy",
      "Sort",
      "Notif",
      "My PRs",
      "To Review",
      "All",
    ]);
    expect(bar[0]).toEqual({ key: "o", label: "Open" });
    expect(bar[1]).toEqual({ key: "p", label: "Detail" });
  });

  it("should return bar items for prs/detail sub-route", () => {
    const bar = getBarShortcuts("prs/detail");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Close", "Tab", "Open"]);
  });

  it("should return bar items for dependencies route", () => {
    const bar = getBarShortcuts("dependencies");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Add", "Remove", "Refresh", "Open"]);
  });

  it("should return bar items for config route", () => {
    const bar = getBarShortcuts("config");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Add", "Remove", "Select", "Edit"]);
  });

  it("should return bar items for pipelines route", () => {
    const bar = getBarShortcuts("pipelines");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Add", "Remove", "Runs", "Open", "Refresh"]);
  });

  it("should return bar items for releases route", () => {
    const bar = getBarShortcuts("releases");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Add", "Remove", "Open", "Refresh"]);
  });

  it("should return bar items for projects route", () => {
    const bar = getBarShortcuts("projects");
    const labels = bar.map((b) => b.label);
    expect(labels).toContain("Start");
    expect(labels).toContain("Kill");
    expect(labels).toContain("Restart");
    expect(labels).toContain("Open");
    expect(labels).toContain("Add");
    expect(labels).toContain("Remove");
    expect(labels).toContain("Scroll Logs");
    expect(labels).toContain("Start All");
  });

  it("should return bar items for jira route", () => {
    const bar = getBarShortcuts("jira");
    const labels = bar.map((b) => b.label);
    expect(labels).toContain("Open");
    expect(labels).toContain("Mine");
    expect(labels).toContain("Team");
    expect(labels).toContain("User");
    expect(labels).toContain("Status");
    expect(labels).toContain("Sort");
    expect(labels).toContain("Refresh");
  });

  it("should return bar items for jira/detail sub-route", () => {
    const bar = getBarShortcuts("jira/detail");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Close", "Open"]);
  });

  it("should return empty array for help sub-routes", () => {
    expect(getBarShortcuts("prs/help")).toEqual([]);
    expect(getBarShortcuts("dependencies/help")).toEqual([]);
    expect(getBarShortcuts("pipelines/help")).toEqual([]);
    expect(getBarShortcuts("releases/help")).toEqual([]);
    expect(getBarShortcuts("projects/help")).toEqual([]);
    expect(getBarShortcuts("jira/help")).toEqual([]);
  });

  it("should return empty array for search sub-routes", () => {
    expect(getBarShortcuts("prs/search")).toEqual([]);
    expect(getBarShortcuts("dependencies/search")).toEqual([]);
    expect(getBarShortcuts("pipelines/search")).toEqual([]);
    expect(getBarShortcuts("releases/search")).toEqual([]);
    expect(getBarShortcuts("jira/search")).toEqual([]);
  });

  it("should skip actions that have no label defined", () => {
    // The "help" action in the prs bar list maps to the global "?" shortcut
    // which has no label, so it should not appear in the bar
    const bar = getBarShortcuts("prs");
    const helpEntry = bar.find((b) => b.key === "?");
    expect(helpEntry).toBeUndefined();
  });

  it("should fall back to base route config for unknown sub-routes", () => {
    // prs/notifications has its own config
    const bar = getBarShortcuts("prs/notifications");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Close", "Open"]);
  });

  it("should use displayKey for special keys in bar output", () => {
    const bar = getBarShortcuts("prs/detail");
    const closeEntry = bar.find((b) => b.label === "Close");
    expect(closeEntry?.key).toBe("esc");

    const tabEntry = bar.find((b) => b.label === "Tab");
    expect(tabEntry?.key).toBe("tab");
  });

  it("should return bar items for pipelines/runs sub-route", () => {
    const bar = getBarShortcuts("pipelines/runs");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Close", "Open"]);
  });
});

// ===========================================================================
// getHelpShortcuts
// ===========================================================================
describe("getHelpShortcuts", () => {
  it("should include route-specific shortcuts for prs", () => {
    const help = getHelpShortcuts("prs");
    const keys = help.map(([key]) => key);
    expect(keys).toContain("o");
    expect(keys).toContain("p");
    expect(keys).toContain("y");
    expect(keys).toContain("m");
  });

  it("should include global shortcuts", () => {
    const help = getHelpShortcuts("prs");
    const keys = help.map(([key]) => key);
    expect(keys).toContain("q");
    expect(keys).toContain("?");
    expect(keys).toContain("tab");
    expect(keys).toContain("shift+tab");
  });

  it("should return [displayKey, help] tuples", () => {
    const help = getHelpShortcuts("prs");
    const quitEntry = help.find(([key]) => key === "q");
    expect(quitEntry).toEqual(["q", "Quit"]);
  });

  it("should use displayKey for special key names", () => {
    const help = getHelpShortcuts("prs");
    const escEntry = help.find(([, helpText]) => helpText.includes("Clear"));
    expect(escEntry?.[0]).toBe("esc");

    const returnEntry = help.find(([, helpText]) => helpText === "Select");
    expect(returnEntry?.[0]).toBe("enter");
  });

  it("should filter out display-only entries with spaces in the key", () => {
    // The projects route has a "[ ]" key for scrollLogs which should be filtered
    const help = getHelpShortcuts("projects");
    const keysWithSpaces = help.filter(([key]) => key.includes(" "));
    // "shift+tab" is from globals and does not have actual space issues
    // (it's a compound name, not a display-only key with a literal space)
    const nonCompound = keysWithSpaces.filter(([key]) => key !== "shift+tab");
    expect(nonCompound).toHaveLength(0);
  });

  it("should include sub-route shortcuts plus base route shortcuts for sub-routes", () => {
    const help = getHelpShortcuts("prs/detail");
    const keys = help.map(([key]) => key);
    // prs/detail specific
    expect(keys).toContain("f"); // filesTab
    expect(keys).toContain("d"); // overviewTab
    // globals
    expect(keys).toContain("q"); // quit
  });

  it("should include base route shortcuts for sub-routes", () => {
    const help = getHelpShortcuts("prs/detail");
    const keys = help.map(([key]) => key);
    // prs base shortcuts that are not overridden
    expect(keys).toContain("S"); // sort (from prs)
  });

  it("should not duplicate keys already defined in sub-route", () => {
    const help = getHelpShortcuts("prs/detail");
    const allKeys = help.map(([key]) => key);
    // "o" appears in both prs/detail and prs — should only appear once
    const oCount = allKeys.filter((k) => k === "o").length;
    expect(oCount).toBe(1);
  });

  it("should return shortcuts for dependencies route", () => {
    const help = getHelpShortcuts("dependencies");
    const keys = help.map(([key]) => key);
    expect(keys).toContain("+");
    expect(keys).toContain("d");
    expect(keys).toContain("R");
    expect(keys).toContain("o");
  });

  it("should return shortcuts for config route", () => {
    const help = getHelpShortcuts("config");
    const keys = help.map(([key]) => key);
    expect(keys).toContain("e");
    expect(keys).toContain("+");
    expect(keys).toContain("d");
  });

  it("should return shortcuts for jira route", () => {
    const help = getHelpShortcuts("jira");
    const keys = help.map(([key]) => key);
    expect(keys).toContain("o");
    expect(keys).toContain("m");
    expect(keys).toContain("t");
    expect(keys).toContain("u");
    expect(keys).toContain("f");
    expect(keys).toContain("s");
    expect(keys).toContain("R");
  });

  it("should include jira/detail shortcuts plus base jira shortcuts", () => {
    const help = getHelpShortcuts("jira/detail");
    const keys = help.map(([key]) => key);
    // jira/detail specific
    expect(keys).toContain("d"); // overviewTab
    expect(keys).toContain("c"); // commentsTab
    expect(keys).toContain("s"); // subtasksTab
    // globals
    expect(keys).toContain("q");
  });

  it("should use unicode arrows for arrow key display", () => {
    const help = getHelpShortcuts("prs");
    const upEntry = help.find(([, helpText]) => helpText === "Navigate up");
    expect(upEntry?.[0]).toBe("\u2191");
    const downEntry = help.find(([, helpText]) => helpText === "Navigate down");
    expect(downEntry?.[0]).toBe("\u2193");
  });
});
