/**
 * UX Assessment Framework for Schoolgle Platform
 *
 * Evaluates every module across 6 dimensions:
 * 1. Functionality — Does it work? Are all CRUD operations present?
 * 2. UI Quality — Layout, spacing, responsiveness, visual hierarchy
 * 3. User Journey — Can a user complete key tasks without confusion?
 * 4. Data Flow — API → UI → DB round-trip, demo data quality
 * 5. Accessibility — Keyboard nav, screen reader, contrast, ARIA
 * 6. School Context — Does it match how UK schools actually work?
 */

// ═══════════════════════════════════════════════════════════════════════
// Assessment Criteria
// ═══════════════════════════════════════════════════════════════════════

export interface AssessmentCriteria {
  id: string;
  category:
    | "functionality"
    | "ui"
    | "journey"
    | "data"
    | "accessibility"
    | "school_context";
  name: string;
  description: string;
  weight: number; // 1-5 importance
}

export const ASSESSMENT_CRITERIA: AssessmentCriteria[] = [
  // Functionality (Does it work?)
  {
    id: "f1",
    category: "functionality",
    name: "CRUD Complete",
    description:
      "All Create/Read/Update/Delete operations work for primary entities",
    weight: 5,
  },
  {
    id: "f2",
    category: "functionality",
    name: "Filtering & Search",
    description: "Users can filter/search to find specific records quickly",
    weight: 4,
  },
  {
    id: "f3",
    category: "functionality",
    name: "Form Validation",
    description: "Forms validate required fields, show clear error messages",
    weight: 4,
  },
  {
    id: "f4",
    category: "functionality",
    name: "State Management",
    description: "UI state stays consistent after actions (no stale data)",
    weight: 4,
  },
  {
    id: "f5",
    category: "functionality",
    name: "Error Handling",
    description: "API errors are caught and shown gracefully to users",
    weight: 3,
  },
  {
    id: "f6",
    category: "functionality",
    name: "Demo Data Quality",
    description:
      "Demo data is realistic, uses UK school context, sufficient variety",
    weight: 3,
  },
  {
    id: "f7",
    category: "functionality",
    name: "Export/Print",
    description: "Key data can be exported or printed where expected",
    weight: 2,
  },
  {
    id: "f8",
    category: "functionality",
    name: "Bulk Operations",
    description:
      "Batch actions available where repetitive single operations would be painful",
    weight: 2,
  },

  // UI Quality (Does it look right?)
  {
    id: "u1",
    category: "ui",
    name: "Visual Hierarchy",
    description: "Important information stands out, clear heading structure",
    weight: 5,
  },
  {
    id: "u2",
    category: "ui",
    name: "Consistent Styling",
    description:
      "Matches Schoolgle design system (Tailwind, module colors, card patterns)",
    weight: 4,
  },
  {
    id: "u3",
    category: "ui",
    name: "Responsive Layout",
    description:
      "Works on mobile (375px), tablet (768px), and desktop (1440px)",
    weight: 4,
  },
  {
    id: "u4",
    category: "ui",
    name: "Spacing & Alignment",
    description: "Consistent padding, margins, grid alignment",
    weight: 3,
  },
  {
    id: "u5",
    category: "ui",
    name: "Loading States",
    description: "Shows loading indicators while data fetches",
    weight: 3,
  },
  {
    id: "u6",
    category: "ui",
    name: "Empty States",
    description: "Helpful message when no data exists (not just blank)",
    weight: 3,
  },
  {
    id: "u7",
    category: "ui",
    name: "Color Usage",
    description:
      "RAG colors used correctly, status badges clear, not too colorful",
    weight: 3,
  },
  {
    id: "u8",
    category: "ui",
    name: "Icon Usage",
    description:
      "Icons support meaning (not decorative overload), consistent Lucide set",
    weight: 2,
  },

  // User Journey (Can they complete tasks?)
  {
    id: "j1",
    category: "journey",
    name: "Primary Task < 3 Clicks",
    description: "The #1 task for this module can be done in 3 clicks or fewer",
    weight: 5,
  },
  {
    id: "j2",
    category: "journey",
    name: "Clear Entry Point",
    description: "User immediately knows what to do when landing on the page",
    weight: 5,
  },
  {
    id: "j3",
    category: "journey",
    name: "Feedback on Actions",
    description: "Success/error messages after save, delete, status change",
    weight: 4,
  },
  {
    id: "j4",
    category: "journey",
    name: "Back Navigation",
    description: "User can easily return from detail views to list views",
    weight: 3,
  },
  {
    id: "j5",
    category: "journey",
    name: "Progressive Disclosure",
    description:
      "Complex forms broken into steps, advanced options hidden by default",
    weight: 3,
  },
  {
    id: "j6",
    category: "journey",
    name: "Contextual Help",
    description:
      "Tooltips, info buttons, or guidance text for domain-specific concepts",
    weight: 2,
  },
  {
    id: "j7",
    category: "journey",
    name: "Keyboard Shortcuts",
    description: "Tab order logical, Enter to submit, Escape to close modals",
    weight: 2,
  },

  // Data Flow (Does data move correctly?)
  {
    id: "d1",
    category: "data",
    name: "API Auth",
    description:
      "All routes use protectedRoute/service role, org isolation enforced",
    weight: 5,
  },
  {
    id: "d2",
    category: "data",
    name: "Input Sanitization",
    description: "User input is sanitized before DB insert (no raw SQL/XSS)",
    weight: 5,
  },
  {
    id: "d3",
    category: "data",
    name: "Pagination",
    description: "Large datasets paginated (not loading 10K records at once)",
    weight: 4,
  },
  {
    id: "d4",
    category: "data",
    name: "Optimistic Updates",
    description: "UI updates immediately on action, rolls back on error",
    weight: 2,
  },
  {
    id: "d5",
    category: "data",
    name: "SWR Caching",
    description:
      "Uses SWR for data fetching with appropriate refresh intervals",
    weight: 3,
  },
  {
    id: "d6",
    category: "data",
    name: "Cross-Module Links",
    description:
      "Links to related modules work (e.g., safeguarding → SCR, attendance → intelligence)",
    weight: 3,
  },

  // Accessibility
  {
    id: "a1",
    category: "accessibility",
    name: "Semantic HTML",
    description: "Uses proper headings (h1-h6), nav, main, article, aside",
    weight: 4,
  },
  {
    id: "a2",
    category: "accessibility",
    name: "Color Contrast",
    description: "Text meets WCAG AA (4.5:1 for normal, 3:1 for large)",
    weight: 4,
  },
  {
    id: "a3",
    category: "accessibility",
    name: "Focus Indicators",
    description: "Visible focus rings on interactive elements",
    weight: 3,
  },
  {
    id: "a4",
    category: "accessibility",
    name: "Alt Text",
    description: "Images and icons have alt text or aria-label",
    weight: 3,
  },
  {
    id: "a5",
    category: "accessibility",
    name: "Table Accessibility",
    description: "Data tables have headers, scope, and caption where needed",
    weight: 3,
  },

  // School Context (Does it match reality?)
  {
    id: "s1",
    category: "school_context",
    name: "UK Terminology",
    description:
      'Uses correct UK education terms (not US: "grade" vs "year group")',
    weight: 5,
  },
  {
    id: "s2",
    category: "school_context",
    name: "Statutory Compliance",
    description: "Covers statutory requirements (DfE, Ofsted, KCSIE, etc.)",
    weight: 5,
  },
  {
    id: "s3",
    category: "school_context",
    name: "Workflow Match",
    description: "Matches how schools actually do this task day-to-day",
    weight: 4,
  },
  {
    id: "s4",
    category: "school_context",
    name: "Role Appropriateness",
    description:
      "Features accessible to the right roles (DSL for safeguarding, SENCO for SEND)",
    weight: 4,
  },
  {
    id: "s5",
    category: "school_context",
    name: "Ofsted Ready",
    description: "Data can be quickly surfaced for an inspection",
    weight: 3,
  },
  {
    id: "s6",
    category: "school_context",
    name: "Academic Year Aware",
    description: "Uses terms/half-terms, not calendar months",
    weight: 3,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Module Definitions
// ═══════════════════════════════════════════════════════════════════════

export interface ModuleAssessment {
  moduleId: string;
  moduleName: string;
  route: string;
  apiRoutes: string[];
  primaryTask: string;
  keyEntities: string[];
  criticalJourneys: string[];
  statutoryRequirements: string[];
}

export const MODULES_TO_ASSESS: ModuleAssessment[] = [
  {
    moduleId: "safeguarding",
    moduleName: "Safeguarding / Concern Logging",
    route: "/dashboard/safeguarding",
    apiRoutes: [
      "/api/safeguarding/concerns",
      "/api/safeguarding/chronology",
      "/api/safeguarding/referrals",
      "/api/safeguarding/dashboard",
    ],
    primaryTask: "Log a new safeguarding concern about a pupil",
    keyEntities: ["concern", "chronology_entry", "referral"],
    criticalJourneys: [
      "Staff member reports concern → DSL triages → creates chronology → refers to CSCS",
      "DSL reviews red concerns → triages → assigns outcome → adds to chronology",
      "Export pupil chronology for multi-agency meeting",
      "Anonymous concern submission",
      "Body map annotation for physical abuse concern",
    ],
    statutoryRequirements: [
      "KCSIE 2025",
      "Working Together 2023",
      "Ofsted safeguarding judgement",
    ],
  },
  {
    moduleId: "attendance",
    moduleName: "Attendance",
    route: "/dashboard/attendance",
    apiRoutes: [
      "/api/attendance/registers",
      "/api/attendance/summaries",
      "/api/attendance/interventions",
      "/api/attendance/dashboard",
    ],
    primaryTask: "Take the morning register for a class",
    keyEntities: ["register_mark", "summary", "intervention"],
    criticalJourneys: [
      "Teacher opens register → marks 30 pupils (/ or \\) → saves → moves to next session",
      "Attendance officer checks PA dashboard → identifies pupils below 90% → triggers intervention",
      "Head reviews whole-school attendance trend → drills into year group → identifies patterns",
      "EWO referral triggered at 85% → tracked through intervention system",
    ],
    statutoryRequirements: [
      "Education Act 1996",
      "DfE attendance codes",
      "Persistent absence threshold (90%)",
    ],
  },
  {
    moduleId: "send",
    moduleName: "SEND Management",
    route: "/dashboard/send",
    apiRoutes: [
      "/api/send/register",
      "/api/send/graduated-approach",
      "/api/send/provision-map",
      "/api/send/referrals",
      "/api/send/dashboard",
    ],
    primaryTask: "Add a pupil to the SEN register",
    keyEntities: [
      "register_entry",
      "graduated_approach_cycle",
      "provision",
      "referral",
    ],
    criticalJourneys: [
      "SENCO adds pupil (SEN K, SPLD) → creates first graduated approach cycle → sets targets",
      "Review graduated approach → record outcome → decide next steps (continue/escalate/remove)",
      "Map provisions across school → calculate total cost → identify funding gaps",
      "Track EP referral through pipeline → record assessment → action recommendations",
      "Annual EHCP review → update provision → notify LA",
    ],
    statutoryRequirements: [
      "SEND Code of Practice 2015",
      "Children & Families Act 2014",
      "Equality Act 2010",
    ],
  },
  {
    moduleId: "behaviour",
    moduleName: "Behaviour & Sanctions",
    route: "/dashboard/behaviour",
    apiRoutes: [
      "/api/behaviour/incidents",
      "/api/behaviour/exclusions",
      "/api/behaviour/dashboard",
      "/api/behaviour/patterns",
    ],
    primaryTask: "Log a behaviour incident (positive or negative)",
    keyEntities: ["incident", "exclusion"],
    criticalJourneys: [
      "Teacher logs disruption → selects consequence → notifies parent",
      "Record positive behaviour → award house points",
      "SLT reviews patterns → identifies hotspot times/locations → adjusts staffing",
      "Head excludes pupil (FTE) → records DfE return fields → notifies parent/governors",
      "Managed move discussed → tracked → outcome recorded",
    ],
    statutoryRequirements: [
      "Suspension and Permanent Exclusion guidance 2023",
      "DfE exclusion return",
      "Equality Act 2010",
    ],
  },
  {
    moduleId: "calendar",
    moduleName: "Academic Calendar",
    route: "/dashboard/calendar",
    apiRoutes: [
      "/api/calendar/terms",
      "/api/calendar/events",
      "/api/calendar/parents-evening",
    ],
    primaryTask: "View this month's school events",
    keyEntities: ["term", "event", "parents_evening_slot"],
    criticalJourneys: [
      "Admin sets term dates for academic year → calculates 190 school days",
      "Teacher creates parents evening → generates slots → parents book",
      "View month calendar → click day → see events → click event for details",
      "Add school trip → link risk assessment → assign year groups",
    ],
    statutoryRequirements: [
      "190 school days statutory",
      "Parents evening communication",
    ],
  },
  {
    moduleId: "performance",
    moduleName: "Performance Management",
    route: "/dashboard/hr/performance",
    apiRoutes: [
      "/api/performance/cycles",
      "/api/performance/appraisals",
      "/api/performance/dashboard",
    ],
    primaryTask: "Set objectives for a staff member",
    keyEntities: ["cycle", "appraisal"],
    criticalJourneys: [
      "Head creates appraisal cycle → assigns appraisers → staff set objectives",
      "Appraiser conducts mid-year review → records progress → notes evidence",
      "End-of-year review → rating → pay recommendation → governor approval",
      "ECT mentor tracks progress against Teachers Standards over 6 terms",
    ],
    statutoryRequirements: [
      "Education (School Teachers Appraisal) Regulations 2012",
      "ECT statutory induction",
    ],
  },
  {
    moduleId: "cover",
    moduleName: "Cover Management",
    route: "/dashboard/hr/cover",
    apiRoutes: [
      "/api/cover/absences",
      "/api/cover/arrangements",
      "/api/cover/dashboard",
    ],
    primaryTask: "Record staff absence and arrange cover",
    keyEntities: ["absence", "cover_arrangement"],
    criticalJourneys: [
      "Staff calls in sick → office records absence → system suggests internal cover → confirms",
      "Cover manager views today board → assigns supply for uncovered periods",
      "HR reviews Bradford Factor scores → triggers return-to-work meeting",
      "Finance tracks YTD supply costs → feeds into ICFP E02",
    ],
    statutoryRequirements: [
      "Bradford Factor thresholds",
      "Return to work procedures",
      "ICFP reporting",
    ],
  },
  {
    moduleId: "pupil-premium",
    moduleName: "Pupil Premium Strategy",
    route: "/dashboard/pupil-premium",
    apiRoutes: [
      "/api/pupil-premium/strategies",
      "/api/pupil-premium/interventions",
      "/api/pupil-premium/dashboard",
    ],
    primaryTask: "Create PP strategy and add interventions",
    keyEntities: ["strategy", "intervention"],
    criticalJourneys: [
      "PP lead creates 3-year strategy → sets intended outcomes → adds interventions",
      "Track spend against budget by EEF strand → identify overspend areas",
      "Measure PP vs non-PP gap → link to specific interventions → assess impact",
      "Generate DfE statement for website publication",
    ],
    statutoryRequirements: [
      "DfE PP strategy statement template",
      "EEF 3-tier approach",
      "Website publication requirement",
    ],
  },
  {
    moduleId: "admissions",
    moduleName: "Admissions Tracker",
    route: "/dashboard/admissions",
    apiRoutes: [
      "/api/admissions/rounds",
      "/api/admissions/applications",
      "/api/admissions/dashboard",
    ],
    primaryTask: "View applications and make offers",
    keyEntities: ["round", "application"],
    criticalJourneys: [
      "Admin creates admission round → enters PAN → records applications",
      "Apply oversubscription criteria → rank → make offers to PAN",
      "Manage waiting list → offer places as declined",
      "Record and track appeals → outcome → admit if upheld",
    ],
    statutoryRequirements: [
      "School Admissions Code 2021",
      "Oversubscription criteria",
      "Appeals process",
    ],
  },
  {
    moduleId: "sports-premium",
    moduleName: "Sports Premium",
    route: "/dashboard/sports-premium",
    apiRoutes: [
      "/api/sports-premium/strategies",
      "/api/sports-premium/spend",
      "/api/sports-premium/dashboard",
    ],
    primaryTask: "Record PE premium spend against indicators",
    keyEntities: ["strategy", "spend_item"],
    criticalJourneys: [
      "PE lead creates strategy → enters funding → allocates to 5 indicators",
      "Record individual spend items → track actual vs budget",
      "Enter Y6 swimming data for statutory reporting",
      "Generate DfE report for website",
    ],
    statutoryRequirements: [
      "DfE PE & Sport Premium conditions",
      "5 key indicators",
      "Swimming data (statutory)",
    ],
  },
  {
    moduleId: "emergency",
    moduleName: "Emergency Planning",
    route: "/dashboard/emergency",
    apiRoutes: [
      "/api/emergency/plans",
      "/api/emergency/drills",
      "/api/emergency/dashboard",
    ],
    primaryTask: "Log a fire drill and record evacuation time",
    keyEntities: ["plan", "drill"],
    criticalJourneys: [
      "Site manager creates emergency plan → adds procedures → gets approval",
      "Fire marshal logs drill → records time → notes issues → schedules next",
      "Head reviews drill compliance → ensures termly fire drills met",
      "Print plan for corridor display",
    ],
    statutoryRequirements: [
      "Regulatory Reform (Fire Safety) Order 2005",
      "Termly fire drills",
      "KCSIE lockdown",
    ],
  },
  {
    moduleId: "school-meals",
    moduleName: "School Meals / FSM",
    route: "/dashboard/school-meals",
    apiRoutes: [
      "/api/school-meals/config",
      "/api/school-meals/registrations",
      "/api/school-meals/orders",
      "/api/school-meals/dashboard",
    ],
    primaryTask: "Check FSM eligibility and meal uptake",
    keyEntities: ["config", "registration", "daily_order"],
    criticalJourneys: [
      "Admin registers pupil meal type → records FSM eligibility → flags Ever 6",
      "Kitchen staff records daily orders → tracks waste → adjusts ordering",
      "Business manager reviews FSM income → reconciles with funding",
      "Print kitchen sheet with dietary requirements and allergies",
    ],
    statutoryRequirements: [
      "UIFSM (KS1)",
      "FSM eligibility checking",
      "Allergy management (Natasha's Law)",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Assessment Result Types
// ═══════════════════════════════════════════════════════════════════════

export interface CriterionResult {
  criterionId: string;
  score: 1 | 2 | 3 | 4 | 5; // 1=missing, 2=poor, 3=adequate, 4=good, 5=excellent
  notes: string;
  issues: string[];
  suggestions: string[];
}

export interface JourneyResult {
  journey: string;
  completable: boolean;
  clicks: number;
  friction_points: string[];
  suggestions: string[];
}

export interface ModuleResult {
  moduleId: string;
  moduleName: string;
  overallScore: number; // 0-100
  categoryScores: Record<string, number>;
  criterionResults: CriterionResult[];
  journeyResults: JourneyResult[];
  criticalIssues: string[];
  quickWins: string[];
  enhancementPlan: string[];
}

export function calculateOverallScore(results: CriterionResult[]): number {
  const totalWeight = ASSESSMENT_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = results.reduce((sum, r) => {
    const criterion = ASSESSMENT_CRITERIA.find((c) => c.id === r.criterionId);
    if (!criterion) return sum;
    return sum + (r.score / 5) * criterion.weight;
  }, 0);
  return Math.round((weightedScore / totalWeight) * 100);
}

export function getCategoryScore(
  results: CriterionResult[],
  category: string,
): number {
  const categoryCriteria = ASSESSMENT_CRITERIA.filter(
    (c) => c.category === category,
  );
  const categoryResults = results.filter((r) =>
    categoryCriteria.some((c) => c.id === r.criterionId),
  );
  if (categoryResults.length === 0) return 0;
  const totalWeight = categoryCriteria.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = categoryResults.reduce((sum, r) => {
    const criterion = categoryCriteria.find((c) => c.id === r.criterionId);
    if (!criterion) return sum;
    return sum + (r.score / 5) * criterion.weight;
  }, 0);
  return Math.round((weightedScore / totalWeight) * 100);
}
