export type ModuleStatus = "live" | "building" | "planned";

export interface Module {
  title: string;
  desc: string;
  status: ModuleStatus;
  no: string;
  href: string;
}

export const MODULES: Module[] = [
  {
    title: "Authentication",
    desc: "Passwordless sign-in with one-time email codes.",
    status: "live",
    no: "01",
    href: "/dashboard",
  },
  {
    title: "Profile & settings",
    desc: "Avatar upload, display name, country and timezone.",
    status: "live",
    no: "02",
    href: "/dashboard/profile",
  },
  {
    title: "Pocket LMS",
    desc: "Design a course, its lessons and a quiz using AI. Experience the user journey realtime.",
    status: "live",
    no: "03",
    href: "/dashboard/lms",
  },
  {
    title: "Notifications",
    desc: "An in-app inbox, toasts and read/unread state.",
    status: "planned",
    no: "04",
    href: "/dashboard/notifications",
  },
  {
    title: "Search & filters",
    desc: "Debounced search with filters synced to the URL.",
    status: "planned",
    no: "05",
    href: "/dashboard/search",
  },
  {
    title: "Analytics",
    desc: "Charts built from your own activity in the lab.",
    status: "planned",
    no: "06",
    href: "/dashboard/analytics",
  },
  {
    title: "llms.txt Generator",
    desc: "Generate llms.txt for your website.",
    status: "planned",
    no: "07",
    href: "/dashboard/llms",
  },
];

export const STATUS_CONFIG: Record<
  ModuleStatus,
  {
    label: string;
    tagClass: string;
    dot: string;
    cta: string;
    btnStyle: "primary" | "secondary";
  }
> = {
  live: {
    label: "Live",
    tagClass: "tag-accent",
    dot: "var(--color-accent)",
    cta: "Open module",
    btnStyle: "primary",
  },
  building: {
    label: "In progress",
    tagClass: "tag-outline",
    dot: "var(--color-text)",
    cta: "Preview soon",
    btnStyle: "secondary",
  },
  planned: {
    label: "Planned",
    tagClass: "tag-neutral",
    dot: "var(--color-neutral-400)",
    cta: "Planned",
    btnStyle: "secondary",
  },
};
