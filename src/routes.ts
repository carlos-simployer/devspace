import { defineRoutes } from "./ui/router.ts";
import { PRView } from "./views/prs/index.tsx";
import { DependencyTracker } from "./views/dependencies/index.tsx";
import { ConfigView } from "./views/config/index.tsx";
import { PipelinesView } from "./views/pipelines/index.tsx";
import { ReleasesView } from "./views/releases/index.tsx";
import { ProjectsView } from "./views/projects/index.tsx";
import { JiraView } from "./views/jira/index.tsx";

export const routes = defineRoutes({
  // PRs — PRView handles its own sub-views internally
  prs: { component: PRView },
  "prs/detail": { component: PRView },
  "prs/help": { component: PRView, layout: "overlay" },
  "prs/notifications": { component: PRView },
  "prs/search": { component: PRView, layout: "overlay" },

  // Dependencies — DependencyTracker handles its own sub-views
  dependencies: { component: DependencyTracker },
  "dependencies/help": { component: DependencyTracker, layout: "overlay" },
  "dependencies/search": { component: DependencyTracker, layout: "overlay" },

  // Pipelines — PipelinesView handles its own sub-views
  pipelines: { component: PipelinesView },
  "pipelines/help": { component: PipelinesView, layout: "overlay" },
  "pipelines/search": { component: PipelinesView, layout: "overlay" },
  "pipelines/runs": { component: PipelinesView },

  // Releases — ReleasesView handles its own sub-views
  releases: { component: ReleasesView },
  "releases/help": { component: ReleasesView, layout: "overlay" },
  "releases/search": { component: ReleasesView, layout: "overlay" },

  // Projects — ProjectsView handles its own sub-views
  projects: { component: ProjectsView },
  "projects/help": { component: ProjectsView, layout: "overlay" },
  "projects/add": { component: ProjectsView, layout: "overlay" },
  "projects/confirm": { component: ProjectsView, layout: "overlay" },

  // Jira — JiraView handles its own sub-views
  jira: { component: JiraView },
  "jira/detail/:key": { component: JiraView },
  "jira/statusFilter": { component: JiraView, layout: "overlay" },
  "jira/memberSelect": { component: JiraView, layout: "overlay" },
  "jira/sort": { component: JiraView, layout: "overlay" },
  "jira/help": { component: JiraView, layout: "overlay" },
  "jira/search": { component: JiraView },

  // Config — ConfigView handles its own sub-views
  config: { component: ConfigView },
  "config/addOrg": { component: ConfigView, layout: "overlay" },
  "config/editAzureOrg": { component: ConfigView, layout: "overlay" },
  "config/editAzureProject": { component: ConfigView, layout: "overlay" },
  "config/editJiraSite": { component: ConfigView, layout: "overlay" },
  "config/editJiraEmail": { component: ConfigView, layout: "overlay" },
  "config/editJiraToken": { component: ConfigView, layout: "overlay" },
  "config/editJiraProject": { component: ConfigView, layout: "overlay" },
});
