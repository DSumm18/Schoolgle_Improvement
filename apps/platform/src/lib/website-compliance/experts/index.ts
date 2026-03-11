/**
 * Expert Registry
 *
 * Maps requirement keys to their specialist expert assessors.
 * Requirements without a dedicated expert fall back to the generic AI prompt.
 *
 * This registry also serves as the entry point for Ed to invoke individual
 * experts when helping schools fix specific compliance issues.
 */

import type { ComplianceExpert } from "./base-expert";

// Structural link experts
import { financialLinkExpert } from "./financial-link";
import { performanceLinkExpert } from "./performance-link";

// Staff/name experts (preserve_names PII mode)
import { sencoDetailsExpert } from "./senco-details";
import { headteacherNameExpert } from "./headteacher-name";
import { contactDetailsExpert } from "./contact-details";
import { safeguardingPolicyExpert } from "./safeguarding-policy";
import { governanceInfoExpert } from "./governance-info";

// Admissions experts
import {
  admissionArrangementsExpert,
  appealsTimetableExpert,
  inYearAdmissionsExpert,
} from "./admissions";

// Curriculum experts
import {
  curriculumContentExpert,
  phonicsReadingExpert,
  reWithdrawalExpert,
  careersProgrammeExpert,
  providerAccessExpert,
} from "./curriculum";

// Policy presence experts
import {
  behaviourPolicyExpert,
  complaintsProcedureExpert,
  chargingRemissionsExpert,
  uniformPolicyExpert,
  whistleblowingExpert,
  rsePolicyExpert,
  onlineSafetyExpert,
  filteringMonitoringExpert,
} from "./policy-presence";

// Ofsted report expert
import { ofstedReportExpert } from "./ofsted-report";

// Funding & results experts
import {
  pupilPremiumExpert,
  peSportPremiumExpert,
  ks2ResultsExpert,
  ks4ResultsExpert,
  ks5ResultsExpert,
  highPayExpert,
  academyAccountsExpert,
  genderPayGapExpert,
  offPayrollExpert,
  familyRelationshipsExpert,
} from "./funding-results";

// Equality & accessibility experts
import {
  sendInformationReportExpert,
  websiteAccessibilityExpert,
  equalityObjectivesExpert,
  equalityInformationExpert,
  accessibilityPlanExpert,
  academyTrustInfoExpert,
} from "./equality-accessibility";

// SIAMS experts
import {
  collectiveWorshipExpert,
  christianVisionExpert,
  siamsReportExpert,
  diocesanLinkExpert,
} from "./siams";

// ─── Registry ──────────────────────────────────────────────────────

const ALL_EXPERTS: ComplianceExpert[] = [
  // Structural link checks
  financialLinkExpert,
  performanceLinkExpert,

  // Staff details (preserve names)
  sencoDetailsExpert,
  headteacherNameExpert,
  contactDetailsExpert,
  safeguardingPolicyExpert,
  governanceInfoExpert,

  // Admissions
  admissionArrangementsExpert,
  appealsTimetableExpert,
  inYearAdmissionsExpert,

  // Curriculum
  curriculumContentExpert,
  phonicsReadingExpert,
  reWithdrawalExpert,
  careersProgrammeExpert,
  providerAccessExpert,

  // Policies
  behaviourPolicyExpert,
  complaintsProcedureExpert,
  chargingRemissionsExpert,
  uniformPolicyExpert,
  whistleblowingExpert,
  rsePolicyExpert,
  onlineSafetyExpert,
  filteringMonitoringExpert,

  // Ofsted
  ofstedReportExpert,

  // Funding & results
  pupilPremiumExpert,
  peSportPremiumExpert,
  ks2ResultsExpert,
  ks4ResultsExpert,
  ks5ResultsExpert,
  highPayExpert,
  academyAccountsExpert,
  genderPayGapExpert,
  offPayrollExpert,
  familyRelationshipsExpert,

  // Equality & accessibility
  sendInformationReportExpert,
  websiteAccessibilityExpert,
  equalityObjectivesExpert,
  equalityInformationExpert,
  accessibilityPlanExpert,
  academyTrustInfoExpert,

  // SIAMS
  collectiveWorshipExpert,
  christianVisionExpert,
  siamsReportExpert,
  diocesanLinkExpert,
];

/** Map from requirement key → expert */
const expertMap = new Map<string, ComplianceExpert>();
for (const expert of ALL_EXPERTS) {
  for (const key of expert.config.requirementKeys) {
    expertMap.set(key, expert);
  }
}

/**
 * Look up the expert for a given requirement key.
 * Returns null if no dedicated expert exists (falls back to generic AI).
 */
export function getExpert(requirementKey: string): ComplianceExpert | null {
  return expertMap.get(requirementKey) ?? null;
}

/**
 * Get all registered experts.
 */
export function getAllExperts(): ComplianceExpert[] {
  return ALL_EXPERTS;
}

/**
 * Get all requirement keys that have dedicated experts.
 */
export function getCoveredRequirementKeys(): string[] {
  return Array.from(expertMap.keys());
}

// Re-export types for convenience
export type {
  ComplianceExpert,
  ExpertResult,
  ExpertConfig,
} from "./base-expert";
