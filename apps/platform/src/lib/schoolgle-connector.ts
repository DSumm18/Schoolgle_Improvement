export const CONNECTOR_BRAND = {
  name: "Schoolgle Connector",
  homeFolderName: "Schoolgle",
  supportIdentity: "connector@schoolgle.co.uk",
  description:
    "One read-only bridge from Schoolgle to the school's approved Drive or SharePoint folders.",
} as const;

export const CONNECTOR_GOOGLE_SCOPE =
  [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.readonly",
  ].join(" ");

export const CONNECTOR_SECURITY_COPY = [
  "Connect with OAuth to create and use a dedicated Schoolgle folder without making Drive public.",
  "Schoolgle scans the dedicated Schoolgle folder so files manually dropped into it can be detected.",
  "Schoolgle can read Drive files for scanning, but only creates and organises the Schoolgle folder structure.",
  "Schoolgle never moves or deletes files from Drive.",
  "Schools can disconnect the Schoolgle Connector at any time.",
] as const;

export const POLICY_GENERATED_DRAFTS_FOLDER =
  "Drafts - Schoolgle Generated";

export type SchoolgleConnectorFolder = {
  name: string;
  appKey: string;
  description: string;
  category?: string;
  iconKey:
    | "barChart"
    | "clipboard"
    | "database"
    | "fileText"
    | "pound"
    | "shield";
  color: string;
  children?: Array<{
    name: string;
    description: string;
    category: string;
  }>;
};

export const SCHOOLGLE_CONNECTOR_FOLDERS: SchoolgleConnectorFolder[] = [
  {
    name: "Ofsted Readiness",
    appKey: "ofsted-readiness",
    description: "Inspection evidence, website checks, policies and readiness findings",
    category: "documents",
    iconKey: "clipboard",
    color: "text-blue-600",
    children: [
      {
        name: "00 Inbox - To Sort",
        description: "Drop-zone for evidence that needs Schoolgle triage",
        category: "documents",
      },
      {
        name: "Safeguarding",
        description: "Safeguarding evidence, checks and implementation records",
        category: "documents",
      },
      {
        name: "Curriculum",
        description: "Curriculum intent, implementation and impact evidence",
        category: "documents",
      },
      {
        name: "Assessment and Outcomes",
        description: "School outcome narratives and validated assessment evidence",
        category: "assessments",
      },
      {
        name: "Attendance and Behaviour",
        description: "Attendance, behaviour and attitudes evidence",
        category: "attendance",
      },
      {
        name: "SEND and Inclusion",
        description: "SEND, disadvantaged and inclusion evidence",
        category: "documents",
      },
      {
        name: "Personal Development",
        description: "Personal development and wider curriculum evidence",
        category: "documents",
      },
      {
        name: "Leadership and Governance",
        description: "Leadership, governance and improvement evidence",
        category: "documents",
      },
      {
        name: "Website and Statutory Info",
        description: "Website screenshots, statutory page checks and publication evidence",
        category: "documents",
      },
      {
        name: "_Archive - Do Not Scan",
        description: "Historical Ofsted evidence excluded from normal scans",
        category: "archive",
      },
    ],
  },
  {
    name: "SIAMS Readiness",
    appKey: "siams-readiness",
    description: "Church school inspection evidence, religious education and collective worship",
    category: "documents",
    iconKey: "clipboard",
    color: "text-amber-700",
    children: [
      {
        name: "00 Inbox - To Sort",
        description: "Drop-zone for SIAMS evidence that needs triage",
        category: "documents",
      },
      {
        name: "Christian Vision",
        description: "Vision, theological rooting and lived impact evidence",
        category: "documents",
      },
      {
        name: "Collective Worship",
        description: "Collective worship planning, monitoring and impact evidence",
        category: "documents",
      },
      {
        name: "Religious Education",
        description: "RE curriculum, standards and monitoring evidence",
        category: "documents",
      },
      {
        name: "Spiritual Development",
        description: "Spiritual flourishing and personal development evidence",
        category: "documents",
      },
      {
        name: "Inclusion and Flourishing",
        description: "Inclusion, wellbeing and community flourishing evidence",
        category: "documents",
      },
      {
        name: "Leadership and Governance",
        description: "Church school leadership and governance evidence",
        category: "documents",
      },
      {
        name: "Church and Community",
        description: "Parish, diocesan and community partnership evidence",
        category: "documents",
      },
      {
        name: "Website and Statutory Info",
        description: "Published SIAMS, RE and church-school information",
        category: "documents",
      },
      {
        name: "_Archive - Do Not Scan",
        description: "Historical SIAMS evidence excluded from normal scans",
        category: "archive",
      },
    ],
  },
  {
    name: "Trust Assessor",
    appKey: "trust-assessor",
    description: "School review evidence, local intelligence and assessment exports",
    category: "assessments",
    iconKey: "barChart",
    color: "text-indigo-600",
    children: [
      {
        name: "Trust Spreadsheets",
        description: "Trust-level workbooks and validated school data returns",
        category: "assessments",
      },
      {
        name: "School Review Evidence",
        description: "School-level review notes, visits and supporting evidence",
        category: "documents",
      },
      {
        name: "Data Quality Warnings",
        description: "Exports or notes used to explain data validation issues",
        category: "assessments",
      },
      {
        name: "_Archive - Do Not Scan",
        description: "Historical trust assessor files excluded from normal scans",
        category: "archive",
      },
    ],
  },
  {
    name: "MIS Exports",
    appKey: "school-intelligence",
    description: "Pupils, attendance, assessment, behaviour and staff exports",
    iconKey: "database",
    color: "text-blue-600",
    children: [
      {
        name: "Pupil Data",
        description: "Pupil roll, SEN register",
        category: "pupils",
      },
      {
        name: "Attendance",
        description: "Termly attendance exports",
        category: "attendance",
      },
      {
        name: "Assessments",
        description: "Statutory results, tracker exports",
        category: "assessments",
      },
      {
        name: "Behaviour",
        description: "Behaviour incident logs",
        category: "behaviour",
      },
      {
        name: "Staff & HR",
        description: "Staff list, teacher history",
        category: "staff",
      },
    ],
  },
  {
    name: "Policies",
    appKey: "policy-manager",
    description: "Current policies, review dates and governor-approved documents",
    category: "documents",
    iconKey: "fileText",
    color: "text-slate-600",
    children: [
      {
        name: "Current Policies",
        description: "Canonical current policy documents managed by the school",
        category: "documents",
      },
      {
        name: "Review Due",
        description: "Policies awaiting owner review or governor approval",
        category: "documents",
      },
      {
        name: POLICY_GENERATED_DRAFTS_FOLDER,
        description:
          "Schoolgle-created draft policies awaiting review before becoming source-of-truth documents",
        category: "drafts",
      },
      {
        name: "_Archive - Do Not Scan",
        description: "Superseded policies retained for audit but excluded from scans",
        category: "archive",
      },
    ],
  },
  {
    name: "Compliance",
    appKey: "compliance",
    description: "GDPR, safeguarding, statutory checks and compliance evidence",
    category: "documents",
    iconKey: "shield",
    color: "text-emerald-600",
    children: [
      {
        name: "Safeguarding",
        description: "Safeguarding compliance evidence and statutory records",
        category: "documents",
      },
      {
        name: "GDPR",
        description: "Data protection evidence, audits and records",
        category: "documents",
      },
      {
        name: "Training",
        description: "Training records and certificates",
        category: "staff",
      },
      {
        name: "Single Central Record",
        description: "SCR evidence and audit exports",
        category: "staff",
      },
      {
        name: "_Archive - Do Not Scan",
        description: "Historical compliance evidence excluded from normal scans",
        category: "archive",
      },
    ],
  },
  {
    name: "Finance",
    appKey: "finance",
    description: "FMS exports, budget reports and finance evidence",
    iconKey: "pound",
    color: "text-amber-600",
    children: [
      {
        name: "Budget Reports",
        description: "FMS Detailed Cost Centre reports",
        category: "fms",
      },
    ],
  },
  {
    name: "Estates",
    appKey: "estates",
    description: "Premises evidence, energy invoices and contractor compliance",
    iconKey: "shield",
    color: "text-teal-600",
    children: [
      {
        name: "Energy Invoices",
        description: "Supplier PDF invoices for electricity, gas and water",
        category: "energy",
      },
    ],
  },
];

const CONNECTOR_APP_ENTITLEMENT_ALIASES: Record<string, string[]> = {
  "ofsted-readiness": ["ofsted-readiness", "improvement"],
  "siams-readiness": ["siams-readiness", "improvement"],
  "trust-assessor": ["trust-assessor", "improvement"],
  "school-intelligence": ["school-intelligence", "intelligence"],
  "policy-manager": ["policy-manager", "compliance-policies", "compliance"],
  compliance: ["compliance", "compliance-home"],
  finance: ["finance", "finance-home"],
  estates: ["estates", "estates-home", "estates-compliance", "compliance-checks"],
};

export function getConnectorFoldersForAppKeys(
  appKeys: string[],
): SchoolgleConnectorFolder[] {
  const requestedAppKeys = new Set(appKeys);
  return SCHOOLGLE_CONNECTOR_FOLDERS.filter((folder) =>
    requestedAppKeys.has(folder.appKey),
  );
}

export function resolveConnectorAppKeysFromEntitlements(
  enabledEntitlements: string[] | null | undefined,
): string[] {
  const enabled = new Set(
    (enabledEntitlements || [])
      .map((key) => key.trim().toLowerCase())
      .filter(Boolean),
  );

  return SCHOOLGLE_CONNECTOR_FOLDERS.flatMap((folder) => {
    const entitlementAliases =
      CONNECTOR_APP_ENTITLEMENT_ALIASES[folder.appKey] || [folder.appKey];
    return entitlementAliases.some((alias) => enabled.has(alias))
      ? [folder.appKey]
      : [];
  });
}

export type SchoolgleAppConnectionScope = {
  appKey: string;
  appName: string;
  moduleName: string;
  route: string;
  primaryFolder: string;
  includedFolders: string[];
  consumesFrom?: string[];
  sourceOfTruth: string;
  databaseStores: string;
};

export const SCHOOLGLE_APP_CONNECTION_SCOPES: SchoolgleAppConnectionScope[] = [
  {
    appKey: "policy-manager",
    appName: "Policy Manager",
    moduleName: "Compliance",
    route: "/dashboard/compliance/policies",
    primaryFolder: "Policies",
    includedFolders: [
      "Policies",
      "Policies/Current Policies",
      "Policies/Review Due",
      `Policies/${POLICY_GENERATED_DRAFTS_FOLDER}`,
    ],
    sourceOfTruth:
      "Drive or SharePoint policy files remain the canonical policy documents unless Schoolgle generated the document.",
    databaseStores:
      "Policy register metadata: file ID, title, type, owner, review dates, approval state, scan status and extracted checks.",
  },
  {
    appKey: "ofsted-readiness",
    appName: "Ofsted Readiness",
    moduleName: "Inspection Readiness",
    route: "/dashboard/ofsted-readiness",
    primaryFolder: "Ofsted Readiness",
    includedFolders: ["Ofsted Readiness"],
    consumesFrom: [
      "Policy Manager summaries",
      "Trust Assessor validated intelligence",
      "School Intelligence gaps",
      "Website compliance scans",
      "Unified Tasks",
    ],
    sourceOfTruth:
      "Drive or SharePoint holds inspection evidence; website scans check the live published site; validated intelligence stays in Schoolgle tables.",
    databaseStores:
      "Evidence matches, readiness findings, checklist status, scan summaries, generated tasks and evidence trails.",
  },
  {
    appKey: "siams-readiness",
    appName: "SIAMS Readiness",
    moduleName: "Inspection Readiness",
    route: "/dashboard/siams",
    primaryFolder: "SIAMS Readiness",
    includedFolders: ["SIAMS Readiness"],
    consumesFrom: ["Policy Manager summaries", "Website compliance scans", "Unified Tasks"],
    sourceOfTruth:
      "Drive or SharePoint holds SIAMS evidence and church-school documents; website scans check live publication.",
    databaseStores:
      "SIAMS evidence matches, framework assessments, findings, tasks and church-school readiness trail.",
  },
  {
    appKey: "trust-assessor",
    appName: "Trust Assessor",
    moduleName: "Inspection Readiness",
    route: "/dashboard/school-improvement/trust-assessor",
    primaryFolder: "Trust Assessor",
    includedFolders: ["Trust Assessor"],
    consumesFrom: ["DfE warehouse", "School Intelligence"],
    sourceOfTruth:
      "Trust spreadsheets and DfE datasets are source evidence; Trust Assessor values must be explicit, validated and labelled.",
    databaseStores:
      "Validated metrics, school/trust summaries, data-quality warnings, heatmaps, narratives and source references.",
  },
  {
    appKey: "school-intelligence",
    appName: "School Intelligence",
    moduleName: "School Intelligence",
    route: "/dashboard/school-intelligence",
    primaryFolder: "MIS Exports",
    includedFolders: [
      "MIS Exports/Pupil Data",
      "MIS Exports/Attendance",
      "MIS Exports/Assessments",
      "MIS Exports/Behaviour",
      "MIS Exports/Staff & HR",
    ],
    consumesFrom: ["DfE warehouse", "Trust Assessor validated intelligence"],
    sourceOfTruth:
      "MIS exports and DfE datasets are source evidence; pupil-level analysis is pseudonymised before storage.",
    databaseStores:
      "Approved imports, pseudonymised pupil assessment records, cohort outcomes, gaps, trends and data-quality flags.",
  },
  {
    appKey: "compliance",
    appName: "Compliance",
    moduleName: "Compliance",
    route: "/dashboard/compliance",
    primaryFolder: "Compliance",
    includedFolders: ["Compliance"],
    consumesFrom: ["Policy Manager", "Unified Tasks"],
    sourceOfTruth:
      "Compliance evidence files remain in Drive or SharePoint; Schoolgle-managed statutory records live in Supabase.",
    databaseStores:
      "Compliance items, checks, training status, SCR metadata, findings, reminders and tasks.",
  },
  {
    appKey: "estates",
    appName: "Estates",
    moduleName: "Estates",
    route: "/estates-compliance",
    primaryFolder: "Estates",
    includedFolders: ["Estates"],
    consumesFrom: ["Compliance", "Unified Tasks"],
    sourceOfTruth:
      "Contractor certificates, invoices and premises evidence remain in Drive or SharePoint; operational estate records live in Schoolgle.",
    databaseStores:
      "Assets, contractors, checks, helpdesk tickets, inspections, tasks and linked evidence metadata.",
  },
  {
    appKey: "governance",
    appName: "Governance",
    moduleName: "Governance",
    route: "/dashboard/governance",
    primaryFolder: "Policies",
    includedFolders: ["Policies/Current Policies", "Policies/Review Due"],
    consumesFrom: ["Policy Manager", "Meetings", "Unified Tasks"],
    sourceOfTruth:
      "Approved policy documents and governance papers remain in their connected folders unless generated in Schoolgle.",
    databaseStores:
      "Governors, visits, meetings, approvals, policy review links and governance task history.",
  },
];

export function getConnectorFolderLabels(): string[] {
  return SCHOOLGLE_CONNECTOR_FOLDERS.map((folder) => folder.name);
}

export function getAppConnectionScope(
  appKey: string,
): SchoolgleAppConnectionScope | null {
  return (
    SCHOOLGLE_APP_CONNECTION_SCOPES.find((scope) => scope.appKey === appKey) ||
    null
  );
}

export function isConnectorArchivePath(path: string): boolean {
  const segments = path
    .toLowerCase()
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.some(
    (segment) =>
      segment.includes("archive") ||
      segment.includes("archived") ||
      segment.includes("superseded") ||
      segment.includes("do not scan"),
  );
}

export function isConnectorGeneratedDraftPath(path: string): boolean {
  const segments = path
    .toLowerCase()
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.some(
    (segment) =>
      segment === POLICY_GENERATED_DRAFTS_FOLDER.toLowerCase() ||
      segment.includes("schoolgle generated"),
  );
}

export function getConnectorFolderStructureText(
  schoolName = "Your School",
  appKeys?: string[],
): string {
  const lines = [`${schoolName}`, `└── ${CONNECTOR_BRAND.homeFolderName}`];
  const folders = appKeys
    ? getConnectorFoldersForAppKeys(appKeys)
    : SCHOOLGLE_CONNECTOR_FOLDERS;

  folders.forEach((folder, folderIndex) => {
    const isLastFolder = folderIndex === folders.length - 1;
    const folderPrefix = isLastFolder ? "    └──" : "    ├──";
    lines.push(`${folderPrefix} ${folder.name}`);

    folder.children?.forEach((child, childIndex) => {
      const isLastChild = childIndex === (folder.children?.length || 0) - 1;
      const childPrefix = isLastFolder ? "        " : "    │   ";
      lines.push(`${childPrefix}${isLastChild ? "└──" : "├──"} ${child.name}`);
    });
  });

  return lines.join("\n");
}

export function getSafeConnectorFolderTarget(
  folder: { id: string; name: string } | null,
): { id: string; name: string } | null {
  if (!folder) return null;
  if (folder.id === "root") return null;
  if (folder.name.trim().toLowerCase() !== CONNECTOR_BRAND.homeFolderName.toLowerCase()) {
    return null;
  }
  return { id: folder.id, name: folder.name };
}
