import { describe, it, expect, beforeEach } from "vitest";
import {
  getTabs,
  setActiveTabs,
  getTabLabel,
  getTabViews,
  getTabNumberKeys,
  getBaseRoute,
} from "./tabs.ts";

// Reset to default tab order before each test
beforeEach(() => {
  setActiveTabs([]);
});

// ===========================================================================
// getBaseRoute
// ===========================================================================
describe("getBaseRoute", () => {
  it("should return the route itself when there is no slash", () => {
    expect(getBaseRoute("prs")).toBe("prs");
    expect(getBaseRoute("dependencies")).toBe("dependencies");
    expect(getBaseRoute("pipelines")).toBe("pipelines");
    expect(getBaseRoute("releases")).toBe("releases");
    expect(getBaseRoute("projects")).toBe("projects");
    expect(getBaseRoute("jira")).toBe("jira");
    expect(getBaseRoute("config")).toBe("config");
  });

  it("should return the first segment for a two-segment route", () => {
    expect(getBaseRoute("prs/detail")).toBe("prs");
    expect(getBaseRoute("prs/help")).toBe("prs");
    expect(getBaseRoute("prs/search")).toBe("prs");
    expect(getBaseRoute("prs/notifications")).toBe("prs");
  });

  it("should return the first segment for deeply nested routes", () => {
    expect(getBaseRoute("jira/detail/UUX-1629")).toBe("jira");
    expect(getBaseRoute("prs/detail/some/deep/path")).toBe("prs");
  });

  it("should handle dependencies sub-routes", () => {
    expect(getBaseRoute("dependencies/help")).toBe("dependencies");
    expect(getBaseRoute("dependencies/search")).toBe("dependencies");
  });

  it("should handle pipelines sub-routes", () => {
    expect(getBaseRoute("pipelines/help")).toBe("pipelines");
    expect(getBaseRoute("pipelines/runs")).toBe("pipelines");
    expect(getBaseRoute("pipelines/search")).toBe("pipelines");
  });

  it("should handle releases sub-routes", () => {
    expect(getBaseRoute("releases/help")).toBe("releases");
    expect(getBaseRoute("releases/search")).toBe("releases");
  });

  it("should handle projects sub-routes", () => {
    expect(getBaseRoute("projects/help")).toBe("projects");
    expect(getBaseRoute("projects/add")).toBe("projects");
    expect(getBaseRoute("projects/confirm")).toBe("projects");
  });

  it("should handle config sub-routes", () => {
    expect(getBaseRoute("config/addOrg")).toBe("config");
    expect(getBaseRoute("config/editAzureOrg")).toBe("config");
    expect(getBaseRoute("config/editJiraSite")).toBe("config");
  });

  it("should handle jira sub-routes", () => {
    expect(getBaseRoute("jira/detail")).toBe("jira");
    expect(getBaseRoute("jira/help")).toBe("jira");
    expect(getBaseRoute("jira/sort")).toBe("jira");
    expect(getBaseRoute("jira/statusFilter")).toBe("jira");
    expect(getBaseRoute("jira/memberSelect")).toBe("jira");
  });
});

// ===========================================================================
// getTabLabel
// ===========================================================================
describe("getTabLabel", () => {
  it("should return numbered label for each tab route", () => {
    expect(getTabLabel("prs")).toBe("1 PRs");
    expect(getTabLabel("jira")).toBe("2 Jira");
    expect(getTabLabel("projects")).toBe("3 Projects");
    expect(getTabLabel("pipelines")).toBe("4 Pipelines");
    expect(getTabLabel("releases")).toBe("5 Releases");
    expect(getTabLabel("dependencies")).toBe("6 Deps");
    expect(getTabLabel("slack")).toBe("7 Slack");
    expect(getTabLabel("config")).toBe("8 Config");
    expect(getTabLabel("about")).toBe("9 About");
  });

  it("should extract base route from nested paths and return label", () => {
    expect(getTabLabel("prs/detail")).toBe("1 PRs");
    expect(getTabLabel("jira/detail/UUX-1629")).toBe("2 Jira");
    expect(getTabLabel("config/addOrg")).toBe("8 Config");
  });

  it("should return undefined for unknown routes", () => {
    expect(getTabLabel("unknown")).toBeUndefined();
    expect(getTabLabel("nonexistent/route")).toBeUndefined();
  });
});

// ===========================================================================
// getTabViews
// ===========================================================================
describe("getTabViews", () => {
  it("should return all top-level tab routes with numbered labels", () => {
    const tabs = getTabViews();
    const routes = tabs.map((t) => t.route);
    expect(routes).toContain("prs");
    expect(routes).toContain("dependencies");
    expect(routes).toContain("pipelines");
    expect(routes).toContain("releases");
    expect(routes).toContain("projects");
    expect(routes).toContain("jira");
    expect(routes).toContain("slack");
    expect(routes).toContain("config");
  });

  it("should include the correct numbered labels", () => {
    const tabs = getTabViews();
    const prsTab = tabs.find((t) => t.route === "prs");
    expect(prsTab?.label).toBe("1 PRs");
    const depsTab = tabs.find((t) => t.route === "dependencies");
    expect(depsTab?.label).toBe("6 Deps");
    const pipelinesTab = tabs.find((t) => t.route === "pipelines");
    expect(pipelinesTab?.label).toBe("4 Pipelines");
    const releasesTab = tabs.find((t) => t.route === "releases");
    expect(releasesTab?.label).toBe("5 Releases");
    const projectsTab = tabs.find((t) => t.route === "projects");
    expect(projectsTab?.label).toBe("3 Projects");
    const jiraTab = tabs.find((t) => t.route === "jira");
    expect(jiraTab?.label).toBe("2 Jira");
    const slackTab = tabs.find((t) => t.route === "slack");
    expect(slackTab?.label).toBe("7 Slack");
    const configTab = tabs.find((t) => t.route === "config");
    expect(configTab?.label).toBe("8 Config");
    const aboutTab = tabs.find((t) => t.route === "about");
    expect(aboutTab?.label).toBe("9 About");
  });

  it("should have the same count as the active tabs", () => {
    const tabs = getTabViews();
    expect(tabs).toHaveLength(getTabs().length);
  });

  it("should not include sub-routes", () => {
    const tabs = getTabViews();
    const routes = tabs.map((t) => t.route);
    expect(routes).not.toContain("prs/detail");
    expect(routes).not.toContain("prs/help");
    expect(routes).not.toContain("jira/detail");
    expect(routes).not.toContain("dependencies/help");
  });
});

// ===========================================================================
// getTabNumberKeys
// ===========================================================================
describe("getTabNumberKeys", () => {
  it("should return a mapping from number strings to tab routes", () => {
    const map = getTabNumberKeys();
    expect(map["1"]).toBe("prs");
    expect(map["2"]).toBe("jira");
    expect(map["3"]).toBe("projects");
    expect(map["4"]).toBe("pipelines");
    expect(map["5"]).toBe("releases");
    expect(map["6"]).toBe("dependencies");
    expect(map["7"]).toBe("slack");
    expect(map["8"]).toBe("config");
    expect(map["9"]).toBe("about");
  });

  it("should have single-digit string keys", () => {
    const map = getTabNumberKeys();
    for (const numKey of Object.keys(map)) {
      expect(numKey).toMatch(/^\d$/);
    }
  });

  it("should have one entry per tab", () => {
    const map = getTabNumberKeys();
    const tabs = getTabViews();
    expect(Object.keys(map)).toHaveLength(tabs.length);
  });

  it("should not include keys beyond the tab count", () => {
    const map = getTabNumberKeys();
    expect(map["0"]).toBeUndefined();
    expect(map[String(getTabs().length + 1)]).toBeUndefined();
  });
});

// ===========================================================================
// setActiveTabs
// ===========================================================================
describe("setActiveTabs", () => {
  it("should filter and reorder tabs based on enabled routes", () => {
    setActiveTabs(["jira", "prs"]);
    const tabs = getTabs();
    expect(tabs.map((t) => t.route)).toEqual([
      "jira",
      "prs",
      "config",
      "about",
    ]);
  });

  it("should always append about as the last tab", () => {
    setActiveTabs(["prs"]);
    const tabs = getTabs();
    expect(tabs[tabs.length - 1]!.route).toBe("about");
  });

  it("should ignore config and about in the input array", () => {
    setActiveTabs(["config", "about", "prs"]);
    const tabs = getTabs();
    expect(tabs.map((t) => t.route)).toEqual(["prs", "config", "about"]);
  });

  it("should ignore unknown routes", () => {
    setActiveTabs(["prs", "unknown", "jira"]);
    const tabs = getTabs();
    expect(tabs.map((t) => t.route)).toEqual([
      "prs",
      "jira",
      "config",
      "about",
    ]);
  });

  it("should restore all tabs when given an empty array", () => {
    setActiveTabs(["prs"]);
    expect(getTabs()).toHaveLength(3); // prs + config + about
    setActiveTabs([]);
    expect(getTabs()).toHaveLength(9); // all 7 + config + about
  });

  it("should update getTabNumberKeys accordingly", () => {
    setActiveTabs(["jira", "prs"]);
    const map = getTabNumberKeys();
    expect(map["1"]).toBe("jira");
    expect(map["2"]).toBe("prs");
    expect(map["3"]).toBe("config");
    expect(map["4"]).toBe("about");
    expect(map["5"]).toBeUndefined();
  });

  it("should update getTabLabel accordingly", () => {
    setActiveTabs(["jira", "prs"]);
    expect(getTabLabel("jira")).toBe("1 Jira");
    expect(getTabLabel("prs")).toBe("2 PRs");
    expect(getTabLabel("config")).toBe("3 Config");
    expect(getTabLabel("about")).toBe("4 About");
    // Disabled tabs return undefined
    expect(getTabLabel("pipelines")).toBeUndefined();
  });
});
