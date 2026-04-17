import type { ConnectorGap, ConnectorType, LeavingImpact, StaffConnector } from "./types";

/**
 * Parse the ratio requirement string to extract the numeric ratio (per N pupils).
 * e.g. "1:100 (risk-assessed)" → 100
 * Returns null if no ratio can be parsed.
 */
function parseRatioDenominator(ratioRequirement: string): number | null {
  const match = ratioRequirement.match(/1:(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check all connector coverage for an organisation and return any gaps.
 *
 * Rules applied:
 * - CRITICAL: A statutory connector with "Min 1" or "Exactly 1" has zero active holders.
 * - WARNING: First-aider ratio falls below 1:100 for the given school roll.
 * - INFO: Any connector's training expires within 60 days.
 *
 * @param connectors       Active staff connectors for this org.
 * @param connectorTypes   All connector type definitions to check against.
 * @param schoolRoll       Total number of pupils (used for ratio checking).
 */
export function checkConnectorCoverage(
  connectors: StaffConnector[],
  connectorTypes: ConnectorType[],
  schoolRoll: number,
): ConnectorGap[] {
  const gaps: ConnectorGap[] = [];
  const now = new Date();
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

  for (const type of connectorTypes) {
    // Find all active connectors of this type
    const holders = connectors.filter(
      (c) => c.connector_type_id === type.id && c.status !== "expired",
    );
    const holderNames = holders.map((h) => h.staff_name);

    // ── 1. Check ratio requirements ─────────────────────────────────────────
    if (type.ratioRequirement) {
      const ratioDenominator = parseRatioDenominator(type.ratioRequirement);

      if (ratioDenominator !== null) {
        // Ratio-based check (e.g. First Aiders at 1:100)
        const requiredCount = Math.ceil(schoolRoll / ratioDenominator);
        const activeCount = holders.filter((h) => h.status === "active").length;

        if (activeCount < requiredCount) {
          gaps.push({
            connectorType: type,
            severity: "warning",
            message: `Only ${activeCount} ${type.name}${activeCount === 1 ? "" : "s"} for ${schoolRoll} pupils — below ${type.ratioRequirement} ratio (need ${requiredCount})`,
            currentHolders: holderNames,
            requiredCount,
          });
        }
      } else if (
        type.isStatutory &&
        (type.ratioRequirement.startsWith("Min 1") ||
          type.ratioRequirement.startsWith("Exactly 1"))
      ) {
        // Minimum-1 check — critical if nobody assigned
        const requiredCount = 1;
        if (holders.length === 0) {
          gaps.push({
            connectorType: type,
            severity: "critical",
            message: `No ${type.name} assigned — this is a statutory requirement (${type.statutoryBasis ?? "regulatory"})`,
            currentHolders: [],
            requiredCount,
          });
        }
      }
    }

    // ── 2. Check training expiry within 60 days ──────────────────────────────
    for (const holder of holders) {
      if (!holder.training_expires_at) continue;

      const expiresAt = new Date(holder.training_expires_at);
      const msUntilExpiry = expiresAt.getTime() - now.getTime();

      if (msUntilExpiry > 0 && msUntilExpiry <= sixtyDaysMs) {
        const daysRemaining = Math.ceil(msUntilExpiry / (24 * 60 * 60 * 1000));
        gaps.push({
          connectorType: type,
          severity: "info",
          message: `${holder.staff_name}'s ${type.name} training expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
          currentHolders: [holder.staff_name],
          requiredCount: 1,
        });
      }
    }
  }

  return gaps;
}

/**
 * Analyse the impact of a staff member being absent or leaving.
 *
 * For each connector the staff member holds, checks whether other staff
 * cover the same connector type. Rates severity:
 * - CRITICAL: no other active holder exists for the same connector type.
 * - WARNING: at least one other holder exists, but cover is reduced.
 *
 * @param staffId            The staff member whose impact is being analysed.
 * @param connectors         Connectors held by this specific staff member.
 * @param connectorTypes     All connector type definitions.
 * @param allStaffConnectors All connectors across the whole organisation.
 */
export function analyseStaffImpact(
  staffId: string,
  connectors: StaffConnector[],
  connectorTypes: ConnectorType[],
  allStaffConnectors: StaffConnector[],
): LeavingImpact {
  // Find connectors belonging to the target staff member
  const staffConnectors = connectors.filter((c) => c.staff_id === staffId);

  if (staffConnectors.length === 0) {
    return {
      staffName: "Unknown",
      connectors: [],
    };
  }

  const staffName = staffConnectors[0].staff_name;

  const impacts = staffConnectors.map((sc) => {
    const connectorType = connectorTypes.find((t) => t.id === sc.connector_type_id);

    if (!connectorType) {
      return null;
    }

    // Find other active holders of the same connector type
    const alternatives = allStaffConnectors.filter(
      (c) =>
        c.connector_type_id === sc.connector_type_id &&
        c.staff_id !== staffId &&
        c.status === "active",
    );

    const alternativeNames = alternatives.map((a) => a.staff_name);

    const severity: "critical" | "warning" = alternatives.length === 0 ? "critical" : "warning";

    const message =
      alternatives.length === 0
        ? `No other staff holds ${connectorType.name} — cover will be unavailable`
        : `${alternatives.length} other staff can cover ${connectorType.name}: ${alternativeNames.join(", ")}`;

    return {
      connector: connectorType,
      severity,
      message,
      alternatives: alternativeNames,
    };
  });

  return {
    staffName,
    connectors: impacts.filter(Boolean) as LeavingImpact["connectors"],
  };
}

/**
 * Get all connectors with training expiring within the specified number of days.
 *
 * @param connectors  Staff connectors to check.
 * @param withinDays  Window in days (e.g. 30, 60, 90).
 */
export function getExpiringConnectors(
  connectors: StaffConnector[],
  withinDays: number,
): StaffConnector[] {
  const now = new Date();
  const windowMs = withinDays * 24 * 60 * 60 * 1000;

  return connectors.filter((c) => {
    if (!c.training_expires_at) return false;

    const expiresAt = new Date(c.training_expires_at);
    const msUntilExpiry = expiresAt.getTime() - now.getTime();

    // Expiring soon (positive) or already expired (negative) within the window
    return msUntilExpiry <= windowMs;
  });
}
