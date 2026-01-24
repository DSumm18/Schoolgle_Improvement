import "./chunk-XAMNYFBL.mjs";
import {
  EdOrchestrator,
  buildEnrichedPrompt,
  buildSchoolContextBlock,
  classifyIntent,
  createOrchestrator,
  createTestOrchestrator,
  explainRouting,
  getTypeSpecificGuidance,
  isWorkRelated,
  loadSchoolContext,
  requiresMultiPerspective,
  routeToSpecialist
} from "./chunk-KXGU75KO.mjs";
import {
  CreditManager,
  createCreditManager
} from "./chunk-DHRE3F6T.mjs";
import {
  AGENTS,
  COMMUNICATIONS_DOMAIN,
  COMMUNICATIONS_KEYWORDS,
  COMMUNICATIONS_QUALIFICATIONS,
  COMMUNICATIONS_SPECIALIST_ID,
  COMMUNICATIONS_SPECIALIST_PROMPT,
  CURRICULUM_DOMAIN,
  CURRICULUM_KEYWORDS,
  CURRICULUM_QUALIFICATIONS,
  CURRICULUM_SPECIALIST_ID,
  CURRICULUM_SPECIALIST_PROMPT,
  DATA_DOMAIN,
  DATA_KEYWORDS,
  DATA_QUALIFICATIONS,
  DATA_SPECIALIST_ID,
  DATA_SPECIALIST_PROMPT,
  DOMAIN_KEYWORDS,
  ED_GENERAL_PROMPT,
  ESTATES_DOMAIN,
  ESTATES_KEYWORDS,
  ESTATES_QUALIFICATIONS,
  ESTATES_SPECIALIST_ID,
  ESTATES_SPECIALIST_PROMPT,
  GOVERNANCE_DOMAIN,
  GOVERNANCE_KEYWORDS,
  GOVERNANCE_QUALIFICATIONS,
  GOVERNANCE_SPECIALIST_ID,
  GOVERNANCE_SPECIALIST_PROMPT,
  HR_DOMAIN,
  HR_KEYWORDS,
  HR_QUALIFICATIONS,
  HR_SPECIALIST_ID,
  HR_SPECIALIST_PROMPT,
  IT_TECH_DOMAIN,
  IT_TECH_KEYWORDS,
  IT_TECH_QUALIFICATIONS,
  IT_TECH_SPECIALIST_ID,
  IT_TECH_SPECIALIST_PROMPT,
  PROCUREMENT_DOMAIN,
  PROCUREMENT_KEYWORDS,
  PROCUREMENT_QUALIFICATIONS,
  PROCUREMENT_SPECIALIST_ID,
  PROCUREMENT_SPECIALIST_PROMPT,
  SEND_DOMAIN,
  SEND_KEYWORDS,
  SEND_QUALIFICATIONS,
  SEND_SPECIALIST_ID,
  SEND_SPECIALIST_PROMPT,
  getAgent,
  getAgentByDomain,
  getAllAgentIds,
  getSpecialistIds
} from "./chunk-NOR2KXUH.mjs";
import "./chunk-7ZNLKKCF.mjs";
import {
  applyGuardrails,
  complianceCheck,
  confidenceCheck,
  ensureSourceCitation,
  permissionCheck,
  safetyCheck,
  toneCheck
} from "./chunk-7SSKUU7Q.mjs";
import "./chunk-26QL33UX.mjs";
import {
  CRITIC_PROMPT,
  NEUTRAL_PROMPT,
  OPTIMIST_PROMPT,
  SYNTHESIS_PROMPT,
  clearPerspectiveCache,
  generateMultiPerspectiveResponse,
  generatePerspectivesCached
} from "./chunk-VGXQEGV6.mjs";
import {
  SKILLS
} from "./chunk-OBLHLA7N.mjs";
import "./chunk-S54OIZRL.mjs";
import {
  addKnowledgeEntry,
  getEntriesDueForReview,
  getKnowledgeEntry,
  isKnowledgeStale,
  queryKnowledgeBase,
  searchByTopic,
  updateKnowledgeEntry
} from "./chunk-TMZ5VDLU.mjs";
import "./chunk-R5MH6P2G.mjs";
import {
  MODEL_ALIASES,
  ModelRouter,
  OPENROUTER_MODELS,
  OpenRouterClient,
  OpenRouterError,
  calculateCost,
  calculateTokenCost,
  checkCredits,
  createOpenRouterClient,
  getAllModels,
  getModel,
  getModelRouter,
  selectModel
} from "./chunk-XCFC4OXF.mjs";
import "./chunk-C3N2FVDJ.mjs";

// src/types/index.ts
var EdAgentError = class extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "EdAgentError";
  }
};
var SpecialistNotFoundError = class extends EdAgentError {
  constructor(specialistId) {
    super(`Specialist not found: ${specialistId}`, "SPECIALIST_NOT_FOUND");
    this.name = "SpecialistNotFoundError";
  }
};
var GuardrailFailedError = class extends EdAgentError {
  constructor(reason, result) {
    super(`Guardrail failed: ${reason}`, "GUARDRAIL_FAILED");
    this.result = result;
    this.name = "GuardrailFailedError";
  }
};
var InsufficientCreditsError = class extends EdAgentError {
  constructor(required, available) {
    super(
      `Insufficient credits: ${available} available, ${required} required`,
      "INSUFFICIENT_CREDITS"
    );
    this.name = "InsufficientCreditsError";
  }
};
var KnowledgeNotFoundError = class extends EdAgentError {
  constructor(query) {
    super(`No knowledge found for query: ${query}`, "KNOWLEDGE_NOT_FOUND");
    this.name = "KnowledgeNotFoundError";
  }
};

// src/index.ts
var VERSION = "0.1.0";
export {
  AGENTS,
  COMMUNICATIONS_DOMAIN,
  COMMUNICATIONS_KEYWORDS,
  COMMUNICATIONS_QUALIFICATIONS,
  COMMUNICATIONS_SPECIALIST_ID,
  COMMUNICATIONS_SPECIALIST_PROMPT,
  CRITIC_PROMPT,
  CURRICULUM_DOMAIN,
  CURRICULUM_KEYWORDS,
  CURRICULUM_QUALIFICATIONS,
  CURRICULUM_SPECIALIST_ID,
  CURRICULUM_SPECIALIST_PROMPT,
  CreditManager,
  DATA_DOMAIN,
  DATA_KEYWORDS,
  DATA_QUALIFICATIONS,
  DATA_SPECIALIST_ID,
  DATA_SPECIALIST_PROMPT,
  DOMAIN_KEYWORDS,
  ED_GENERAL_PROMPT,
  ESTATES_DOMAIN,
  ESTATES_KEYWORDS,
  ESTATES_QUALIFICATIONS,
  ESTATES_SPECIALIST_ID,
  ESTATES_SPECIALIST_PROMPT,
  EdAgentError,
  EdOrchestrator,
  GOVERNANCE_DOMAIN,
  GOVERNANCE_KEYWORDS,
  GOVERNANCE_QUALIFICATIONS,
  GOVERNANCE_SPECIALIST_ID,
  GOVERNANCE_SPECIALIST_PROMPT,
  GuardrailFailedError,
  HR_DOMAIN,
  HR_KEYWORDS,
  HR_QUALIFICATIONS,
  HR_SPECIALIST_ID,
  HR_SPECIALIST_PROMPT,
  IT_TECH_DOMAIN,
  IT_TECH_KEYWORDS,
  IT_TECH_QUALIFICATIONS,
  IT_TECH_SPECIALIST_ID,
  IT_TECH_SPECIALIST_PROMPT,
  InsufficientCreditsError,
  KnowledgeNotFoundError,
  MODEL_ALIASES,
  ModelRouter,
  NEUTRAL_PROMPT,
  OPENROUTER_MODELS,
  OPTIMIST_PROMPT,
  OpenRouterClient,
  OpenRouterError,
  PROCUREMENT_DOMAIN,
  PROCUREMENT_KEYWORDS,
  PROCUREMENT_QUALIFICATIONS,
  PROCUREMENT_SPECIALIST_ID,
  PROCUREMENT_SPECIALIST_PROMPT,
  SEND_DOMAIN,
  SEND_KEYWORDS,
  SEND_QUALIFICATIONS,
  SEND_SPECIALIST_ID,
  SEND_SPECIALIST_PROMPT,
  SKILLS,
  SYNTHESIS_PROMPT,
  SpecialistNotFoundError,
  VERSION,
  addKnowledgeEntry,
  applyGuardrails,
  buildEnrichedPrompt,
  buildSchoolContextBlock,
  calculateCost,
  calculateTokenCost,
  checkCredits,
  classifyIntent,
  clearPerspectiveCache,
  complianceCheck,
  confidenceCheck,
  createCreditManager,
  createOpenRouterClient,
  createOrchestrator,
  createTestOrchestrator,
  ensureSourceCitation,
  explainRouting,
  generateMultiPerspectiveResponse,
  generatePerspectivesCached,
  getAgent,
  getAgentByDomain,
  getAllAgentIds,
  getAllModels,
  getEntriesDueForReview,
  getKnowledgeEntry,
  getModel,
  getModelRouter,
  getSpecialistIds,
  getTypeSpecificGuidance,
  isKnowledgeStale,
  isWorkRelated,
  loadSchoolContext,
  permissionCheck,
  queryKnowledgeBase,
  requiresMultiPerspective,
  routeToSpecialist,
  safetyCheck,
  searchByTopic,
  selectModel,
  toneCheck,
  updateKnowledgeEntry
};
//# sourceMappingURL=index.mjs.map