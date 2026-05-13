export type GiasConfidenceStatus =
  | "verified"
  | "missing"
  | "conflicting"
  | "stale"
  | "manual_verified";

export type GiasSourceMethod = "bulk_export" | "gias_page_scrape" | "manual_verified";

export type GiasExtendedProfile = {
  urn: number;
  school_name: string;
  sen_provision_type: string | null;
  resourced_provision_type: string | null;
  resourced_provision_on_roll: number | null;
  resourced_provision_capacity: number | null;
  sen_unit_on_roll: number | null;
  sen_unit_capacity: number | null;
  gias_last_confirmed: string | null;
  source_url?: string;
  source_method?: GiasSourceMethod;
  source_fetched_at?: string;
  confidence_status: GiasConfidenceStatus;
  validation_notes: string[];
  raw_snapshot?: Record<string, unknown>;
};

export type SenSchoolLevelFlags = {
  urn: number;
  SEN_Unit?: number | null;
  RP_Unit?: number | null;
};

type ParseArgs = {
  urn: number;
  schoolName: string;
  sourceUrl: string;
  html: string;
  fetchedAt: string;
};

const MISSING_VALUES = new Set(["", "-", "—", "–", "not recorded", "not applicable", "n/a"]);

const FIELD_LABELS = {
  senProvisionType: "Type of SEN provision",
  resourcedProvisionType: "Type of resourced provision",
  resourcedProvisionOnRoll: "Resourced provision number on roll",
  resourcedProvisionCapacity: "Resourced provision capacity",
  senUnitOnRoll: "Special Educational Needs (SEN) unit number on roll",
  senUnitCapacity: "Special Educational Needs (SEN) unit capacity",
  lastConfirmed: "Date last changed / confirmed",
} as const;

export function parseGiasExtendedProfileHtml(args: ParseArgs): GiasExtendedProfile {
  const text = normaliseHtmlToLabelValueText(args.html);
  const valueAfter = buildValueReader(text);
  const rawSnapshot = Object.fromEntries(
    Object.values(FIELD_LABELS).map((label) => [label, valueAfter(label)]),
  );

  const profile: GiasExtendedProfile = {
    urn: args.urn,
    school_name: args.schoolName,
    sen_provision_type: valueAfter(FIELD_LABELS.senProvisionType),
    resourced_provision_type: valueAfter(FIELD_LABELS.resourcedProvisionType),
    resourced_provision_on_roll: parseIntegerValue(
      valueAfter(FIELD_LABELS.resourcedProvisionOnRoll),
    ),
    resourced_provision_capacity: parseIntegerValue(
      valueAfter(FIELD_LABELS.resourcedProvisionCapacity),
    ),
    sen_unit_on_roll: parseIntegerValue(valueAfter(FIELD_LABELS.senUnitOnRoll)),
    sen_unit_capacity: parseIntegerValue(valueAfter(FIELD_LABELS.senUnitCapacity)),
    gias_last_confirmed: parseDateValue(valueAfter(FIELD_LABELS.lastConfirmed)),
    source_url: args.sourceUrl,
    source_method: "gias_page_scrape",
    source_fetched_at: args.fetchedAt,
    confidence_status: "missing",
    validation_notes: [],
    raw_snapshot: rawSnapshot,
  };

  if (hasAnyProvisionSignal(profile)) {
    return {
      ...profile,
      confidence_status: "verified",
    };
  }

  return {
    ...profile,
    confidence_status: "missing",
    validation_notes: ["No GIAS extended SEN provision fields were found."],
  };
}

export function reconcileGiasExtendedProfile(
  profile: GiasExtendedProfile,
  senFlags?: SenSchoolLevelFlags | null,
): GiasExtendedProfile {
  const validationNotes = [...profile.validation_notes, ...capacityWarnings(profile)];

  if (!senFlags) {
    return {
      ...profile,
      confidence_status: profile.confidence_status === "manual_verified" ? "manual_verified" : profile.confidence_status,
      validation_notes: uniqueNotes(validationNotes),
    };
  }

  const giasHasRp = hasResourcedProvision(profile);
  const giasHasSenUnit = hasSenUnit(profile);
  const senFileHasRp = Number(senFlags.RP_Unit ?? 0) > 0;
  const senFileHasSenUnit = Number(senFlags.SEN_Unit ?? 0) > 0;

  if ((giasHasRp && !senFileHasRp) || (giasHasSenUnit && !senFileHasSenUnit)) {
    if (giasHasRp && !senFileHasRp) {
      validationNotes.push(
        "GIAS indicates resourced provision but DfE SEN school-level file does not flag RP_Unit.",
      );
    }
    if (giasHasSenUnit && !senFileHasSenUnit) {
      validationNotes.push(
        "GIAS indicates SEN unit but DfE SEN school-level file does not flag SEN_Unit.",
      );
    }
    return {
      ...profile,
      confidence_status: "conflicting",
      validation_notes: uniqueNotes(validationNotes),
    };
  }

  if ((senFileHasRp && !giasHasRp) || (senFileHasSenUnit && !giasHasSenUnit)) {
    if (senFileHasRp && !giasHasRp) {
      validationNotes.push(
        "DfE SEN school-level file flags RP_Unit but GIAS provision type is missing.",
      );
    }
    if (senFileHasSenUnit && !giasHasSenUnit) {
      validationNotes.push(
        "DfE SEN school-level file flags SEN_Unit but GIAS provision type is missing.",
      );
    }
    return {
      ...profile,
      confidence_status: "conflicting",
      validation_notes: uniqueNotes(validationNotes),
    };
  }

  if (giasHasRp || giasHasSenUnit || senFileHasRp || senFileHasSenUnit) {
    validationNotes.push("GIAS provision flags align with DfE SEN school-level file.");
    return {
      ...profile,
      confidence_status: profile.confidence_status === "manual_verified" ? "manual_verified" : "verified",
      validation_notes: uniqueNotes(validationNotes),
    };
  }

  return {
    ...profile,
    confidence_status: profile.confidence_status === "manual_verified" ? "manual_verified" : "missing",
    validation_notes: uniqueNotes(validationNotes),
  };
}

function normaliseHtmlToLabelValueText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(dt|dd|div|p|li|tr|th|td|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\r/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function buildValueReader(text: string) {
  return (label: string) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\n\\s*([^\\n]+)`, "i"));
    return normaliseOptionalText(match?.[1]);
  };
}

function normaliseOptionalText(value: string | null | undefined) {
  const normalised = value?.replace(/\s+/g, " ").trim() ?? "";
  return MISSING_VALUES.has(normalised.toLowerCase()) ? null : normalised;
}

function parseIntegerValue(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseInt(value.replace(/,/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateValue(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function hasAnyProvisionSignal(profile: GiasExtendedProfile) {
  return Boolean(
    profile.sen_provision_type ||
      profile.resourced_provision_type ||
      profile.resourced_provision_on_roll !== null ||
      profile.resourced_provision_capacity !== null ||
      profile.sen_unit_on_roll !== null ||
      profile.sen_unit_capacity !== null,
  );
}

function hasResourcedProvision(profile: GiasExtendedProfile) {
  return (
    /resourced provision/i.test(profile.resourced_provision_type ?? "") ||
    profile.resourced_provision_on_roll !== null ||
    profile.resourced_provision_capacity !== null
  );
}

function hasSenUnit(profile: GiasExtendedProfile) {
  return (
    /\bsen unit\b/i.test(profile.resourced_provision_type ?? "") ||
    profile.sen_unit_on_roll !== null ||
    profile.sen_unit_capacity !== null
  );
}

function capacityWarnings(profile: GiasExtendedProfile) {
  const warnings: string[] = [];
  if (
    profile.resourced_provision_on_roll !== null &&
    profile.resourced_provision_capacity !== null &&
    profile.resourced_provision_on_roll > profile.resourced_provision_capacity
  ) {
    warnings.push("Resourced provision on-roll exceeds capacity.");
  }
  if (
    profile.sen_unit_on_roll !== null &&
    profile.sen_unit_capacity !== null &&
    profile.sen_unit_on_roll > profile.sen_unit_capacity
  ) {
    warnings.push("SEN unit on-roll exceeds capacity.");
  }
  return warnings;
}

function uniqueNotes(notes: string[]) {
  return Array.from(new Set(notes));
}
