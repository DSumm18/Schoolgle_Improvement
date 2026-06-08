export type PupilProfileCore = {
  id: string;
  pupil_id: string;
  source_pupil_ref?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  year_group?: string | null;
  current_class?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  send_status?: string | null;
  ehcp?: boolean | null;
  primary_need?: string | null;
  fsm_eligible?: boolean | null;
  pupil_premium?: boolean | null;
  eal?: boolean | null;
  is_active?: boolean | null;
  updated_at?: string | null;
};

export type PupilProfileModuleId =
  | "core"
  | "send"
  | "assessment-work"
  | "attendance"
  | "behaviour"
  | "safeguarding"
  | "pupil-premium";

export type PupilDataInventoryItem = {
  moduleId: PupilProfileModuleId;
  label: string;
  owner: "schoolgle_core" | "module";
  sensitivity: "standard" | "special_category" | "highly_restricted";
  retentionOwner: "school_policy" | "statutory" | "module_policy";
  includedInDsarExport: boolean;
};

export type PupilProfileCard = {
  id: "overview" | "send" | "assessment-work" | "gdpr";
  title: string;
  status: string;
  metric?: string;
  description: string;
  href?: string;
};

export type PupilProfileModules = {
  send?: {
    register?: {
      id: string;
      sen_status?: string | null;
      primary_need?: string | null;
      has_ehcp?: boolean | null;
      date_identified?: string | null;
    } | null;
    activeProvisions?: number;
    openActions?: number;
  };
  assessmentWork?: {
    evidenceItems?: number;
  };
};

const DATA_INVENTORY: Record<PupilProfileModuleId, PupilDataInventoryItem> = {
  core: {
    moduleId: "core",
    label: "Core pupil profile",
    owner: "schoolgle_core",
    sensitivity: "standard",
    retentionOwner: "school_policy",
    includedInDsarExport: true,
  },
  send: {
    moduleId: "send",
    label: "SEND register, provision and case file",
    owner: "module",
    sensitivity: "special_category",
    retentionOwner: "statutory",
    includedInDsarExport: true,
  },
  "assessment-work": {
    moduleId: "assessment-work",
    label: "Assessment and pupil work evidence",
    owner: "module",
    sensitivity: "standard",
    retentionOwner: "school_policy",
    includedInDsarExport: true,
  },
  attendance: {
    moduleId: "attendance",
    label: "Attendance and interventions",
    owner: "module",
    sensitivity: "standard",
    retentionOwner: "statutory",
    includedInDsarExport: true,
  },
  behaviour: {
    moduleId: "behaviour",
    label: "Behaviour incidents and exclusions",
    owner: "module",
    sensitivity: "special_category",
    retentionOwner: "school_policy",
    includedInDsarExport: true,
  },
  safeguarding: {
    moduleId: "safeguarding",
    label: "Safeguarding records",
    owner: "module",
    sensitivity: "highly_restricted",
    retentionOwner: "statutory",
    includedInDsarExport: true,
  },
  "pupil-premium": {
    moduleId: "pupil-premium",
    label: "Pupil premium strategy/interventions",
    owner: "module",
    sensitivity: "standard",
    retentionOwner: "school_policy",
    includedInDsarExport: true,
  },
};

export function formatPupilDisplayName(pupil: Pick<PupilProfileCore, "first_name" | "last_name" | "pupil_id">) {
  const name = [pupil.first_name, pupil.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return name || `Pupil ${pupil.pupil_id}`;
}

export function buildPupilProfileCards({
  pupil,
  modules,
}: {
  pupil: PupilProfileCore;
  modules: PupilProfileModules;
}): PupilProfileCard[] {
  const cards: PupilProfileCard[] = [
    {
      id: "overview",
      title: "Core profile",
      status: pupil.is_active === false ? "Archived/inactive" : "Current",
      description: [
        pupil.year_group ? `Year ${pupil.year_group}` : "Year not set",
        pupil.current_class || "Class not set",
      ].join(" · "),
    },
  ];

  if (modules.send?.register || pupil.send_status || pupil.ehcp) {
    const status = modules.send?.register?.sen_status || pupil.send_status || (pupil.ehcp ? "E" : "SEND");
    cards.push({
      id: "send",
      title: "SEND profile",
      status: status === "E" || modules.send?.register?.has_ehcp || pupil.ehcp ? "EHCP" : status,
      metric: String((modules.send?.activeProvisions ?? 0) + (modules.send?.openActions ?? 0)),
      description: [
        modules.send?.register?.primary_need || pupil.primary_need || "Need not set",
        `${modules.send?.activeProvisions ?? 0} active provision${modules.send?.activeProvisions === 1 ? "" : "s"}`,
        `${modules.send?.openActions ?? 0} open action${modules.send?.openActions === 1 ? "" : "s"}`,
      ].join(" · "),
      href: modules.send?.register?.id ? `/dashboard/send?pupil=${modules.send.register.id}` : "/dashboard/send",
    });
  }

  cards.push({
    id: "assessment-work",
    title: "Assessment & work",
    status: "Connected apps",
    metric: String(modules.assessmentWork?.evidenceItems ?? 0),
    description: "Pupil work, assessment evidence and AI-supported learning records link here as modules come online.",
  });

  cards.push({
    id: "gdpr",
    title: "Data inventory",
    status: "DSAR-ready spine",
    metric: String(buildPupilDataInventory(["core", "send", "assessment-work"]).length),
    description: "Lists which Schoolgle modules hold data for this pupil so export, archive, anonymise and delete controls do not miss records.",
  });

  return cards;
}

export function buildPupilDataInventory(moduleIds: PupilProfileModuleId[] = Object.keys(DATA_INVENTORY) as PupilProfileModuleId[]) {
  return moduleIds.map((moduleId) => DATA_INVENTORY[moduleId]);
}
