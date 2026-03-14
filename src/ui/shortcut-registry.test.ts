import { describe, it, expect } from "vitest";
import {
  matchKey,
  matchShortcut,
  getBarShortcuts,
  getHelpShortcuts,
  getActiveShortcuts,
  SHORTCUTS,
} from "./shortcut-registry.ts";
import {
  getBaseView,
  getTabViews,
  getTabNumberKeys,
  VIEW_CONFIG,
} from "./view-config.ts";
import type { ViewId } from "./view-config.ts";

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
// matchShortcut
// ===========================================================================
describe("matchShortcut", () => {
  it("should match a view-specific shortcut", () => {
    const action = matchShortcut("o", inkKey(), "prs");
    expect(action).toBe("open");
  });

  it("should match a global shortcut when no view override exists", () => {
    const action = matchShortcut("q", inkKey(), "prs");
    expect(action).toBe("quit");
  });

  it("should give view-specific shortcuts precedence over globals", () => {
    // "tab" is global (nextView) but overridden in prs.detail (switchTab)
    const action = matchShortcut("", inkKey({ tab: true }), "prs.detail");
    expect(action).toBe("switchTab");
  });

  it("should fall through to global when view has no match", () => {
    // "?" is only defined globally (help) — it is not overridden in config
    const action = matchShortcut("?", inkKey(), "config");
    expect(action).toBe("help");
  });

  it("should return null when no shortcut matches", () => {
    const action = matchShortcut("Z", inkKey(), "prs");
    expect(action).toBeNull();
  });

  it("should match special keys for view shortcuts", () => {
    // escape in prs.detail is "close"
    const action = matchShortcut("", inkKey({ escape: true }), "prs.detail");
    expect(action).toBe("close");
  });

  it("should match shortcuts in the dependencies view", () => {
    const action = matchShortcut("+", inkKey(), "dependencies");
    expect(action).toBe("add");
  });

  it("should match shortcuts in the config view", () => {
    const action = matchShortcut("e", inkKey(), "config");
    expect(action).toBe("editConfig");
  });

  it("should match arrow keys for navigation", () => {
    const action = matchShortcut("", inkKey({ upArrow: true }), "prs");
    expect(action).toBe("up");
  });

  it("should differentiate sub-views from parent views", () => {
    // "escape" in prs is clearSearch, in prs.detail is close
    const prsAction = matchShortcut("", inkKey({ escape: true }), "prs");
    const detailAction = matchShortcut(
      "",
      inkKey({ escape: true }),
      "prs.detail",
    );
    expect(prsAction).toBe("clearSearch");
    expect(detailAction).toBe("close");
  });

  it("should match shortcuts for projects view", () => {
    const action = matchShortcut("s", inkKey(), "projects");
    expect(action).toBe("start");
  });

  it("should match shortcuts for pipelines view", () => {
    const action = matchShortcut("p", inkKey(), "pipelines");
    expect(action).toBe("runs");
  });
});

// ===========================================================================
// getBarShortcuts
// ===========================================================================
describe("getBarShortcuts", () => {
  it("should return the correct bar items for the prs view", () => {
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
      // "help" is global and has no label, so it won't appear — let's check
    ]);
    // Verify key-label pairs for the first few
    expect(bar[0]).toEqual({ key: "o", label: "Open" });
    expect(bar[1]).toEqual({ key: "p", label: "Detail" });
  });

  it("should return bar items for prs.detail sub-view", () => {
    const bar = getBarShortcuts("prs.detail");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Close", "Tab", "Open"]);
  });

  it("should return bar items for dependencies view", () => {
    const bar = getBarShortcuts("dependencies");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Add", "Remove", "Refresh", "Open"]);
  });

  it("should return bar items for config view", () => {
    const bar = getBarShortcuts("config");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Add", "Remove", "Select", "Edit"]);
  });

  it("should return bar items for pipelines view", () => {
    const bar = getBarShortcuts("pipelines");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Add", "Remove", "Runs", "Open", "Refresh"]);
  });

  it("should return bar items for releases view", () => {
    const bar = getBarShortcuts("releases");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Add", "Remove", "Open", "Refresh"]);
  });

  it("should return bar items for projects view", () => {
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

  it("should return empty array for help sub-views", () => {
    expect(getBarShortcuts("prs.help")).toEqual([]);
    expect(getBarShortcuts("dependencies.help")).toEqual([]);
  });

  it("should return empty array for search sub-views", () => {
    expect(getBarShortcuts("prs.search")).toEqual([]);
    expect(getBarShortcuts("dependencies.search")).toEqual([]);
  });

  it("should skip actions that have no label defined", () => {
    // The "help" action in the prs bar list maps to the global "?" shortcut
    // which has no label, so it should not appear in the bar
    const bar = getBarShortcuts("prs");
    const helpEntry = bar.find((b) => b.key === "?");
    expect(helpEntry).toBeUndefined();
  });

  it("should fall back to base view config for unknown sub-views", () => {
    // prs.notifications has a config, so it returns its own bar
    const bar = getBarShortcuts("prs.notifications");
    const labels = bar.map((b) => b.label);
    expect(labels).toEqual(["Close", "Open"]);
  });
});

// ===========================================================================
// getHelpShortcuts
// ===========================================================================
describe("getHelpShortcuts", () => {
  it("should include view-specific shortcuts for prs", () => {
    const help = getHelpShortcuts("prs");
    const keys = help.map(([key]) => key);
    // Should contain view-specific keys
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

  it("should return [key, help] tuples", () => {
    const help = getHelpShortcuts("prs");
    const quitEntry = help.find(([key]) => key === "q");
    expect(quitEntry).toEqual(["q", "Quit"]);
  });

  it("should filter out display-only entries with spaces in the key", () => {
    // The projects view has a "[ ]" key for scrollLogs which should be filtered out
    const help = getHelpShortcuts("projects");
    const keysWithSpaces = help.filter(([key]) => key.includes(" "));
    expect(keysWithSpaces).toHaveLength(0);
  });

  it("should include sub-view shortcuts plus base view shortcuts", () => {
    // prs.detail should include its own shortcuts + prs base shortcuts + globals
    const help = getHelpShortcuts("prs.detail");
    const keys = help.map(([key]) => key);
    // prs.detail specific
    expect(keys).toContain("f"); // filesTab
    expect(keys).toContain("d"); // overviewTab
    // globals
    expect(keys).toContain("q"); // quit
  });

  it("should include base view shortcuts for sub-views", () => {
    const help = getHelpShortcuts("prs.detail");
    const keys = help.map(([key]) => key);
    // prs base shortcuts (since getBaseView("prs.detail") = "prs")
    expect(keys).toContain("o"); // open (from prs or prs.detail)
    expect(keys).toContain("S"); // sort (from prs)
  });

  it("should return shortcuts for dependencies view", () => {
    const help = getHelpShortcuts("dependencies");
    const keys = help.map(([key]) => key);
    expect(keys).toContain("+");
    expect(keys).toContain("d");
    expect(keys).toContain("R");
    expect(keys).toContain("o");
  });

  it("should return shortcuts for config view", () => {
    const help = getHelpShortcuts("config");
    const keys = help.map(([key]) => key);
    expect(keys).toContain("e");
    expect(keys).toContain("+");
    expect(keys).toContain("d");
  });
});

// ===========================================================================
// getActiveShortcuts
// ===========================================================================
describe("getActiveShortcuts", () => {
  it("should return view-specific and global shortcuts", () => {
    const active = getActiveShortcuts("prs");
    const actions = active.map((s) => s.action);
    // View-specific
    expect(actions).toContain("open");
    expect(actions).toContain("detail");
    expect(actions).toContain("copyUrl");
    // Global
    expect(actions).toContain("quit");
    expect(actions).toContain("help");
  });

  it("should not include shortcuts from other views", () => {
    const active = getActiveShortcuts("prs");
    const views = active
      .map((s) => s.view)
      .filter((v) => v !== undefined && v !== "prs");
    expect(views).toHaveLength(0);
  });

  it("should return only global shortcuts for a view with no specific shortcuts", () => {
    // prs.help has no shortcuts defined in SHORTCUTS
    const active = getActiveShortcuts("prs.help");
    const allGlobal = active.every((s) => s.view === undefined);
    expect(allGlobal).toBe(true);
  });

  it("should include all global shortcuts", () => {
    const globalShortcuts = SHORTCUTS.filter((s) => !s.view);
    const active = getActiveShortcuts("dependencies");
    for (const global of globalShortcuts) {
      expect(active).toContainEqual(global);
    }
  });

  it("should return correct shortcuts for config view", () => {
    const active = getActiveShortcuts("config");
    const viewActions = active
      .filter((s) => s.view === "config")
      .map((s) => s.action);
    expect(viewActions).toContain("add");
    expect(viewActions).toContain("remove");
    expect(viewActions).toContain("select");
    expect(viewActions).toContain("editConfig");
  });

  it("should return correct shortcuts for prs.detail sub-view", () => {
    const active = getActiveShortcuts("prs.detail");
    const viewActions = active
      .filter((s) => s.view === "prs.detail")
      .map((s) => s.action);
    expect(viewActions).toContain("close");
    expect(viewActions).toContain("switchTab");
    expect(viewActions).toContain("filesTab");
    expect(viewActions).toContain("overviewTab");
  });
});

// ===========================================================================
// view-config.ts — getBaseView
// ===========================================================================
describe("getBaseView", () => {
  it("should return the base part of a dotted view id", () => {
    expect(getBaseView("prs.detail")).toBe("prs");
    expect(getBaseView("prs.notifications")).toBe("prs");
    expect(getBaseView("prs.help")).toBe("prs");
    expect(getBaseView("prs.search")).toBe("prs");
  });

  it("should return the view itself when there is no dot", () => {
    expect(getBaseView("prs")).toBe("prs");
    expect(getBaseView("dependencies")).toBe("dependencies");
    expect(getBaseView("pipelines")).toBe("pipelines");
    expect(getBaseView("releases")).toBe("releases");
    expect(getBaseView("projects")).toBe("projects");
    expect(getBaseView("config")).toBe("config");
  });

  it("should handle dependencies sub-views", () => {
    expect(getBaseView("dependencies.help")).toBe("dependencies");
    expect(getBaseView("dependencies.search")).toBe("dependencies");
  });

  it("should handle pipelines sub-views", () => {
    expect(getBaseView("pipelines.help")).toBe("pipelines");
    expect(getBaseView("pipelines.runs")).toBe("pipelines");
    expect(getBaseView("pipelines.search")).toBe("pipelines");
  });

  it("should handle releases sub-views", () => {
    expect(getBaseView("releases.help")).toBe("releases");
    expect(getBaseView("releases.search")).toBe("releases");
  });

  it("should handle projects sub-views", () => {
    expect(getBaseView("projects.help")).toBe("projects");
    expect(getBaseView("projects.add")).toBe("projects");
    expect(getBaseView("projects.confirm")).toBe("projects");
  });

  it("should handle config sub-views", () => {
    expect(getBaseView("config.addOrg")).toBe("config");
    expect(getBaseView("config.editAzureOrg")).toBe("config");
    expect(getBaseView("config.editAzureProject")).toBe("config");
  });
});

// ===========================================================================
// view-config.ts — getTabViews
// ===========================================================================
describe("getTabViews", () => {
  it("should return all top-level views with tab labels", () => {
    const tabs = getTabViews();
    const keys = tabs.map((t) => t.key);
    expect(keys).toContain("prs");
    expect(keys).toContain("dependencies");
    expect(keys).toContain("pipelines");
    expect(keys).toContain("releases");
    expect(keys).toContain("projects");
    expect(keys).toContain("config");
  });

  it("should not include sub-views", () => {
    const tabs = getTabViews();
    const keys = tabs.map((t) => t.key);
    expect(keys).not.toContain("prs.detail");
    expect(keys).not.toContain("prs.help");
    expect(keys).not.toContain("dependencies.help");
  });

  it("should include the correct labels", () => {
    const tabs = getTabViews();
    const prsTab = tabs.find((t) => t.key === "prs");
    expect(prsTab?.label).toBe("1 PRs");
    const depsTab = tabs.find((t) => t.key === "dependencies");
    expect(depsTab?.label).toBe("2 Deps");
    const pipelinesTab = tabs.find((t) => t.key === "pipelines");
    expect(pipelinesTab?.label).toBe("3 Pipelines");
    const releasesTab = tabs.find((t) => t.key === "releases");
    expect(releasesTab?.label).toBe("4 Releases");
    const projectsTab = tabs.find((t) => t.key === "projects");
    expect(projectsTab?.label).toBe("5 Projects");
    const configTab = tabs.find((t) => t.key === "config");
    expect(configTab?.label).toBe("6 Config");
  });

  it("should return objects with key and label properties", () => {
    const tabs = getTabViews();
    for (const tab of tabs) {
      expect(tab).toHaveProperty("key");
      expect(tab).toHaveProperty("label");
      expect(typeof tab.key).toBe("string");
      expect(typeof tab.label).toBe("string");
    }
  });
});

// ===========================================================================
// view-config.ts — getTabNumberKeys
// ===========================================================================
describe("getTabNumberKeys", () => {
  it("should return a mapping from number strings to base views", () => {
    const map = getTabNumberKeys();
    expect(map["1"]).toBe("prs");
    expect(map["2"]).toBe("dependencies");
    expect(map["3"]).toBe("pipelines");
    expect(map["4"]).toBe("releases");
    expect(map["5"]).toBe("projects");
    expect(map["6"]).toBe("config");
  });

  it("should derive numbers from tab labels", () => {
    const map = getTabNumberKeys();
    // Each entry should have a single-digit string key
    for (const numKey of Object.keys(map)) {
      expect(numKey).toMatch(/^\d$/);
    }
  });

  it("should have one entry per tabbed view", () => {
    const map = getTabNumberKeys();
    const tabViews = getTabViews();
    expect(Object.keys(map)).toHaveLength(tabViews.length);
  });

  it("should not include keys for non-tabbed views", () => {
    const map = getTabNumberKeys();
    // There should be no key "0" or "7" etc. beyond the defined tabs
    expect(map["0"]).toBeUndefined();
    expect(map["7"]).toBeUndefined();
  });
});
