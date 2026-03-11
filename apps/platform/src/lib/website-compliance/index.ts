export {
  WEBSITE_COMPLIANCE_REQUIREMENTS,
  REQUIREMENT_CATEGORY_LABELS,
  TOTAL_REQUIREMENTS,
  TOTAL_STATUTORY,
  getRequirementsForSchoolType,
  getRequirementsByCategory,
  getStatutoryRequirements,
} from "./requirements";
export type {
  ComplianceRequirement,
  RequirementCategory,
  SchoolType,
  SchoolPhase,
  RequirementSeverity,
  UpdateFrequency,
} from "./requirements";

export { assessWebsiteCompliance } from "./assessor";
export type {
  ComplianceStatus,
  RequirementAssessment,
  WebsiteComplianceReport,
  CategorySummary,
  AssessmentOptions,
} from "./assessor";
