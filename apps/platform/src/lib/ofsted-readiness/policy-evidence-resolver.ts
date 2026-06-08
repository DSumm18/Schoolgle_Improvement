export type EvaluationArea =
  | "SAFEGUARDING"
  | "INCLUSION"
  | "CURRICULUM_TEACHING"
  | "ACHIEVEMENT"
  | "ATTENDANCE_BEHAVIOUR"
  | "PERSONAL_DEVELOPMENT"
  | "LEADERSHIP";

export type EvidenceSource = "website" | "website_document" | "drive";
export type EvidenceReadinessStatus =
  | "ready"
  | "needs_review"
  | "needs_publication"
  | "present_unassessed";

export interface ExpectedOfstedDocument {
  name: string;
  priority: "critical" | "important" | "recommended";
  area: EvaluationArea;
  websiteRequirementKeys?: string[];
  websiteExpected?: boolean;
  websiteMatchTerms?: string[];
  websiteContentTerms?: string[];
}

export interface DriveEvidenceFile {
  id?: string;
  name: string;
  folderPath?: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface WebsiteRequirementEvidence {
  requirement_key: string;
  requirement_name: string;
  status: "compliant" | "partial" | "not_found" | "outdated" | "not_assessed";
  compliance_score: number | null;
  quality_score?: number | null;
  currency_status?: string | null;
  evidence_urls: string[] | null;
  evidence_quotes?: string[] | null;
  gaps?: string[] | null;
  recommendations?: string[] | null;
  red_flags?: string[] | null;
  review_date_found?: string | null;
  assessed_at?: string | null;
}

export interface WebsiteDocumentEvidence {
  url: string;
  filename: string | null;
  title: string | null;
  link_text: string | null;
  found_on_page_url: string | null;
  file_type: string | null;
  extracted_text?: string | null;
  extraction_method?: string | null;
  extraction_error?: string | null;
  word_count?: number | null;
  dates_found?: string[] | null;
  source?: "school" | "trust" | string | null;
}

export interface PolicyReviewSchedule {
  date_found: string;
  review_due_at: string;
  reminder_due_at: string;
  reminder_lead_months: number;
  review_note: string;
  reminder_note: string;
}

export interface ResolvedDocumentFound {
  name: string;
  path: string;
  area: string;
  matched_to: string;
  source: EvidenceSource;
  source_label: string;
  evidence_url: string | null;
  found_on_url: string | null;
  readiness_status: EvidenceReadinessStatus;
  website_status: WebsiteRequirementEvidence["status"] | null;
  compliance_score: number | null;
  quality_score: number | null;
  currency_status: string | null;
  evidence_quotes: string[];
  gaps: string[];
  recommendations: string[];
  red_flags: string[];
  notes: string[];
  action_required: boolean;
  policy_review: PolicyReviewSchedule | null;
}

export interface ResolvedDocumentMissing {
  expected_name: string;
  area: string;
  priority: string;
  reason: string;
  website_expected: boolean;
  suggested_action: string;
}

export interface AreaCoverage {
  found: number;
  expected: number;
  percentage: number;
}

export interface ResolvedDocumentEvidenceResult {
  documents_found: ResolvedDocumentFound[];
  documents_missing: ResolvedDocumentMissing[];
  coverage_by_area: Record<string, AreaCoverage>;
  overall_coverage: number;
  total_files_scanned: number;
  total_website_sources_scanned: number;
  action_required_count: number;
}

export const AREA_LABELS: Record<EvaluationArea, string> = {
  SAFEGUARDING: "Safeguarding",
  INCLUSION: "Inclusion",
  CURRICULUM_TEACHING: "Curriculum and Teaching",
  ACHIEVEMENT: "Achievement",
  ATTENDANCE_BEHAVIOUR: "Attendance and Behaviour",
  PERSONAL_DEVELOPMENT: "Personal Development and Well-being",
  LEADERSHIP: "Leadership and Governance",
};

const DEFAULT_WEBSITE_MATCH_TERMS_BY_DOCUMENT: Record<string, string[]> = {
  "Curriculum Overview": ["curriculum", "curriculum overview", "learning"],
  "Subject Policies": [
    "reading",
    "phonics",
    "writing",
    "maths",
    "mathematics",
    "science",
    "history",
    "geography",
    "art",
    "design technology",
    "music",
    "computing",
    "modern foreign language",
    "religious education",
    "physical education",
    "pshe",
    "rhe",
    "subject",
  ],
  "Progression Maps": [
    "progression map",
    "progression",
    "curriculum map",
    "long term plan",
    "medium term plan",
    "knowledge organiser",
    "year group overview",
  ],
  "Phonics Programme": ["phonics", "early reading"],
};

const DEFAULT_WEBSITE_CONTENT_TERMS_BY_DOCUMENT: Record<string, string[]> = {
  "Curriculum Overview": [
    "national curriculum",
    "curriculum intent",
    "curriculum implementation",
    "broad and balanced",
  ],
  "Phonics Programme": [
    "systematic synthetic phonics",
    "read write inc",
    "phonics programme",
    "early reading",
  ],
};

export const EXPECTED_OFSTED_DOCUMENTS: ExpectedOfstedDocument[] = [
  {
    area: "SAFEGUARDING",
    name: "Safeguarding Policy",
    priority: "critical",
    websiteRequirementKeys: ["safeguarding_policy"],
    websiteExpected: true,
  },
  { area: "SAFEGUARDING", name: "Single Central Record", priority: "critical" },
  { area: "SAFEGUARDING", name: "DSL Training", priority: "critical" },
  {
    area: "SAFEGUARDING",
    name: "Online Safety Policy",
    priority: "important",
    websiteRequirementKeys: ["online_safety_policy", "filtering_monitoring"],
    websiteExpected: true,
  },
  {
    area: "SAFEGUARDING",
    name: "Whistleblowing Policy",
    priority: "important",
    websiteRequirementKeys: ["whistleblowing"],
    websiteExpected: true,
  },
  {
    area: "SAFEGUARDING",
    name: "Safer Recruitment",
    priority: "critical",
  },
  {
    area: "INCLUSION",
    name: "SEND Policy",
    priority: "critical",
    websiteExpected: true,
  },
  { area: "INCLUSION", name: "SEND Register", priority: "critical" },
  {
    area: "INCLUSION",
    name: "Pupil Premium Strategy",
    priority: "important",
    websiteRequirementKeys: ["pupil_premium_strategy"],
    websiteExpected: true,
  },
  { area: "INCLUSION", name: "Provision Map", priority: "important" },
  {
    area: "INCLUSION",
    name: "Accessibility Plan",
    priority: "important",
    websiteRequirementKeys: ["accessibility_plan"],
    websiteExpected: true,
  },
  {
    area: "CURRICULUM_TEACHING",
    name: "Curriculum Overview",
    priority: "critical",
    websiteRequirementKeys: ["curriculum_content"],
    websiteExpected: true,
    websiteMatchTerms: ["curriculum", "curriculum overview", "learning"],
    websiteContentTerms: [
      "national curriculum",
      "curriculum intent",
      "curriculum implementation",
      "broad and balanced",
    ],
  },
  {
    area: "CURRICULUM_TEACHING",
    name: "Subject Policies",
    priority: "important",
    websiteMatchTerms: [
      "reading",
      "phonics",
      "writing",
      "maths",
      "mathematics",
      "science",
      "history",
      "geography",
      "art",
      "design technology",
      "music",
      "computing",
      "modern foreign language",
      "religious education",
      "physical education",
      "pshe",
      "rhe",
      "subject",
    ],
    websiteContentTerms: [
      "curriculum",
      "intent",
      "implementation",
      "knowledge",
      "skills",
    ],
  },
  {
    area: "CURRICULUM_TEACHING",
    name: "Progression Maps",
    priority: "important",
    websiteMatchTerms: [
      "progression map",
      "progression",
      "curriculum map",
      "long term plan",
      "medium term plan",
      "knowledge organiser",
      "year group overview",
    ],
  },
  {
    area: "CURRICULUM_TEACHING",
    name: "Phonics Programme",
    priority: "important",
    websiteRequirementKeys: ["phonics_reading"],
    websiteExpected: true,
    websiteMatchTerms: ["phonics", "early reading"],
    websiteContentTerms: [
      "systematic synthetic phonics",
      "read write inc",
      "phonics programme",
      "early reading",
    ],
  },
  {
    area: "CURRICULUM_TEACHING",
    name: "CPD Records",
    priority: "recommended",
  },
  {
    area: "CURRICULUM_TEACHING",
    name: "Monitoring Schedule",
    priority: "recommended",
  },
  { area: "ACHIEVEMENT", name: "Assessment Data", priority: "critical" },
  {
    area: "ACHIEVEMENT",
    name: "KS2 Results",
    priority: "important",
    websiteRequirementKeys: ["ks2_results"],
    websiteExpected: true,
  },
  {
    area: "ACHIEVEMENT",
    name: "Phonics Results",
    priority: "important",
    websiteRequirementKeys: ["phonics_reading"],
    websiteExpected: true,
  },
  { area: "ACHIEVEMENT", name: "EYFS Outcomes", priority: "important" },
  { area: "ACHIEVEMENT", name: "Progress Tracking", priority: "important" },
  {
    area: "ATTENDANCE_BEHAVIOUR",
    name: "Attendance Data",
    priority: "critical",
  },
  {
    area: "ATTENDANCE_BEHAVIOUR",
    name: "Attendance Policy",
    priority: "critical",
  },
  {
    area: "ATTENDANCE_BEHAVIOUR",
    name: "Behaviour Policy",
    priority: "critical",
    websiteRequirementKeys: ["behaviour_policy"],
    websiteExpected: true,
  },
  {
    area: "ATTENDANCE_BEHAVIOUR",
    name: "Exclusion Data",
    priority: "important",
  },
  {
    area: "PERSONAL_DEVELOPMENT",
    name: "PSHE Curriculum",
    priority: "important",
  },
  {
    area: "PERSONAL_DEVELOPMENT",
    name: "RSE Policy",
    priority: "critical",
    websiteRequirementKeys: ["rse_policy"],
    websiteExpected: true,
  },
  {
    area: "PERSONAL_DEVELOPMENT",
    name: "British Values",
    priority: "important",
  },
  {
    area: "PERSONAL_DEVELOPMENT",
    name: "Enrichment Programme",
    priority: "recommended",
  },
  { area: "LEADERSHIP", name: "SEF", priority: "critical" },
  {
    area: "LEADERSHIP",
    name: "School Improvement Plan",
    priority: "critical",
  },
  { area: "LEADERSHIP", name: "Governor Minutes", priority: "important" },
  { area: "LEADERSHIP", name: "Governor Training", priority: "recommended" },
  { area: "LEADERSHIP", name: "Staff Wellbeing", priority: "recommended" },
];

export function resolveOfstedDocumentEvidence(input: {
  expectedDocuments?: ExpectedOfstedDocument[];
  driveFiles?: DriveEvidenceFile[];
  websiteAssessments?: WebsiteRequirementEvidence[];
  websiteDocuments?: WebsiteDocumentEvidence[];
}): ResolvedDocumentEvidenceResult {
  const expectedDocuments = input.expectedDocuments ?? EXPECTED_OFSTED_DOCUMENTS;
  const driveFiles = input.driveFiles ?? [];
  const websiteAssessments = input.websiteAssessments ?? [];
  const websiteDocuments = input.websiteDocuments ?? [];
  const assessmentByKey = new Map(
    websiteAssessments.map((assessment) => [
      assessment.requirement_key,
      assessment,
    ]),
  );
  const found: ResolvedDocumentFound[] = [];
  const missing: ResolvedDocumentMissing[] = [];

  for (const expected of expectedDocuments) {
    const websiteAssessment = findWebsiteAssessment(expected, assessmentByKey);
    const websiteDocument = findBestWebsiteDocument(expected, websiteDocuments);
    if (websiteAssessment) {
      const supportingWebsiteDocument = findWebsiteDocumentForAssessment(
        expected,
        websiteAssessment,
        websiteDocuments,
      ) ?? websiteDocument;
      found.push(
        buildWebsiteAssessmentFound(
          expected,
          websiteAssessment,
          supportingWebsiteDocument,
        ),
      );
      continue;
    }

    if (websiteDocument) {
      found.push(buildWebsiteDocumentFound(expected, websiteDocument));
      continue;
    }

    const driveFile = driveFiles.find((file) =>
      fuzzyMatch(file.name, expected.name),
    );
    if (driveFile) {
      found.push(buildDriveFound(expected, driveFile));
      continue;
    }

    missing.push(buildMissing(expected));
  }

  const coverageByArea: Record<string, AreaCoverage> = {};
  for (const area of Object.keys(AREA_LABELS) as EvaluationArea[]) {
    const label = AREA_LABELS[area];
    const expectedCount = expectedDocuments.filter((doc) => doc.area === area).length;
    const foundCount = found.filter((doc) => doc.area === label).length;
    coverageByArea[label] = {
      found: foundCount,
      expected: expectedCount,
      percentage:
        expectedCount > 0 ? Math.round((foundCount / expectedCount) * 100) : 0,
    };
  }

  const overallCoverage =
    expectedDocuments.length > 0
      ? Math.round((found.length / expectedDocuments.length) * 100)
      : 0;

  return {
    documents_found: found,
    documents_missing: missing,
    coverage_by_area: coverageByArea,
    overall_coverage: overallCoverage,
    total_files_scanned: driveFiles.length,
    total_website_sources_scanned:
      websiteAssessments.length + websiteDocuments.length,
    action_required_count: found.filter((doc) => doc.action_required).length +
      missing.length,
  };
}

export function normaliseDocumentName(input: string): string {
  return input
    .toLowerCase()
    .replace(/\.(pdf|docx?|xlsx?|pptx?|csv|txt|odt|ods|gdoc|gsheet)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseSearchText(input: string): string {
  return normaliseDocumentName(input)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsSearchTerm(haystack: string, term: string): boolean {
  const normalisedHaystack = ` ${normaliseSearchText(haystack)} `;
  const normalisedTerm = normaliseSearchText(term);
  if (!normalisedTerm) return false;
  return normalisedHaystack.includes(` ${normalisedTerm} `);
}

export function fuzzyMatch(filename: string, expectedName: string): boolean {
  const normalisedFile = normaliseDocumentName(filename);
  const expectedWords = normaliseDocumentName(expectedName).split(" ");
  return expectedWords.every((word) => normalisedFile.includes(word));
}

function findWebsiteAssessment(
  expected: ExpectedOfstedDocument,
  assessmentByKey: Map<string, WebsiteRequirementEvidence>,
): WebsiteRequirementEvidence | null {
  for (const key of expected.websiteRequirementKeys ?? []) {
    const assessment = assessmentByKey.get(key);
    if (
      assessment &&
      assessment.status !== "not_found" &&
      assessment.status !== "not_assessed" &&
      hasEvidenceUrl(assessment.evidence_urls)
    ) {
      return assessment;
    }
  }
  return null;
}

function hasEvidenceUrl(urls: string[] | null): boolean {
  return Boolean(urls?.some((url) => url.trim().length > 0));
}

function findWebsiteDocumentForAssessment(
  expected: ExpectedOfstedDocument,
  assessment: WebsiteRequirementEvidence,
  websiteDocuments: WebsiteDocumentEvidence[],
): WebsiteDocumentEvidence | null {
  const evidenceUrls = (assessment.evidence_urls ?? [])
    .filter(Boolean)
    .map((url) => normaliseEvidenceUrl(url));

  if (evidenceUrls.length === 0) return null;

  const directMatches = websiteDocuments.filter((document) => {
    const documentUrl = normaliseEvidenceUrl(document.url);
    const foundOnPageUrl = normaliseEvidenceUrl(document.found_on_page_url ?? "");
    return evidenceUrls.some(
      (evidenceUrl) =>
        documentUrl === evidenceUrl ||
        foundOnPageUrl === evidenceUrl ||
        documentUrl.includes(evidenceUrl) ||
        evidenceUrl.includes(documentUrl),
    );
  });

  const candidates = uniqueDocumentsByUrl([
    ...directMatches,
    ...websiteDocuments.filter((document) =>
      websiteDocumentMatchesExpected(document, expected),
    ),
  ]).filter((document) => websiteDocumentMatchesExpected(document, expected));

  if (candidates.length === 0) return null;

  return candidates
    .map((document) => ({
      document,
      score: scoreWebsiteDocumentCandidate(
        expected,
        document,
        assessWebsiteDocumentContent(expected, document),
      ),
    }))
    .sort((left, right) => right.score - left.score)[0].document;
}

function normaliseEvidenceUrl(value: string): string {
  try {
    const parsedUrl = new URL(value);
    parsedUrl.hash = "";
    parsedUrl.search = "";
    return parsedUrl.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.trim().replace(/\/$/, "").toLowerCase();
  }
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function uniqueDocumentsByUrl(
  documents: WebsiteDocumentEvidence[],
): WebsiteDocumentEvidence[] {
  const seen = new Set<string>();
  return documents.filter((document) => {
    const key = normaliseEvidenceUrl(document.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normaliseOcrSeparatedText(input: string): string {
  return input
    .replace(/\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g, (match) =>
      match.replace(/\s+/g, ""),
    )
    .replace(/\b(?:\d\s+){1,}\d\b/g, (match) =>
      match.replace(/\s+/g, ""),
    );
}

function websiteMatchTerms(expected: ExpectedOfstedDocument): string[] {
  return [
    ...(DEFAULT_WEBSITE_MATCH_TERMS_BY_DOCUMENT[expected.name] ?? []),
    ...(expected.websiteMatchTerms ?? []),
  ];
}

function websiteContentTerms(expected: ExpectedOfstedDocument): string[] {
  return [
    ...(DEFAULT_WEBSITE_CONTENT_TERMS_BY_DOCUMENT[expected.name] ?? []),
    ...(expected.websiteContentTerms ?? []),
  ];
}

const SUBJECT_CURRICULUM_CONTEXT_TERMS = [
  "curriculum",
  "learning",
  "subject",
  "progression",
  "knowledge organiser",
  "long term plan",
  "medium term plan",
];

const SUBJECT_CURRICULUM_CONTENT_MARKERS = [
  "curriculum",
  "intent",
  "implementation",
  "knowledge",
  "skills",
  "national curriculum",
];

function isSubjectPoliciesCandidate(
  strongHaystack: string,
  contentHaystack: string,
  isHtmlPage: boolean,
): boolean {
  const subjectTerms = DEFAULT_WEBSITE_MATCH_TERMS_BY_DOCUMENT["Subject Policies"] ?? [];
  const hasSubjectTerm = subjectTerms.some((term) =>
    containsSearchTerm(strongHaystack, term),
  );
  if (!hasSubjectTerm) return false;

  const hasStrongCurriculumContext = SUBJECT_CURRICULUM_CONTEXT_TERMS.some((term) =>
    containsSearchTerm(strongHaystack, term),
  );
  if (hasStrongCurriculumContext) return true;

  if (!isHtmlPage) return false;

  return SUBJECT_CURRICULUM_CONTENT_MARKERS.some((term) =>
    containsSearchTerm(contentHaystack, term),
  );
}

function websiteDocumentMatchesExpected(
  document: WebsiteDocumentEvidence,
  expected: ExpectedOfstedDocument,
): boolean {
  const strongHaystack = [
    document.filename,
    document.title,
    document.link_text,
    document.url,
    document.found_on_page_url,
  ]
    .filter(Boolean)
    .join(" ");

  const normalisedStrongHaystack = normaliseDocumentName(strongHaystack);
  const normalisedContent = normaliseDocumentName(
    normaliseOcrSeparatedText(document.extracted_text ?? ""),
  );
  const isHtmlPage = document.file_type === "html_page" || document.file_type === "html";

  if (
    expected.name === "Subject Policies" &&
    !isSubjectPoliciesCandidate(
      strongHaystack,
      normalisedContent,
      isHtmlPage,
    )
  ) {
    return false;
  }

  if (fuzzyMatch(strongHaystack, expected.name)) return true;

  for (const term of websiteMatchTerms(expected)) {
    if (containsSearchTerm(strongHaystack, term)) {
      return true;
    }
  }

  if (
    (expected.websiteRequirementKeys ?? []).some((key) =>
      containsSearchTerm(normalisedStrongHaystack, key.replaceAll("_", " ")),
    )
  ) {
    return true;
  }

  const contentTerms = websiteContentTerms(expected);
  if (isHtmlPage && contentTerms.length > 0) {
    const matchedContentTerms = contentTerms.filter((term) =>
      containsSearchTerm(normalisedContent, term),
    );
    if (matchedContentTerms.length >= Math.min(2, contentTerms.length)) {
      return true;
    }
  }

  return false;
}

function findBestWebsiteDocument(
  expected: ExpectedOfstedDocument,
  websiteDocuments: WebsiteDocumentEvidence[],
): WebsiteDocumentEvidence | null {
  const candidates = websiteDocuments.filter((document) =>
    websiteDocumentMatchesExpected(document, expected),
  );
  if (candidates.length === 0) return null;

  return candidates
    .map((document) => ({
      document,
      score: scoreWebsiteDocumentCandidate(
        expected,
        document,
        assessWebsiteDocumentContent(expected, document),
      ),
    }))
    .sort((a, b) => b.score - a.score)[0].document;
}

function scoreWebsiteDocumentCandidate(
  expected: ExpectedOfstedDocument,
  document: WebsiteDocumentEvidence,
  assessment: ContentAssessmentResult | null,
): number {
  const expectedName = normaliseDocumentName(expected.name);
  const title = normaliseDocumentName(
    [document.title, document.link_text, document.filename, document.url]
      .filter(Boolean)
      .join(" "),
  );
  const foundOn = normaliseDocumentName(document.found_on_page_url ?? "");
  const content = normaliseDocumentName(
    normaliseOcrSeparatedText(document.extracted_text ?? ""),
  );

  let score = 0;
  if (title === expectedName) score += 60;
  if (title.includes(expectedName)) score += 45;
  for (const word of expectedName.split(" ").filter((part) => part.length > 2)) {
    if (title.includes(word)) score += 8;
  }
  for (const term of websiteMatchTerms(expected)) {
    if (containsSearchTerm(title, term)) score += 35;
    if (containsSearchTerm(foundOn, term)) score += 15;
  }
  for (const term of websiteContentTerms(expected)) {
    if (containsSearchTerm(content, term)) score += 12;
  }

  if (assessment) {
    score += assessment.compliance_score;
    score += Math.round(assessment.quality_score / 2);
    if (assessment.currency_status === "current") score += 120;
    if (assessment.currency_status === "unknown") score += 10;
    if (assessment.currency_status === "outdated") score -= 160;
    if (!assessment.action_required) score += 60;
  } else if (document.extracted_text) {
    score += 20;
  }

  if (document.source === "trust") score += 10;
  if (foundOn.includes("policies") || foundOn.includes("documents")) score += 10;
  if (document.file_type === "html_page" || document.file_type === "html") {
    score += 12;
  }
  if (document.url.includes("drive.google.com/file/")) score += 5;

  return score;
}

function buildWebsiteAssessmentFound(
  expected: ExpectedOfstedDocument,
  assessment: WebsiteRequirementEvidence,
  supportingDocument?: WebsiteDocumentEvidence | null,
): ResolvedDocumentFound {
  const documentAssessment = supportingDocument
    ? assessWebsiteDocumentContent(expected, supportingDocument)
    : null;
  const policyReview =
    buildPolicyReviewSchedule(assessment.review_date_found) ??
    documentAssessment?.policy_review ??
    null;
  const gaps = uniqueStrings([
    ...(assessment.gaps ?? []),
    ...(documentAssessment?.gaps ?? []),
  ]);
  const recommendations = uniqueStrings([
    ...(assessment.recommendations ?? []),
    ...(documentAssessment?.recommendations ?? []),
  ]);
  const redFlags = uniqueStrings([
    ...(assessment.red_flags ?? []),
    ...(documentAssessment?.red_flags ?? []),
  ]);
  const evidenceQuotes = uniqueStrings([
    ...(assessment.evidence_quotes ?? []),
    ...(documentAssessment?.evidence_quotes ?? []),
  ]);
  const readinessStatus =
    assessment.status === "compliant" && documentAssessment?.action_required !== true
      ? "ready"
      : "needs_review";
  const evidenceUrl =
    supportingDocument?.url ?? assessment.evidence_urls?.find(Boolean) ?? null;
  const notes = [
    `${assessment.requirement_name} was found on the website scan.`,
    ...(gaps.slice(0, 2)),
    ...(recommendations.slice(0, 2)),
    ...(policyReview ? [policyReview.review_note, policyReview.reminder_note] : []),
  ];

  return {
    name: assessment.requirement_name,
    path: evidenceUrl || assessment.requirement_name,
    area: AREA_LABELS[expected.area],
    matched_to: expected.name,
    source: "website",
    source_label: "Website scan",
    evidence_url: evidenceUrl,
    found_on_url: evidenceUrl,
    readiness_status: readinessStatus,
    website_status: assessment.status,
    compliance_score: assessment.compliance_score ?? documentAssessment?.compliance_score ?? null,
    quality_score: assessment.quality_score ?? documentAssessment?.quality_score ?? null,
    currency_status: assessment.currency_status ?? documentAssessment?.currency_status ?? null,
    evidence_quotes: evidenceQuotes,
    gaps,
    recommendations,
    red_flags: redFlags,
    notes,
    action_required: readinessStatus !== "ready",
    policy_review: policyReview,
  };
}

function buildWebsiteDocumentFound(
  expected: ExpectedOfstedDocument,
  document: WebsiteDocumentEvidence,
): ResolvedDocumentFound {
  const title = document.title || document.link_text || document.filename || expected.name;
  const contentAssessment = assessWebsiteDocumentContent(expected, document);
  const notes =
    contentAssessment?.notes ??
    [
      "Document was found on the website, but no detailed rubric assessment was available for this item.",
    ];
  if (document.extraction_error) {
    notes.push(`Text extraction note: ${document.extraction_error}`);
  }

  return {
    name: title,
    path: document.url,
    area: AREA_LABELS[expected.area],
    matched_to: expected.name,
    source: "website_document",
    source_label:
      document.file_type === "html_page" || document.file_type === "html"
        ? document.source === "trust"
          ? "Trust website page"
          : "Website page"
        : document.source === "trust"
          ? "Trust website document"
          : "Website document",
    evidence_url: document.url,
    found_on_url: document.found_on_page_url,
    readiness_status: contentAssessment?.readiness_status ?? "present_unassessed",
    website_status: null,
    compliance_score: contentAssessment?.compliance_score ?? null,
    quality_score: contentAssessment?.quality_score ?? null,
    currency_status: contentAssessment?.currency_status ?? null,
    evidence_quotes: contentAssessment?.evidence_quotes ?? [],
    gaps: contentAssessment?.gaps ?? [],
    recommendations: contentAssessment?.recommendations ?? [],
    red_flags: contentAssessment?.red_flags ?? [],
    notes,
    action_required: contentAssessment?.action_required ?? true,
    policy_review: contentAssessment?.policy_review ?? null,
  };
}

interface ContentAssessmentResult {
  readiness_status: EvidenceReadinessStatus;
  compliance_score: number;
  quality_score: number;
  currency_status: string;
  evidence_quotes: string[];
  gaps: string[];
  recommendations: string[];
  red_flags: string[];
  notes: string[];
  action_required: boolean;
  policy_review: PolicyReviewSchedule | null;
}

interface ContentRule {
  checkpoint: string;
  terms: Array<string | RegExp>;
  mode?: "all" | "any";
  severity: "important" | "critical";
  recommendation: string;
}

function assessWebsiteDocumentContent(
  expected: ExpectedOfstedDocument,
  document: WebsiteDocumentEvidence,
): ContentAssessmentResult | null {
  const rawText = document.extracted_text?.trim();
  if (!rawText) return null;

  const rules = getContentRules(expected.name);
  if (rules.length === 0) return null;

  const text = normaliseOcrSeparatedText(rawText);
  const lowerText = text.toLowerCase();
  const metRules: ContentRule[] = [];
  const failedRules: ContentRule[] = [];
  const evidenceQuotes: string[] = [];

  for (const rule of rules) {
    const matches = rule.terms.map((term) => termMatches(lowerText, term));
    const met =
      rule.mode === "any" ? matches.some(Boolean) : matches.every(Boolean);

    if (met) {
      metRules.push(rule);
      const quote = findEvidenceQuote(text, rule.terms);
      if (quote) evidenceQuotes.push(`${rule.checkpoint}: ${quote}`);
    } else {
      failedRules.push(rule);
    }
  }

  const qualityScore = Math.round((metRules.length / rules.length) * 100);
  const currency = assessPolicyCurrency(text, document.dates_found ?? []);
  const redFlags = failedRules
    .filter((rule) => rule.severity === "critical")
    .map((rule) => rule.checkpoint);
  const gaps = [
    ...failedRules.map((rule) => rule.checkpoint),
    ...(currency.status === "outdated" ? [currency.note] : []),
  ];
  const recommendations = [
    ...failedRules.map((rule) => rule.recommendation),
    ...(currency.status === "outdated"
      ? ["Review and republish the policy so the public website shows a current approval/review cycle."]
      : []),
  ];
  const complianceScore =
    currency.status === "outdated" ? Math.min(qualityScore, 78) : qualityScore;
  const actionRequired =
    complianceScore < 80 || redFlags.length > 0 || currency.status === "outdated";

  return {
    readiness_status: actionRequired ? "needs_review" : "ready",
    compliance_score: complianceScore,
    quality_score: qualityScore,
    currency_status: currency.status,
    evidence_quotes: evidenceQuotes.slice(0, 8),
    gaps,
    recommendations,
    red_flags: redFlags,
    notes: [
      `Website document text was assessed against ${rules.length} ${expected.name} checkpoints.`,
      `${metRules.length}/${rules.length} content checkpoints met.`,
      currency.note,
      ...(currency.policy_review ? [currency.policy_review.reminder_note] : []),
    ],
    action_required: actionRequired,
    policy_review: currency.policy_review,
  };
}

function getContentRules(expectedName: string): ContentRule[] {
  const normalisedName = normaliseDocumentName(expectedName);
  if (normalisedName === "safeguarding policy") return safeguardingPolicyRules();
  if (normalisedName !== "send policy") return [];

  return sendPolicyRules();
}

function sendPolicyRules(): ContentRule[] {
  return [
    {
      checkpoint: "References Children and Families Act 2014",
      terms: ["children and families act"],
      severity: "critical",
      recommendation:
        "Add or verify explicit reference to the Children and Families Act 2014.",
    },
    {
      checkpoint: "References SEND Code of Practice 2015",
      terms: ["special educational needs and disability", "code of practice"],
      severity: "critical",
      recommendation:
        "Add or verify explicit reference to the SEND Code of Practice 2015.",
    },
    {
      checkpoint: "References Equality Act 2010 or reasonable adjustments",
      terms: ["equality act", "reasonable adjustments"],
      mode: "any",
      severity: "important",
      recommendation:
        "Strengthen the equality/reasonable-adjustments reference if it is not already explicit.",
    },
    {
      checkpoint: "Defines SENCO role and responsibilities",
      terms: ["senco", "responsibilities"],
      severity: "critical",
      recommendation:
        "Make the SENCO role, responsibilities and contact route explicit.",
    },
    {
      checkpoint: "Describes the graduated approach: Assess, Plan, Do, Review",
      terms: ["graduated approach", "assess", "plan", "do", "review"],
      severity: "critical",
      recommendation:
        "Set out the graduated approach using the Assess, Plan, Do, Review cycle.",
    },
    {
      checkpoint: "Covers all four broad areas of need",
      terms: [
        "communication and interaction",
        "cognition and learning",
        "social, emotional and mental health",
        "sensory",
      ],
      severity: "important",
      recommendation:
        "Check that all four broad areas of SEND need are named and explained.",
    },
    {
      checkpoint: "Explains how SEND is identified and assessed",
      terms: ["identifying", "assessing their needs"],
      severity: "critical",
      recommendation:
        "Explain the process for identifying and assessing pupils with SEND.",
    },
    {
      checkpoint: "Explains parent/carer and pupil involvement",
      terms: ["parents", "pupils"],
      severity: "important",
      recommendation:
        "Clarify how parents/carers and pupils are consulted and involved.",
    },
    {
      checkpoint: "Covers EHCP arrangements",
      terms: ["education, health and care plan"],
      severity: "important",
      recommendation:
        "Include the route for Education, Health and Care Plan support where relevant.",
    },
    {
      checkpoint: "Covers admission and accessibility arrangements",
      terms: ["admission", "accessibility"],
      severity: "important",
      recommendation:
        "Make admission and accessibility arrangements clear in the SEND policy or linked evidence.",
    },
    {
      checkpoint: "Covers complaints about SEND provision",
      terms: ["complaints", "send provision"],
      severity: "important",
      recommendation:
        "Include or link to the complaints route for SEND provision.",
    },
  ];
}

function safeguardingPolicyRules(): ContentRule[] {
  return [
    {
      checkpoint: "References current KCSIE edition (2025)",
      terms: [/keeping children safe in education\s*\(?kcsie\)?\s*2025|keeping children safe in education\s*2025|kcsie\s*2025/i],
      severity: "critical",
      recommendation:
        "Update the policy so it explicitly references Keeping Children Safe in Education 2025.",
    },
    {
      checkpoint: "References Working Together to Safeguard Children 2026",
      terms: [/working together to safeguard children\s*2026|working together\s*2026/i],
      severity: "important",
      recommendation:
        "Reference Working Together to Safeguard Children 2026 so the policy reflects the current multi-agency guidance.",
    },
    {
      checkpoint: "Names the DSL and deputy DSLs",
      terms: [
        /(designated safeguarding lead|\bdsl\b)/i,
        /(deputy\s+dsl|deputy\s+designated safeguarding lead|deputy dsls)/i,
      ],
      severity: "critical",
      recommendation:
        "Name the DSL and deputy DSLs with clear routes for staff and parents to contact them.",
    },
    {
      checkpoint: "Names safeguarding governance oversight",
      terms: [/(safeguarding governor|safeguarding trustee|governor.*safeguarding|trustee.*safeguarding)/i],
      severity: "important",
      recommendation:
        "Name the governor or trustee responsible for safeguarding oversight.",
    },
    {
      checkpoint: "Explains staff reporting and referral routes",
      terms: [
        /(report concerns|reporting concerns|staff.*concerns|concerns.*dsl)/i,
        /(children'?s social care|mash|local authority designated officer|lado|lscp)/i,
      ],
      severity: "critical",
      recommendation:
        "Set out the staff reporting route and external referral pathway, including children's social care or local safeguarding contacts.",
    },
    {
      checkpoint: "Covers allegations against staff and LADO route",
      terms: [/(allegations? against staff|allegations? against.*volunteers?|lado)/i],
      severity: "critical",
      recommendation:
        "Include the process for allegations against staff and volunteers, including LADO referral.",
    },
    {
      checkpoint: "Covers record keeping, confidentiality and information sharing",
      terms: ["record keeping", "confidentiality", "information sharing"],
      severity: "critical",
      recommendation:
        "Ensure the policy explains safeguarding records, confidentiality and information-sharing expectations.",
    },
    {
      checkpoint: "Covers online safety, filtering and monitoring",
      terms: ["online safety", "filtering", "monitoring"],
      severity: "critical",
      recommendation:
        "Strengthen online safety by naming filtering and monitoring arrangements and responsibilities.",
    },
    {
      checkpoint: "Covers child-on-child abuse and sexual violence/harassment",
      terms: [
        /(child[- ]on[- ]child|peer[- ]on[- ]peer)/i,
        "sexual violence",
        "sexual harassment",
      ],
      severity: "critical",
      recommendation:
        "Cover child-on-child abuse, sexual violence and sexual harassment in line with current KCSIE terminology.",
    },
    {
      checkpoint: "Covers key safeguarding risks",
      terms: ["prevent", "fgm", "county lines"],
      severity: "important",
      recommendation:
        "Check that specific safeguarding issues such as Prevent, FGM and county lines are covered.",
    },
    {
      checkpoint: "Covers vulnerable groups and early help",
      terms: ["children missing from education", "send", "early help"],
      severity: "important",
      recommendation:
        "Explain early help, children missing from education and additional vulnerability for children with SEND.",
    },
    {
      checkpoint: "Covers staff induction and safeguarding training",
      terms: ["induction", "training"],
      severity: "important",
      recommendation:
        "State the induction and regular safeguarding training expectations for staff.",
    },
    {
      checkpoint: "References safer recruitment",
      terms: ["safer recruitment"],
      severity: "important",
      recommendation:
        "Cross-reference safer recruitment arrangements and evidence expectations.",
    },
  ];
}

function termMatches(text: string, term: string | RegExp): boolean {
  if (typeof term === "string") return text.includes(term.toLowerCase());
  return term.test(text);
}

function findEvidenceQuote(text: string, terms: Array<string | RegExp>): string | null {
  for (const term of terms) {
    const index =
      typeof term === "string"
        ? text.toLowerCase().indexOf(term.toLowerCase())
        : text.search(term);
    if (index === -1) continue;

    const start = Math.max(0, index - 70);
    const end = Math.min(text.length, index + 170);
    return text
      .slice(start, end)
      .replace(/\s+/g, " ")
      .trim();
  }

  return null;
}

function assessPolicyCurrency(
  text: string,
  datesFound: string[],
): { status: string; note: string; policy_review: PolicyReviewSchedule | null } {
  const reviewDate = findReviewDate(text) ?? findLatestMonthYear(datesFound);
  if (!reviewDate) {
    return {
      status: "unknown",
      note: "No explicit review date was extracted from the document.",
      policy_review: null,
    };
  }

  const reviewMonthEnd = new Date(
    reviewDate.year,
    reviewDate.monthIndex + 1,
    0,
  );
  const now = new Date();
  const policyReview = buildPolicyReviewScheduleFromDateInfo(reviewDate);
  const label = policyReview?.date_found ?? `${reviewDate.monthName} ${reviewDate.year}`;

  if (reviewMonthEnd < now) {
    return {
      status: "outdated",
      note: `Review date appears to be ${label}, which has passed.`,
      policy_review: policyReview,
    };
  }

  return {
    status: "current",
    note: `Review date appears to be ${label}.`,
    policy_review: policyReview,
  };
}

function findReviewDate(text: string) {
  const reviewPatterns = [
    /date\s*to\s*be\s*reviewed\s*:\s*(\d{1,2})\s*([A-Z][a-z]+)\s*(\d{4})/i,
    /review\s*date\s*:\s*(\d{1,2})\s*([A-Z][a-z]+)\s*(\d{4})/i,
    /reviewed\s*by\s*:\s*(\d{1,2})\s*([A-Z][a-z]+)\s*(\d{4})/i,
    /date\s*to\s*be\s*reviewed\s*:\s*([A-Z][a-z]+)\s*(\d{4})/i,
    /review\s*date\s*:\s*([A-Z][a-z]+)\s*(\d{4})/i,
    /next\s*review\s*:\s*([A-Z][a-z]+)\s*(\d{4})/i,
    /review\s*due\s*:\s*([A-Z][a-z]+)\s*(\d{4})/i,
    /reviewed\s*by\s*:\s*([A-Z][a-z]+)\s*(\d{4})/i,
  ];

  for (const pattern of reviewPatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const parsed =
      match.length === 4
        ? parseMonthYear(match[2], match[3], match[1])
        : parseMonthYear(match[1], match[2]);
    if (parsed) return parsed;
  }

  return null;
}

function findLatestMonthYear(values: string[]) {
  return values
    .map((value) => {
      const match = normaliseOcrSeparatedText(value).match(
        /^([A-Z][a-z]+)\s*(\d{4})$/,
      );
      return match ? parseMonthYear(match[1], match[2]) : null;
    })
    .filter((value): value is NonNullable<ReturnType<typeof parseMonthYear>> =>
      Boolean(value),
    )
    .sort((a, b) => b.year - a.year || b.monthIndex - a.monthIndex)[0] ?? null;
}

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function parseMonthYear(monthName: string, yearValue: string, dayValue?: string) {
  const monthIndex = MONTH_NAMES.indexOf(monthName.toLowerCase());
  const year = Number.parseInt(yearValue, 10);
  const day = dayValue ? Number.parseInt(dayValue, 10) : 1;

  if (
    monthIndex === -1 ||
    Number.isNaN(year) ||
    Number.isNaN(day) ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return {
    day,
    monthIndex,
    monthName: `${monthName[0].toUpperCase()}${monthName.slice(1).toLowerCase()}`,
    year,
  };
}

function buildPolicyReviewSchedule(
  dateFound: string | null | undefined,
): PolicyReviewSchedule | null {
  if (!dateFound) return null;

  const fullDate = dateFound.match(/^(\d{1,2})\s+([A-Z][a-z]+)\s+(\d{4})$/);
  const monthYear = dateFound.match(/^([A-Z][a-z]+)\s+(\d{4})$/);
  const parsed = fullDate
    ? parseMonthYear(fullDate[2], fullDate[3], fullDate[1])
    : monthYear
      ? parseMonthYear(monthYear[1], monthYear[2])
      : null;

  return parsed ? buildPolicyReviewScheduleFromDateInfo(parsed) : null;
}

function buildPolicyReviewScheduleFromDateInfo(
  reviewDate: NonNullable<ReturnType<typeof parseMonthYear>>,
): PolicyReviewSchedule | null {
  const reminderLeadMonths = 3;
  const reviewDueAt = toDateOnly(
    reviewDate.year,
    reviewDate.monthIndex,
    reviewDate.day,
  );
  const reminderDueAt = subtractMonths(reviewDueAt, reminderLeadMonths);
  const dateFound =
    reviewDate.day === 1
      ? `${reviewDate.monthName} ${reviewDate.year}`
      : `${reviewDate.day} ${reviewDate.monthName} ${reviewDate.year}`;
  const reminderLabel = formatDateOnly(reminderDueAt);

  return {
    date_found: dateFound,
    review_due_at: reviewDueAt,
    reminder_due_at: reminderDueAt,
    reminder_lead_months: reminderLeadMonths,
    review_note: `Review date appears to be ${dateFound}.`,
    reminder_note: `Next review reminder should be scheduled for ${reminderLabel}.`,
  };
}

function toDateOnly(year: number, monthIndex: number, day: number): string {
  return [
    year.toString().padStart(4, "0"),
    (monthIndex + 1).toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");
}

function subtractMonths(dateOnly: string, months: number): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCMonth(date.getUTCMonth() - months);
  return toDateOnly(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}

function formatDateOnly(dateOnly: string): string {
  return new Date(`${dateOnly}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildDriveFound(
  expected: ExpectedOfstedDocument,
  file: DriveEvidenceFile,
): ResolvedDocumentFound {
  const needsPublication = expected.websiteExpected === true;
  return {
    name: file.name,
    path: file.folderPath ? `${file.folderPath} > ${file.name}` : file.name,
    area: AREA_LABELS[expected.area],
    matched_to: expected.name,
    source: "drive",
    source_label: "Connected Drive",
    evidence_url: file.webViewLink ?? null,
    found_on_url: null,
    readiness_status: needsPublication ? "needs_publication" : "ready",
    website_status: null,
    compliance_score: null,
    quality_score: null,
    currency_status: null,
    evidence_quotes: [],
    gaps: [],
    recommendations: [],
    red_flags: [],
    notes: needsPublication
      ? [
          `${expected.name} exists in connected storage, but the website scan has not found a published public link yet.`,
        ]
      : [`${expected.name} exists in connected storage.`],
    action_required: needsPublication,
    policy_review: null,
  };
}

function buildMissing(expected: ExpectedOfstedDocument): ResolvedDocumentMissing {
  return {
    expected_name: expected.name,
    area: AREA_LABELS[expected.area],
    priority: expected.priority,
    reason: expected.websiteExpected
      ? "Not found on the website scan or connected evidence folder."
      : "Not found in the connected evidence folder.",
    website_expected: expected.websiteExpected === true,
    suggested_action: expected.websiteExpected
      ? `Add or share the public website link for ${expected.name}, or upload the document to the connected evidence folder.`
      : `Upload or link ${expected.name} in the connected evidence folder.`,
  };
}
