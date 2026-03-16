import { describe, it, expect } from "vitest";
import {
  TABS,
  getTabLabel,
  getTabViews,
  getTabNumberKeys,
  getBaseRoute,
} from "./tabs.ts";

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
    expect(getTabLabel("config")).toBe("7 Config");
  });

  it("should extract base route from nested paths and return label", () => {
    expect(getTabLabel("prs/detail")).toBe("1 PRs");
    expect(getTabLabel("jira/detail/UUX-1629")).toBe("2 Jira");
    expect(getTabLabel("config/addOrg")).toBe("7 Config");
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
    const configTab = tabs.find((t) => t.route === "config");
    expect(configTab?.label).toBe("7 Config");
  });

  it("should return objects with route and label properties", () => {
    const tabs = getTabViews();
    for (const tab of tabs) {
      expect(tab).toHaveProperty("route");
      expect(tab).toHaveProperty("label");
      expect(typeof tab.route).toBe("string");
      expect(typeof tab.label).toBe("string");
    }
  });

  it("should have the same count as the TABS array", () => {
    const tabs = getTabViews();
    expect(tabs).toHaveLength(TABS.length);
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
    expect(map["7"]).toBe("config");
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
    expect(map[String(TABS.length + 1)]).toBeUndefined();
  });
});
