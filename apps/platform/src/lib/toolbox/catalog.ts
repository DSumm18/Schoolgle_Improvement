import toolsData from "@/data/tools.json";

export type ToolboxSource = "schoolgle" | "external" | "customer-idea";
export type ToolboxStatus = "Live" | "Resource" | "Idea" | "Beta";
export type ToolboxCategory =
  | "All"
  | "Classroom"
  | "SEND"
  | "Admin"
  | "Compliance"
  | "Data"
  | "Finance"
  | "Estates"
  | "Planning";

export type ToolboxIconKey =
  | "boxes"
  | "users"
  | "sparkles"
  | "globe"
  | "shield"
  | "database"
  | "pound"
  | "building"
  | "book";

export type ToolboxItem = {
  id: string;
  name: string;
  description: string;
  category: Exclude<ToolboxCategory, "All">;
  source: ToolboxSource;
  status: ToolboxStatus;
  href: string;
  icon: ToolboxIconKey;
  accent: string;
  tags: string[];
  cta: string;
};

type ExternalTool = {
  id: string;
  name: string;
  url: string;
  category: string;
  tags: string[];
  summary: string;
};

const categoryMap: Record<string, Exclude<ToolboxCategory, "All">> = {
  Admin: "Admin",
  Compliance: "Compliance",
  Data: "Data",
  Estates: "Estates",
  Finance: "Finance",
  SEND: "SEND",
  Teaching: "Classroom",
};

const iconMap: Record<Exclude<ToolboxCategory, "All">, ToolboxIconKey> = {
  Admin: "boxes",
  Classroom: "book",
  Compliance: "shield",
  Data: "database",
  Estates: "building",
  Finance: "pound",
  Planning: "sparkles",
  SEND: "sparkles",
};

const accentMap: Record<Exclude<ToolboxCategory, "All">, string> = {
  Admin: "from-slate-500 to-slate-700",
  Classroom: "from-sky-500 to-cyan-500",
  Compliance: "from-purple-500 to-violet-600",
  Data: "from-blue-500 to-indigo-600",
  Estates: "from-teal-500 to-emerald-600",
  Finance: "from-amber-500 to-orange-600",
  Planning: "from-rose-500 to-pink-600",
  SEND: "from-emerald-500 to-lime-600",
};

const externalTools = (toolsData.tools as ExternalTool[]).slice(0, 10).map(
  (tool): ToolboxItem => {
    const category = categoryMap[tool.category] ?? "Admin";
    return {
      id: `external-${tool.id}`,
      name: tool.name,
      description: tool.summary,
      category,
      source: "external",
      status: "Resource",
      href: tool.url,
      icon: iconMap[category],
      accent: accentMap[category],
      tags: tool.tags.slice(0, 4),
      cta: "Open resource",
    };
  },
);

export const TOOLBOX_ITEMS: ToolboxItem[] = [
  {
    id: "class-builder",
    name: "Class Builder",
    description:
      "Import a pupil list, collect friendship and work-preference choices, generate explainable class groups, then preview seating plans from the same data.",
    category: "Classroom",
    source: "schoolgle",
    status: "Live",
    href: "/dashboard/toolbox/class-builder",
    icon: "users",
    accent: "from-sky-500 to-cyan-500",
    tags: ["CSV import", "pupil voice", "class groups", "seating plan"],
    cta: "Launch app",
  },
  {
    id: "policy-gap-sprint",
    name: "Policy Gap Sprint",
    description:
      "Customer idea: a quick checker that turns one missing or ageing policy into a bite-sized task pack with owner, deadline and template links.",
    category: "Compliance",
    source: "customer-idea",
    status: "Idea",
    href: "/dashboard/compliance/gdpr",
    icon: "shield",
    accent: "from-purple-500 to-violet-600",
    tags: ["customer idea", "policies", "tasks", "templates"],
    cta: "View related area",
  },
  ...externalTools,
];

export const TOOLBOX_CATEGORIES: ToolboxCategory[] = [
  "All",
  ...Array.from(
    new Set(TOOLBOX_ITEMS.map((item) => item.category).sort()),
  ),
];

export function filterToolboxItems({
  category,
  query,
}: {
  category: ToolboxCategory;
  query: string;
}) {
  const normalisedQuery = query.trim().toLowerCase();

  return TOOLBOX_ITEMS.filter((item) => {
    if (category !== "All" && item.category !== category) return false;
    if (!normalisedQuery) return true;

    return (
      item.name.toLowerCase().includes(normalisedQuery) ||
      item.description.toLowerCase().includes(normalisedQuery) ||
      item.tags.some((tag) => tag.toLowerCase().includes(normalisedQuery)) ||
      item.source.toLowerCase().includes(normalisedQuery)
    );
  });
}

export function getToolboxStats(items: ToolboxItem[]) {
  return {
    miniApps: items.filter((item) => item.source === "schoolgle").length,
    resources: items.filter((item) => item.source === "external").length,
    ideas: items.filter((item) => item.source === "customer-idea").length,
  };
}
