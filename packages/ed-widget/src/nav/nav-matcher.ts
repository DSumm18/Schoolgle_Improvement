/**
 * Nav Matcher — matches user questions to platform navigation targets.
 * Uses keyword matching against a built-in app directory.
 */

export interface NavTarget {
  id: string;
  name: string;
  route: string;
  description: string;
  requiredRoles: string[];
  keywords: string[];
}

export interface NavMatch {
  target: NavTarget;
  score: number;
  reason: string;
}

/**
 * Built-in app directory — subset of APPS from registry.ts.
 * We inline this rather than importing from the platform package because
 * ed-widget is a standalone vanilla TS package with no platform dependency.
 */
const APP_DIRECTORY: NavTarget[] = [
  { id: "governance-home", name: "Governance Portal", route: "/dashboard/governance", description: "Governor directory, meetings and oversight", requiredRoles: ["admin", "headteacher", "slt", "governor"], keywords: ["governance", "governor", "board", "trustee", "director"] },
  { id: "ofsted-readiness", name: "Ofsted Readiness", route: "/dashboard/ofsted-readiness", description: "Track framework compliance", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["ofsted", "inspection", "readiness", "framework", "judgement"] },
  { id: "sef-builder", name: "SEF Builder", route: "/dashboard/sef", description: "Draft self-evaluation reports", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["sef", "self-evaluation", "self evaluation"] },
  { id: "sdp-builder", name: "SDP Builder", route: "/dashboard/sdp", description: "Manage development plans", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["sdp", "development plan", "school development"] },
  { id: "action-plan", name: "Action Plan", route: "/dashboard/action-plan", description: "Track strategic tasks", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["action plan", "actions hub", "strategic actions"] },
  { id: "siams-readiness", name: "SIAMS Readiness", route: "/dashboard/siams", description: "Church school inspection preparation", requiredRoles: ["admin", "headteacher", "slt", "teacher", "governor"], keywords: ["siams", "church school", "church inspection", "diocese"] },
  { id: "evidence-vault", name: "My Evidence", route: "/evidence", description: "Central evidence library", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["evidence", "evidence vault", "proof", "evidence library"] },
  { id: "estates-home", name: "Estates", route: "/dashboard/estates", description: "Premises, maintenance and contractor management", requiredRoles: ["admin", "headteacher", "slt", "caretaker"], keywords: ["estates", "premises", "maintenance", "contractor", "facility", "building maintenance"] },
  { id: "estates-energy", name: "Energy Dashboard", route: "/dashboard/estates/energy", description: "Energy usage and sustainability tracking", requiredRoles: ["admin", "headteacher", "slt", "caretaker"], keywords: ["energy", "electricity", "gas bill", "utility", "utilities", "carbon", "sustainability", "energy dashboard"] },
  { id: "estates-helpdesk", name: "Helpdesk", route: "/dashboard/estates/helpdesk", description: "Report and track maintenance issues", requiredRoles: ["admin", "headteacher", "slt", "teacher", "caretaker"], keywords: ["helpdesk", "report issue", "broken", "repair request", "maintenance request"] },
  { id: "compliance-home", name: "Compliance", route: "/dashboard/compliance", description: "Statutory policy management and training compliance", requiredRoles: ["admin", "headteacher", "slt", "governor"], keywords: ["compliance", "policy", "policies", "statutory", "gdpr", "training compliance"] },
  { id: "hr-people", name: "Staff Directory", route: "/dashboard/hr/people", description: "Manage school staff", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["staff directory", "staff list", "people", "employee", "human resources"] },
  { id: "safeguarding-home", name: "Safeguarding", route: "/dashboard/safeguarding", description: "Concern logging and DSL triage", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["safeguarding", "concern", "child protection", "welfare", "designated safeguarding"] },
  { id: "attendance-home", name: "Attendance", route: "/dashboard/attendance", description: "Registration and persistent absence tracking", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["attendance", "absence", "register", "persistent absence", "late arrivals"] },
  { id: "send-home", name: "SEND", route: "/modules/send", description: "SEN register and EHCP management", requiredRoles: ["admin", "headteacher", "slt", "teacher"], keywords: ["send", "sen register", "ehcp", "special needs", "inclusion", "senco", "special educational"] },
  { id: "intelligence-home", name: "School Intelligence", route: "/dashboard/intelligence", description: "Data analysis, cohort tracking, EEF research", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["intelligence", "cohort", "attainment", "progress data", "eef", "analysis", "attainment gap", "school data"] },
  { id: "risk-register", name: "Risk Register", route: "/dashboard/risk", description: "Enterprise risk management", requiredRoles: ["admin", "headteacher", "slt", "governor"], keywords: ["risk register", "risk management", "heatmap", "mitigation"] },
  { id: "meetings", name: "Meetings", route: "/dashboard/meetings", description: "Meeting companion with agendas and minutes", requiredRoles: ["admin", "headteacher", "slt", "teacher", "governor"], keywords: ["meeting", "meetings", "agenda", "minutes", "meeting companion"] },
  { id: "documents", name: "Documents", route: "/dashboard/documents", description: "Document production and templates", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["document", "documents", "template", "letter", "newsletter", "document production"] },
  { id: "surveys", name: "Surveys", route: "/dashboard/surveys", description: "Survey builder and analysis", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["survey", "surveys", "questionnaire", "feedback survey", "poll"] },
  { id: "website-home", name: "Website Builder", route: "/dashboard/website", description: "School website design and publishing", requiredRoles: ["admin", "headteacher", "slt"], keywords: ["website", "website builder", "school website", "publish website", "homepage"] },
  { id: "tasks", name: "Tasks", route: "/dashboard/tasks", description: "Unified task management", requiredRoles: ["admin", "headteacher", "slt", "teacher", "governor", "caretaker"], keywords: ["tasks", "todo", "to-do list", "task list"] },
];

/**
 * Match a user question to a navigation target.
 * Returns the best match above threshold, or null.
 */
export function matchNavigation(question: string): NavMatch | null {
  const lower = question.toLowerCase();
  let bestMatch: NavMatch | null = null;
  let bestScore = 0;

  for (const target of APP_DIRECTORY) {
    let score = 0;
    let matchedKeyword = "";

    for (const keyword of target.keywords) {
      if (lower.includes(keyword)) {
        // Longer keyword matches = higher confidence
        const keywordScore = keyword.length;
        if (keywordScore > score) {
          score = keywordScore;
          matchedKeyword = keyword;
        }
      }
    }

    // Also match against the app name
    if (lower.includes(target.name.toLowerCase())) {
      score = Math.max(score, target.name.length);
      matchedKeyword = target.name;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        target,
        score,
        reason: `Matched keyword "${matchedKeyword}"`,
      };
    }
  }

  // Threshold: at least 4 chars matched (avoids short false positives)
  return bestScore >= 4 ? bestMatch : null;
}

/**
 * Check if a user role has permission to access a nav target.
 */
export function hasPermission(target: NavTarget, userRole: string | undefined): boolean {
  if (!userRole) return false;
  return target.requiredRoles.includes(userRole.toLowerCase());
}
