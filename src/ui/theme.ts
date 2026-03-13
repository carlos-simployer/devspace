export interface Theme {
  name: string;
  ui: {
    border: string;
    muted: string;
    heading: string;
    shortcutKey: string;
    activeIndicator: string;
  };
  status: {
    success: string;
    failure: string;
    pending: string;
    info: string;
    muted: string;
  };
  diff: {
    added: string;
    removed: string;
    hunk: string;
  };
  input: {
    search: string;
    comment: string;
    warning: string;
  };
  activity: {
    dot: string;
    unread: string;
    notification: string;
  };
  list: {
    addAction: string;
    repoName: string;
  };
  meta: {
    branch: string;
    draft: string;
    ready: string;
  };
}

export const THEME_NAMES = [
  "default",
  "catppuccin",
  "dracula",
  "nord",
  "tokyo-night",
] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

const defaultTheme: Theme = {
  name: "Default",
  ui: {
    border: "cyan",
    muted: "#6c7086",
    heading: "cyan",
    shortcutKey: "cyan",
    activeIndicator: "green",
  },
  status: {
    success: "green",
    failure: "red",
    pending: "yellow",
    info: "cyan",
    muted: "gray",
  },
  diff: {
    added: "green",
    removed: "red",
    hunk: "cyan",
  },
  input: {
    search: "yellow",
    comment: "magenta",
    warning: "yellow",
  },
  activity: {
    dot: "yellow",
    unread: "cyan",
    notification: "yellow",
  },
  list: {
    addAction: "green",
    repoName: "#6c7086",
  },
  meta: {
    branch: "cyan",
    draft: "yellow",
    ready: "green",
  },
};

const catppuccinTheme: Theme = {
  name: "Catppuccin Mocha",
  ui: {
    border: "#89b4fa",
    muted: "#6c7086",
    heading: "#89b4fa",
    shortcutKey: "#89b4fa",
    activeIndicator: "#a6e3a1",
  },
  status: {
    success: "#a6e3a1",
    failure: "#f38ba8",
    pending: "#f9e2af",
    info: "#89b4fa",
    muted: "#6c7086",
  },
  diff: {
    added: "#a6e3a1",
    removed: "#f38ba8",
    hunk: "#89b4fa",
  },
  input: {
    search: "#f9e2af",
    comment: "#cba6f7",
    warning: "#f9e2af",
  },
  activity: {
    dot: "#f9e2af",
    unread: "#89b4fa",
    notification: "#f9e2af",
  },
  list: {
    addAction: "#a6e3a1",
    repoName: "#6c7086",
  },
  meta: {
    branch: "#89b4fa",
    draft: "#f9e2af",
    ready: "#a6e3a1",
  },
};

const draculaTheme: Theme = {
  name: "Dracula",
  ui: {
    border: "#bd93f9",
    muted: "#6272a4",
    heading: "#bd93f9",
    shortcutKey: "#bd93f9",
    activeIndicator: "#50fa7b",
  },
  status: {
    success: "#50fa7b",
    failure: "#ff5555",
    pending: "#f1fa8c",
    info: "#bd93f9",
    muted: "#6272a4",
  },
  diff: {
    added: "#50fa7b",
    removed: "#ff5555",
    hunk: "#bd93f9",
  },
  input: {
    search: "#f1fa8c",
    comment: "#ff79c6",
    warning: "#f1fa8c",
  },
  activity: {
    dot: "#f1fa8c",
    unread: "#bd93f9",
    notification: "#f1fa8c",
  },
  list: {
    addAction: "#50fa7b",
    repoName: "#6272a4",
  },
  meta: {
    branch: "#bd93f9",
    draft: "#f1fa8c",
    ready: "#50fa7b",
  },
};

const nordTheme: Theme = {
  name: "Nord",
  ui: {
    border: "#81a1c1",
    muted: "#4c566a",
    heading: "#81a1c1",
    shortcutKey: "#81a1c1",
    activeIndicator: "#a3be8c",
  },
  status: {
    success: "#a3be8c",
    failure: "#bf616a",
    pending: "#ebcb8b",
    info: "#81a1c1",
    muted: "#4c566a",
  },
  diff: {
    added: "#a3be8c",
    removed: "#bf616a",
    hunk: "#81a1c1",
  },
  input: {
    search: "#ebcb8b",
    comment: "#b48ead",
    warning: "#ebcb8b",
  },
  activity: {
    dot: "#ebcb8b",
    unread: "#81a1c1",
    notification: "#ebcb8b",
  },
  list: {
    addAction: "#a3be8c",
    repoName: "#4c566a",
  },
  meta: {
    branch: "#81a1c1",
    draft: "#ebcb8b",
    ready: "#a3be8c",
  },
};

const tokyoNightTheme: Theme = {
  name: "Tokyo Night",
  ui: {
    border: "#7aa2f7",
    muted: "#565f89",
    heading: "#7aa2f7",
    shortcutKey: "#7aa2f7",
    activeIndicator: "#9ece6a",
  },
  status: {
    success: "#9ece6a",
    failure: "#f7768e",
    pending: "#e0af68",
    info: "#7aa2f7",
    muted: "#565f89",
  },
  diff: {
    added: "#9ece6a",
    removed: "#f7768e",
    hunk: "#7aa2f7",
  },
  input: {
    search: "#e0af68",
    comment: "#bb9af7",
    warning: "#e0af68",
  },
  activity: {
    dot: "#e0af68",
    unread: "#7aa2f7",
    notification: "#e0af68",
  },
  list: {
    addAction: "#9ece6a",
    repoName: "#565f89",
  },
  meta: {
    branch: "#7aa2f7",
    draft: "#e0af68",
    ready: "#9ece6a",
  },
};

export const THEMES: Record<ThemeName, Theme> = {
  default: defaultTheme,
  catppuccin: catppuccinTheme,
  dracula: draculaTheme,
  nord: nordTheme,
  "tokyo-night": tokyoNightTheme,
};

let activeTheme: Theme = defaultTheme;

export function getTheme(): Theme {
  return activeTheme;
}

export function setTheme(name: ThemeName): void {
  activeTheme = THEMES[name] ?? defaultTheme;
}

export function getThemeNames(): ThemeName[] {
  return [...THEME_NAMES];
}

export const icons = {
  success: "\u2713",
  failure: "\u2717",
  pending: "\u25CF",
  review: "\u25CC",
  none: "\u2014",
  conflict: "!",
} as const;
