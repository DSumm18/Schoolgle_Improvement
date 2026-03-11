/**
 * Approval Engine
 *
 * Implements delegation limits and approval routing based on the
 * Academy Trust Handbook (ATH) 2025 thresholds. Provides functions
 * to determine who needs to approve a request, validate authority,
 * check SLA breaches, and compute escalation targets.
 */

// ─── Types ────────────────────────────────────────────────────────────

export type ApprovalType =
  | "spend"
  | "contract"
  | "policy"
  | "risk_decision"
  | "recruitment"
  | "disposal";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "escalated"
  | "expired";

export type ApprovalTier =
  | "headteacher"
  | "slt"
  | "cfo"
  | "ceo"
  | "board"
  | "members";

export interface ApprovalRule {
  type: ApprovalType;
  minAmount?: number; // threshold in GBP (inclusive)
  maxAmount?: number; // upper bound (inclusive)
  requiredTier: ApprovalTier;
  requiresMinute?: boolean; // must be minuted at board
  slaHours: number; // auto-escalate after this many hours
}

export interface ApprovalRequest {
  id: string;
  organizationId: string;
  type: ApprovalType;
  title: string;
  description: string;
  amount?: number;
  requestedBy: string;
  requestedByName: string;
  requiredTier: ApprovalTier;
  currentStatus: ApprovalStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  escalatedTo?: ApprovalTier;
  escalatedAt?: string;
  expiresAt?: string;
  linkedRiskId?: string;
  linkedTaskId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Tier Hierarchy ───────────────────────────────────────────────────

/**
 * Ordered from lowest authority to highest.
 * Used for escalation and authority checks.
 */
const TIER_HIERARCHY: ApprovalTier[] = [
  "headteacher",
  "slt",
  "cfo",
  "ceo",
  "board",
  "members",
];

/**
 * Maps app roles (from AuthContext) to the highest approval tier they can authorise.
 * Roles not listed here have no approval authority.
 */
const ROLE_TO_MAX_TIER: Record<string, ApprovalTier> = {
  admin: "board", // platform admin acts at board level
  headteacher: "headteacher",
  slt: "slt",
  governor: "board",
  // Teachers, caretakers, and viewers cannot approve
};

// ─── Default ATH 2025 Rules ──────────────────────────────────────────

/**
 * Returns the default approval rules aligned with the Academy Trust
 * Handbook 2025. Organisations can override these via the rules API.
 */
export function getApprovalRules(): ApprovalRule[] {
  return [
    // ── Spend thresholds ──────────────────────────────────────────
    {
      type: "spend",
      minAmount: 0,
      maxAmount: 5_000,
      requiredTier: "headteacher",
      slaHours: 24,
    },
    {
      type: "spend",
      minAmount: 5_001,
      maxAmount: 25_000,
      requiredTier: "slt",
      slaHours: 48,
    },
    {
      type: "spend",
      minAmount: 25_001,
      maxAmount: 100_000,
      requiredTier: "cfo",
      slaHours: 72,
    },
    {
      type: "spend",
      minAmount: 100_001,
      requiredTier: "board",
      requiresMinute: true,
      slaHours: 120, // 5 days — board may only meet periodically
    },

    // ── Contract thresholds ───────────────────────────────────────
    {
      type: "contract",
      minAmount: 0,
      maxAmount: 50_000,
      requiredTier: "slt",
      slaHours: 48,
    },
    {
      type: "contract",
      minAmount: 50_001,
      requiredTier: "board",
      requiresMinute: true,
      slaHours: 120,
    },

    // ── Policy changes ────────────────────────────────────────────
    {
      type: "policy",
      requiredTier: "slt",
      slaHours: 72,
    },

    // ── Risk decisions (4T framework) ─────────────────────────────
    {
      type: "risk_decision",
      requiredTier: "board",
      requiresMinute: true,
      slaHours: 120,
    },

    // ── Recruitment ───────────────────────────────────────────────
    {
      type: "recruitment",
      requiredTier: "headteacher",
      slaHours: 48,
    },

    // ── Asset disposal ────────────────────────────────────────────
    {
      type: "disposal",
      minAmount: 1_000,
      requiredTier: "cfo",
      slaHours: 72,
    },
    {
      type: "disposal",
      minAmount: 0,
      maxAmount: 999,
      requiredTier: "headteacher",
      slaHours: 24,
    },
  ];
}

// ─── Core Functions ──────────────────────────────────────────────────

/**
 * Determines which approval tier is needed for a given request type
 * and optional amount. Uses metadata for special cases:
 *   - recruitment: metadata.isLeadership → board
 *   - risk_decision: metadata.isStrategic → board (default anyway)
 */
export function determineApprovalTier(
  type: ApprovalType,
  amount?: number,
  metadata?: Record<string, unknown>,
): ApprovalTier {
  // Special metadata overrides
  if (type === "recruitment" && metadata?.isLeadership) {
    return "board";
  }

  const rules = getApprovalRules().filter((r) => r.type === type);

  if (amount !== undefined && amount !== null) {
    // Find the rule whose amount range contains the value
    const matched = rules.find((r) => {
      const min = r.minAmount ?? 0;
      const max = r.maxAmount ?? Infinity;
      return amount >= min && amount <= max;
    });
    if (matched) return matched.requiredTier;
  }

  // No amount or no range-matched rule → return the highest tier for this type
  // (sorted descending by tier hierarchy)
  const sorted = [...rules].sort(
    (a, b) =>
      TIER_HIERARCHY.indexOf(b.requiredTier) -
      TIER_HIERARCHY.indexOf(a.requiredTier),
  );
  return sorted[0]?.requiredTier ?? "board";
}

/**
 * Checks whether a user's app role meets or exceeds the required
 * approval tier. Returns false for roles with no approval authority.
 */
export function canUserApprove(
  userRole: string,
  requiredTier: ApprovalTier,
): boolean {
  const maxTier = ROLE_TO_MAX_TIER[userRole];
  if (!maxTier) return false;

  const userLevel = TIER_HIERARCHY.indexOf(maxTier);
  const requiredLevel = TIER_HIERARCHY.indexOf(requiredTier);

  return userLevel >= requiredLevel;
}

/**
 * Checks whether an approval request has breached its SLA.
 * Returns the breach status and how many hours overdue (0 if not breached).
 */
export function checkSLABreach(request: ApprovalRequest): {
  breached: boolean;
  hoursOverdue: number;
  hoursElapsed: number;
  slaHours: number;
} {
  const rules = getApprovalRules().filter((r) => r.type === request.type);

  // Find matching rule by amount
  let slaHours = 48; // sensible default
  if (request.amount !== undefined) {
    const matched = rules.find((r) => {
      const min = r.minAmount ?? 0;
      const max = r.maxAmount ?? Infinity;
      return request.amount! >= min && request.amount! <= max;
    });
    if (matched) slaHours = matched.slaHours;
  } else {
    // Take the first rule for this type
    const first = rules[0];
    if (first) slaHours = first.slaHours;
  }

  const createdAt = new Date(request.createdAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
  const hoursOverdue = Math.max(0, hoursElapsed - slaHours);

  return {
    breached: hoursOverdue > 0,
    hoursOverdue: Math.round(hoursOverdue * 10) / 10,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    slaHours,
  };
}

/**
 * Returns the next tier up from the current one for escalation.
 * If already at the top (members), returns 'members' again.
 */
export function getEscalationTarget(currentTier: ApprovalTier): ApprovalTier {
  const idx = TIER_HIERARCHY.indexOf(currentTier);
  if (idx === -1 || idx >= TIER_HIERARCHY.length - 1) {
    return "members";
  }
  return TIER_HIERARCHY[idx + 1];
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Human-readable label for a tier */
export function tierLabel(tier: ApprovalTier): string {
  const labels: Record<ApprovalTier, string> = {
    headteacher: "Headteacher",
    slt: "Senior Leadership Team",
    cfo: "Chief Financial Officer",
    ceo: "Chief Executive Officer",
    board: "Board of Trustees / Governors",
    members: "Members",
  };
  return labels[tier];
}

/** Human-readable label for an approval type */
export function typeLabel(type: ApprovalType): string {
  const labels: Record<ApprovalType, string> = {
    spend: "Expenditure",
    contract: "Contract",
    policy: "Policy Change",
    risk_decision: "Risk Decision",
    recruitment: "Recruitment",
    disposal: "Asset Disposal",
  };
  return labels[type];
}

/**
 * Returns the SLA hours for a given type + amount combination.
 */
export function getSLAHours(type: ApprovalType, amount?: number): number {
  const rules = getApprovalRules().filter((r) => r.type === type);

  if (amount !== undefined) {
    const matched = rules.find((r) => {
      const min = r.minAmount ?? 0;
      const max = r.maxAmount ?? Infinity;
      return amount >= min && amount <= max;
    });
    if (matched) return matched.slaHours;
  }

  return rules[0]?.slaHours ?? 48;
}

/**
 * Checks whether a rule requires minuting at a board meeting.
 */
export function requiresMinuting(type: ApprovalType, amount?: number): boolean {
  const rules = getApprovalRules().filter((r) => r.type === type);

  if (amount !== undefined) {
    const matched = rules.find((r) => {
      const min = r.minAmount ?? 0;
      const max = r.maxAmount ?? Infinity;
      return amount >= min && amount <= max;
    });
    return matched?.requiresMinute ?? false;
  }

  return rules.some((r) => r.requiresMinute);
}
