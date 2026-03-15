// Re-export JiraLayout as the entry point for the Jira view.
// The monolithic JiraView has been decomposed into nested routes:
// - jira-layout.tsx  (parent layout + shared state via JiraContext)
// - issue-list-view.tsx (index route — issue list + status bar)
// - issue-detail/index.tsx (detail route)
// - status-filter.tsx (overlay route)
// - sort-overlay.tsx (overlay route)
// - member-select.tsx (overlay route)
// - jira-help-view.tsx (overlay route)
export { JiraLayout } from "./jira-layout.tsx";
