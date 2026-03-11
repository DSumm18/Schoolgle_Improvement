export type {
  DocumentModule,
  DocumentType,
  DocumentStatus,
  RecipientType,
  DeliveryMethod,
  PlaceholderDefinition,
  DocumentTemplate,
  GeneratedDocument,
  DeliveryLogEntry,
  TriggerRule,
} from "./types";
export { MODULE_CONFIG } from "./types";

export type { OrgBranding } from "./template-renderer";
export {
  renderTemplate,
  renderConditional,
  renderLoop,
  renderDocument,
  escapeHtml,
  extractPlaceholders,
} from "./template-renderer";

export type { ResolverContext } from "./placeholder-resolver";
export {
  resolveFromStaff,
  resolveFromOrganization,
  resolveFromMeeting,
  resolveFromSender,
  resolveFromAbsence,
  resolveFromContractor,
  resolvePlaceholders,
} from "./placeholder-resolver";

export type {
  TriggerEvent,
  TriggerResult,
  TriggerEventType,
} from "./trigger-engine";
export {
  evaluateTriggers,
  fireTrigger,
  TRIGGER_EVENTS,
} from "./trigger-engine";
