/**
 * Vision AI -- Multi-Module Dispatcher
 *
 * Routes vision findings to the appropriate Schoolgle modules.
 * A single room scan can update estates, helpdesk, assets, COSHH,
 * safeguarding, T&L, and H&S simultaneously.
 */

import type {
  VisionResult,
  VisionItem,
  ComplianceIssue,
  ModuleDispatch,
  DispatchModule,
  Severity,
} from "./types";

// ---------------------------------------------------------------------------
// Dispatch rules -- which item categories route to which modules
// ---------------------------------------------------------------------------

interface DispatchRule {
  module: DispatchModule;
  /** Item categories or issue domains that trigger this module */
  triggers: string[];
  /** Minimum severity to create a helpdesk ticket / action */
  minSeverityForAction: Severity;
}

const DISPATCH_RULES: DispatchRule[] = [
  {
    module: "estates",
    triggers: [
      "fire_safety",
      "fire_exit",
      "fire_door",
      "fire_extinguisher",
      "emergency_lighting",
      "building_condition",
    ],
    minSeverityForAction: "medium",
  },
  {
    module: "helpdesk",
    triggers: ["damage", "broken", "leak", "repair_needed", "maintenance"],
    minSeverityForAction: "medium",
  },
  {
    module: "asset_register",
    triggers: [
      "asset_present",
      "asset_missing",
      "asset_condition",
      "equipment",
    ],
    minSeverityForAction: "high",
  },
  {
    module: "coshh",
    triggers: ["chemical", "hazardous", "coshh", "ghs", "storage_compliance"],
    minSeverityForAction: "low",
  },
  {
    module: "teaching_learning",
    triggers: ["classroom_layout", "display_board", "learning_environment"],
    minSeverityForAction: "medium",
  },
  {
    module: "safeguarding",
    triggers: ["safeguarding", "sight_line", "hidden_area", "access_control"],
    minSeverityForAction: "high",
  },
  {
    module: "h_and_s",
    triggers: [
      "trip_hazard",
      "trailing_cable",
      "wet_floor",
      "ppe",
      "manual_handling",
      "electrical",
    ],
    minSeverityForAction: "low",
  },
];

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatch vision findings to relevant modules.
 * Returns the list of dispatches (what was sent where).
 *
 * NOTE: This is the routing logic only. Actual database writes
 * (creating helpdesk tickets, updating asset register, etc.) are
 * handled by the individual module services called from the API layer.
 */
export function dispatchFindings(result: VisionResult): ModuleDispatch[] {
  const dispatches: ModuleDispatch[] = [];
  const moduleFindings = new Map<
    DispatchModule,
    { items: VisionItem[]; issues: ComplianceIssue[] }
  >();

  // Initialise empty findings for each module
  for (const rule of DISPATCH_RULES) {
    moduleFindings.set(rule.module, { items: [], issues: [] });
  }

  // Route items to modules based on category matching
  for (const item of result.items) {
    const itemCategory = item.category.toLowerCase();
    for (const rule of DISPATCH_RULES) {
      if (
        rule.triggers.some(
          (t) => itemCategory.includes(t) || t.includes(itemCategory),
        )
      ) {
        moduleFindings.get(rule.module)!.items.push(item);
      }
    }
  }

  // Route compliance issues to modules based on domain matching
  for (const issue of result.compliance.issues) {
    const issueDomain = issue.domain.toLowerCase();
    for (const rule of DISPATCH_RULES) {
      if (
        rule.triggers.some(
          (t) => issueDomain.includes(t) || t.includes(issueDomain),
        )
      ) {
        moduleFindings.get(rule.module)!.issues.push(issue);
      }
    }
  }

  // Build dispatch records
  for (const rule of DISPATCH_RULES) {
    const findings = moduleFindings.get(rule.module)!;
    const hasItems = findings.items.length > 0;
    const hasIssues = findings.issues.length > 0;

    if (!hasItems && !hasIssues) continue;

    // Determine the highest severity issue for this module
    const maxSeverity = findings.issues.reduce<Severity>(
      (max, issue) =>
        SEVERITY_ORDER[issue.severity] > SEVERITY_ORDER[max]
          ? issue.severity
          : max,
      "low",
    );

    const meetsThreshold =
      SEVERITY_ORDER[maxSeverity] >= SEVERITY_ORDER[rule.minSeverityForAction];

    if (hasIssues && meetsThreshold) {
      dispatches.push({
        module: rule.module,
        action: rule.module === "helpdesk" ? "ticket_created" : "flag_raised",
        detail: findings.issues.map((i) => i.description).join("; "),
      });
    } else if (hasItems) {
      dispatches.push({
        module: rule.module,
        action: "updated",
        detail: `${findings.items.length} item(s) detected`,
      });
    }
  }

  // If nothing was dispatched but we have items, still log to estates
  if (dispatches.length === 0 && result.items.length > 0) {
    dispatches.push({
      module: "estates",
      action: "no_issues",
      detail: `Room scanned: ${result.items.length} items, no issues`,
    });
  }

  return dispatches;
}

/**
 * Generate a plain-English summary from dispatches (for Ed chatbot).
 */
export function summariseDispatches(
  dispatches: ModuleDispatch[],
  roomName?: string,
): string {
  if (dispatches.length === 0) {
    return roomName
      ? `${roomName} scanned -- no items detected.`
      : "Scan complete -- no items detected.";
  }

  const prefix = roomName ? `${roomName}: ` : "";
  const noIssues = dispatches.filter((d) => d.action === "no_issues");
  const issues = dispatches.filter(
    (d) => d.action !== "no_issues" && d.action !== "updated",
  );
  const updates = dispatches.filter((d) => d.action === "updated");

  const parts: string[] = [];

  if (noIssues.length > 0) {
    parts.push("all clear");
  }

  if (issues.length > 0) {
    const issueDescs = issues.map(
      (d) => `${d.module.replace("_", " ")}: ${d.detail}`,
    );
    parts.push(`${issues.length} issue(s) flagged -- ${issueDescs.join("; ")}`);
  }

  if (updates.length > 0) {
    const modules = updates.map((d) => d.module.replace("_", " ")).join(", ");
    parts.push(`${modules} updated`);
  }

  return prefix + parts.join(". ") + ".";
}
