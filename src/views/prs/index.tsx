// Barrel re-exports for the PRs view module.
// The monolithic PRView has been decomposed into:
// - PrsLayout (parent layout with shared state + header)
// - PrListView (index route: sidebar + list + status bar)
// - PRDetailPanel (detail sub-view)
// - NotificationsView (notifications sub-view)
// - RepoSearch (repo search overlay)
// - PrsHelpView (help overlay)
export { PrsLayout } from "./prs-layout.tsx";
export { PrListView } from "./pr-list-view.tsx";
export { PrsHelpView } from "./prs-help-view.tsx";
