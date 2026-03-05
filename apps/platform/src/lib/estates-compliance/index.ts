/**
 * Estates Compliance Module - Main Export
 *
 * Re-exports all public APIs from the estates-compliance module
 */

// Statutory checks
export {
  STATUTORY_CHECKS,
  DOMAIN_METADATA,
  getChecksForDomain,
  getAllStatutoryChecks,
  getChecksByFrequency,
  getChecksByCategory,
  type StatutoryCheck,
  type CheckCategory,
  type CheckFrequency,
  type CheckStatus,
  type ComplianceDomain,
} from './statutory-checks';

// Custom check templates
export {
  COMMON_TEMPLATES,
  getTemplatesByDomain,
  getTemplatesByFrequency,
  getTemplatesByTags,
  searchTemplates,
  getTemplateById,
  getPopularTemplates,
  getAllTemplateTags,
  getAllTemplateFrequencies,
  type CheckTemplate,
  type CheckVisibility,
  type RecurrencePattern,
} from './check-templates';

// Custom check service
export {
  CustomCheckService,
  type CustomCheck,
  type CreateCustomCheckInput,
  type UpdateCustomCheckInput,
  type CustomCheckFilters,
} from './services/CustomCheckService';

// Task service
export { TaskService } from './services/TaskService';

// Asset service
export { AssetService } from './services/AssetService';

// Contractor service
export { ContractorService } from './services/ContractorService';

// Helpdesk service
export { HelpdeskService } from './services/HelpdeskService';

// RAG Status service
export { RAGStatusService } from './services/RAGStatusService';

// Daily checks
export {
  OPENING_CHECKLIST,
  CLOSING_CHECKLIST,
  DAILY_CHECKLISTS,
  getDailyChecklist,
  getAllDailyCheckItems,
  getDailyCheckItems,
  getDailyCheckItemsByCategory,
  getDailyCheckItem,
  getTodayDate,
  getChecklistStatusForToday,
  calculateProgress,
  getChecklistIcon,
  getChecklistColor,
  type DailyCheckType,
  type DailyCheckStatus,
  type DailyCheckItem,
  type DailyChecklist,
  type DailyCheckCompletion,
  type DailyCheckResult,
  type DailyCheckCompletionInput,
  type ChecklistStatus,
} from './daily-checks';

// COSHH checks
export {
  COSHH_CHECKS,
  getCOSHHChecks,
  getCOSHHChecksByFrequency,
  type COSHHDomain,
} from './coshh-checks';

// Food safety checks
export {
  FOOD_SAFETY_CHECKS,
  getFoodSafetyChecks,
  getFoodSafetyChecksByFrequency,
  type FoodSafetyDomain,
} from './food-safety-checks';

// Transport checks
export {
  TRANSPORT_CHECKS,
  getTransportChecks,
  getTransportChecksByFrequency,
  type TransportDomain,
} from './transport-checks';

// Safeguarding checks
export {
  SAFEGUARDING_CHECKS,
  getSafeguardingChecks,
  getSafeguardingChecksByFrequency,
  type SafeguardingDomain,
} from './safeguarding-checks';

// Seasonal checks
export {
  SEASONAL_CHECKS,
  getSeasonalChecks,
  getSeasonalChecksBySeason,
  getSeasonalChecksByFrequency,
  type SeasonalDomain,
} from './seasonal-checks';
