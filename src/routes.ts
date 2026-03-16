import { defineRoutes } from "./ui/router.ts";
import { PrsLayout } from "./views/prs/prs-layout.tsx";
import { PrListView } from "./views/prs/pr-list-view.tsx";
import { PRDetailPanel } from "./views/prs/pr-detail/index.tsx";
import { PrsHelpView } from "./views/prs/prs-help-view.tsx";
import { NotificationsView } from "./views/prs/notifications-view.tsx";
import { RepoSearch } from "./views/prs/repo-search.tsx";
import { DepsLayout } from "./views/dependencies/deps-layout.tsx";
import { DepsListView } from "./views/dependencies/deps-list-view.tsx";
import { DepsHelpView } from "./views/dependencies/deps-help-view.tsx";
import { PackageSearch } from "./views/dependencies/package-search.tsx";
import { PipelinesLayout } from "./views/pipelines/pipelines-layout.tsx";
import { PipelinesListView } from "./views/pipelines/pipelines-list-view.tsx";
import { PipelinesHelpView } from "./views/pipelines/pipelines-help-view.tsx";
import { PipelineSearch } from "./views/pipelines/pipeline-search.tsx";
import { PipelineRuns } from "./views/pipelines/pipeline-runs.tsx";
import { ReleasesLayout } from "./views/releases/releases-layout.tsx";
import { ReleasesListView } from "./views/releases/releases-list-view.tsx";
import { ReleasesHelpView } from "./views/releases/releases-help-view.tsx";
import { DefinitionSearch } from "./views/releases/definition-search.tsx";
import { ProjectsLayout } from "./views/projects/projects-layout.tsx";
import { ProjectsListView } from "./views/projects/projects-list-view.tsx";
import { ProjectsHelpView } from "./views/projects/projects-help-view.tsx";
import { ConfigLayout } from "./views/config/config-layout.tsx";
import { ConfigMainView } from "./views/config/config-main-view.tsx";
import { ConfigHelpView } from "./views/config/config-help-view.tsx";
import { JiraLayout } from "./views/jira/jira-layout.tsx";
import { JiraIssueListView } from "./views/jira/issue-list-view.tsx";
import { IssueDetail } from "./views/jira/issue-detail/index.tsx";
import { SortOverlay } from "./views/jira/sort-overlay.tsx";
import { StatusFilter } from "./views/jira/status-filter.tsx";
import { MemberSelect } from "./views/jira/member-select.tsx";
import { JiraHelpView } from "./views/jira/jira-help-view.tsx";
import { SlackLayout } from "./views/slack/slack-layout.tsx";
import { SlackListView } from "./views/slack/slack-list-view.tsx";
import { SlackThreadView } from "./views/slack/slack-thread-view.tsx";
import { SlackChannelSearch } from "./views/slack/slack-channel-search.tsx";
import { SlackEmojiPicker } from "./views/slack/slack-emoji-picker.tsx";
import { SlackStatusView } from "./views/slack/slack-status-view.tsx";
import { SlackHelpView } from "./views/slack/slack-help-view.tsx";
import { LogOverlayView } from "./views/log/log-overlay.tsx";

export const routes = defineRoutes({
  // PRs — nested routes via Outlet system
  prs: {
    component: PrsLayout,
    children: {
      "": { component: PrListView },
      detail: { component: PRDetailPanel },
      help: { component: PrsHelpView, layout: "overlay" },
      logs: { component: LogOverlayView, layout: "overlay" },
      notifications: { component: NotificationsView },
      search: { component: RepoSearch, layout: "overlay" },
    },
  },

  // Dependencies — nested routes via Outlet system
  dependencies: {
    component: DepsLayout,
    children: {
      "": { component: DepsListView },
      help: { component: DepsHelpView, layout: "overlay" },
      logs: { component: LogOverlayView, layout: "overlay" },
      search: { component: PackageSearch, layout: "overlay" },
    },
  },

  // Pipelines — nested routes via Outlet system
  pipelines: {
    component: PipelinesLayout,
    children: {
      "": { component: PipelinesListView },
      help: { component: PipelinesHelpView, layout: "overlay" },
      logs: { component: LogOverlayView, layout: "overlay" },
      search: { component: PipelineSearch, layout: "overlay" },
      runs: { component: PipelineRuns },
    },
  },

  // Releases — nested routes via Outlet system
  releases: {
    component: ReleasesLayout,
    children: {
      "": { component: ReleasesListView },
      help: { component: ReleasesHelpView, layout: "overlay" },
      logs: { component: LogOverlayView, layout: "overlay" },
      search: { component: DefinitionSearch, layout: "overlay" },
    },
  },

  // Projects — nested routes via Outlet system
  projects: {
    component: ProjectsLayout,
    children: {
      "": { component: ProjectsListView },
      help: { component: ProjectsHelpView, layout: "overlay" },
      logs: { component: LogOverlayView, layout: "overlay" },
      add: { component: ProjectsListView, layout: "overlay" },
    },
  },

  // Jira — nested routes via Outlet system
  jira: {
    component: JiraLayout,
    children: {
      "": { component: JiraIssueListView },
      "detail/:key": { component: IssueDetail },
      sort: { component: SortOverlay, layout: "overlay" },
      statusFilter: { component: StatusFilter, layout: "overlay" },
      memberSelect: { component: MemberSelect, layout: "overlay" },
      help: { component: JiraHelpView, layout: "overlay" },
      logs: { component: LogOverlayView, layout: "overlay" },
    },
  },

  // Slack — nested routes via Outlet system
  slack: {
    component: SlackLayout,
    children: {
      "": { component: SlackListView },
      thread: { component: SlackThreadView },
      search: { component: SlackChannelSearch, layout: "overlay" },
      emoji: { component: SlackEmojiPicker, layout: "overlay" },
      status: { component: SlackStatusView, layout: "overlay" },
      help: { component: SlackHelpView, layout: "overlay" },
      logs: { component: LogOverlayView, layout: "overlay" },
    },
  },

  // Config — nested routes via Outlet system
  config: {
    component: ConfigLayout,
    children: {
      "": { component: ConfigMainView },
      help: { component: ConfigHelpView, layout: "overlay" },
      logs: { component: LogOverlayView, layout: "overlay" },
    },
  },
});
