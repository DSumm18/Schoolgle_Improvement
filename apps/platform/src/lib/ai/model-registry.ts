import { APPROVED_AI_PROVIDER_FAMILIES } from "./model-policy";

export type AiModelRegistryStatus = "active" | "fallback" | "planned";
export type AiModelCostTier = "low" | "medium" | "high";
export type AiModelQualityTier = "fast" | "balanced" | "premium" | "specialist";
export type AiModelDataClassification =
  | "School/customer data"
  | "Operational metadata"
  | "No personal data";
export type AiModelRoute =
  | "OpenRouter"
  | "Direct Google AI"
  | "Direct OpenAI"
  | "Browser API";

export interface AiModelRegistryEntry {
  id: string;
  area: string;
  owner: string;
  capability: string;
  primaryModel: string;
  fallbackModels: string[];
  providerFamilies: Array<(typeof APPROVED_AI_PROVIDER_FAMILIES)[number]>;
  route: AiModelRoute;
  dataClassification: AiModelDataClassification;
  costTier: AiModelCostTier;
  qualityTier: AiModelQualityTier;
  status: AiModelRegistryStatus;
  decisionNotes: string;
  sourceFiles: string[];
  lastReviewed: string;
}

const LAST_REVIEWED = "2026-04-28";

export const AI_MODEL_REGISTRY: AiModelRegistryEntry[] = [
  {
    id: "ofsted-evidence-matching",
    area: "Ofsted readiness / evidence matching",
    owner: "School improvement",
    capability: "Maps uploaded evidence to framework requirements with source attribution.",
    primaryModel: "google/gemini-2.0-flash-001",
    fallbackModels: [
      "google/gemini-2.0-flash-lite-001",
      "anthropic/claude-3.5-sonnet",
    ],
    providerFamilies: ["Google", "Anthropic"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "medium",
    qualityTier: "balanced",
    status: "active",
    decisionNotes: "Gemini Flash is the default for cost-effective extraction; Claude is reserved for premium synthesis.",
    sourceFiles: ["apps/platform/src/lib/ai-evidence-matcher.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "ocr-scanned-documents",
    area: "Scanned document OCR",
    owner: "Document processing",
    capability: "Reads scanned PDFs and images before evidence or compliance extraction.",
    primaryModel: "mistralai/mistral-ocr-latest",
    fallbackModels: ["google/gemini-2.0-flash-001"],
    providerFamilies: ["Mistral", "Google"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "medium",
    qualityTier: "specialist",
    status: "active",
    decisionNotes: "Use OCR-specific capability only when standard text extraction is insufficient.",
    sourceFiles: ["apps/platform/src/lib/ai-evidence-matcher.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "ed-classification-routing",
    area: "Ed chatbot routing",
    owner: "Ed assistant",
    capability: "Classifies user intent and routes work to the correct specialist agent.",
    primaryModel: "google/gemini-2.0-flash-001",
    fallbackModels: ["google/gemini-2.0-flash-exp", "openai/gpt-4o-mini"],
    providerFamilies: ["Google", "OpenAI"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "low",
    qualityTier: "fast",
    status: "active",
    decisionNotes: "Keep routing cheap and quick; escalate only when the downstream task needs it.",
    sourceFiles: ["packages/ed-agents/src/models/router.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "ed-specialist-responses",
    area: "Ed specialist responses",
    owner: "Ed assistant",
    capability: "Generates domain specialist replies and skill-assisted responses.",
    primaryModel: "openai/gpt-4o-mini",
    fallbackModels: ["google/gemini-2.0-flash-001", "google/gemini-2.5-pro"],
    providerFamilies: ["OpenAI", "Google"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "low",
    qualityTier: "balanced",
    status: "active",
    decisionNotes: "Default to a low-cost model for everyday assistance; use Gemini Pro for harder reasoning.",
    sourceFiles: [
      "packages/ed-agents/src/models/router.ts",
      "packages/ed-agents/src/models/openrouter.ts",
    ],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "ed-perspective-synthesis",
    area: "Ed multi-perspective synthesis",
    owner: "Ed assistant",
    capability: "Produces multi-perspective advice and final synthesis for complex decisions.",
    primaryModel: "openai/gpt-4o-mini",
    fallbackModels: ["anthropic/claude-3.5-sonnet"],
    providerFamilies: ["OpenAI", "Anthropic"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "high",
    qualityTier: "premium",
    status: "active",
    decisionNotes: "Mini handles perspectives cheaply; Claude is reserved for final synthesis where quality matters.",
    sourceFiles: ["packages/ed-agents/src/perspectives/generator.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "estates-energy-invoices",
    area: "Estates energy invoice extraction",
    owner: "Estates compliance",
    capability: "Extracts meter, usage, tariff, supplier and billing data from invoices.",
    primaryModel: "google/gemini-2.0-flash-001",
    fallbackModels: ["mistralai/mistral-ocr-latest"],
    providerFamilies: ["Google", "Mistral"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "medium",
    qualityTier: "balanced",
    status: "active",
    decisionNotes: "Gemini handles structured extraction; Mistral OCR supports scanned invoices.",
    sourceFiles: ["apps/platform/src/lib/energy/invoice-extractor.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "estates-meter-readings",
    area: "Estates meter reading photos",
    owner: "Estates compliance",
    capability: "Reads meter photographs and normalises readings for energy tracking.",
    primaryModel: "google/gemini-2.5-flash-preview",
    fallbackModels: ["google/gemini-2.0-flash-001"],
    providerFamilies: ["Google"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "medium",
    qualityTier: "specialist",
    status: "active",
    decisionNotes: "Vision-first Gemini is appropriate for meter image extraction.",
    sourceFiles: ["apps/platform/src/app/api/estates/energy/meter-reading/route.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "estates-contractor-reports",
    area: "Estates contractor report extraction",
    owner: "Estates compliance",
    capability: "Extracts recommendations, risks, assets and actions from contractor reports.",
    primaryModel: "gemini-2.5-flash",
    fallbackModels: ["google/gemini-2.0-flash-001"],
    providerFamilies: ["Google"],
    route: "Direct Google AI",
    dataClassification: "School/customer data",
    costTier: "medium",
    qualityTier: "specialist",
    status: "active",
    decisionNotes: "Direct Gemini supports document analysis already used in the estates compliance pipeline.",
    sourceFiles: [
      "apps/platform/src/lib/estates-compliance/ai/contractor-report-extractor.ts",
      "apps/platform/src/app/api/skills/invoke/route.ts",
    ],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "estates-helpdesk-risk",
    area: "Estates helpdesk risk scoring",
    owner: "Estates compliance",
    capability: "Scores helpdesk issues and recommends escalation based on risk.",
    primaryModel: "google/gemini-2.0-flash-001",
    fallbackModels: ["openai/gpt-4o-mini"],
    providerFamilies: ["Google", "OpenAI"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "low",
    qualityTier: "balanced",
    status: "active",
    decisionNotes: "Use a low-cost reasoning model because the output is advisory and reviewed by users.",
    sourceFiles: ["apps/platform/src/lib/estates-compliance/services/helpdesk-risk-service.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "pathfinder-asset-vision",
    area: "Pathfinder / asset vision extraction",
    owner: "Asset register",
    capability: "Extracts assets and spatial observations from site plans or photos.",
    primaryModel: "google/gemini-2.5-flash",
    fallbackModels: ["openai/gpt-4o"],
    providerFamilies: ["Google", "OpenAI"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "medium",
    qualityTier: "specialist",
    status: "active",
    decisionNotes: "Gemini Flash is used first for vision cost control; GPT-4o is a quality fallback.",
    sourceFiles: [
      "apps/platform/src/lib/pathfinder/vision-extractor.ts",
      "apps/platform/src/app/api/pathfinder/prototype/extract/route.ts",
    ],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "vision-analysis",
    area: "Generic vision analysis",
    owner: "Platform intelligence",
    capability: "Analyses photos, screenshots and visual evidence for structured findings.",
    primaryModel: "gemini-2.5-flash",
    fallbackModels: ["openai/gpt-4o", "anthropic/claude-sonnet-4"],
    providerFamilies: ["Google", "OpenAI", "Anthropic"],
    route: "Direct Google AI",
    dataClassification: "School/customer data",
    costTier: "high",
    qualityTier: "specialist",
    status: "active",
    decisionNotes: "Direct Gemini is the default; premium fallbacks should be justified by quality need.",
    sourceFiles: [
      "apps/platform/src/lib/vision/analyse.ts",
      "apps/platform/src/lib/vision/models.ts",
    ],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "school-intelligence-analysis",
    area: "School intelligence analysis",
    owner: "Intelligence",
    capability: "Analyses DfE trends, contextual factors and cross-module signals.",
    primaryModel: "google/gemini-2.0-flash-001",
    fallbackModels: ["openai/gpt-4o-mini"],
    providerFamilies: ["Google", "OpenAI"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "medium",
    qualityTier: "balanced",
    status: "active",
    decisionNotes: "Default to Gemini for broad analytical sweeps with a cheaper OpenAI fallback.",
    sourceFiles: ["apps/platform/src/lib/school-intelligence-engine.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "form-helper",
    area: "Ed form helper",
    owner: "Forms automation",
    capability: "Detects forms, translates support prompts and verifies field responses.",
    primaryModel: "google/gemini-2.0-flash-001",
    fallbackModels: ["google/gemini-2.0-flash-lite-001"],
    providerFamilies: ["Google"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "low",
    qualityTier: "fast",
    status: "active",
    decisionNotes: "Use lite models for repetitive translation and field support where possible.",
    sourceFiles: ["apps/platform/src/lib/skills/form-helper-handler.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "documents-extraction",
    area: "Document extraction API",
    owner: "Document processing",
    capability: "Extracts structured content from uploaded documents for downstream workflows.",
    primaryModel: "google/gemini-2.0-flash-001",
    fallbackModels: ["openai/gpt-4o"],
    providerFamilies: ["Google", "OpenAI"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "medium",
    qualityTier: "balanced",
    status: "active",
    decisionNotes: "Gemini is the default extractor; GPT-4o is only for difficult files.",
    sourceFiles: [
      "apps/platform/src/app/api/documents/extract/route.ts",
      "apps/platform/src/lib/extractors.ts",
    ],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "website-compliance",
    area: "Website compliance crawler",
    owner: "Compliance",
    capability: "Assesses crawled pages and public website evidence against compliance expectations.",
    primaryModel: "google/gemini-2.0-flash-lite-001",
    fallbackModels: ["google/gemini-2.0-flash-001"],
    providerFamilies: ["Google"],
    route: "OpenRouter",
    dataClassification: "Operational metadata",
    costTier: "low",
    qualityTier: "fast",
    status: "active",
    decisionNotes: "Use Flash Lite because crawls can generate many small analysis calls.",
    sourceFiles: ["apps/platform/src/lib/website-crawler.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "meeting-minutes",
    area: "Meeting minutes generation",
    owner: "Meetings",
    capability: "Creates draft minutes and structured follow-up actions from meeting records.",
    primaryModel: "openai/gpt-4o-mini",
    fallbackModels: ["google/gemini-2.0-flash-001"],
    providerFamilies: ["OpenAI", "Google"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "low",
    qualityTier: "balanced",
    status: "active",
    decisionNotes: "Minutes are text-heavy and frequent, so GPT-4o mini is the cost-controlled default.",
    sourceFiles: ["apps/platform/src/app/api/meetings/[id]/minutes/route.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "morning-brief",
    area: "Morning brief generation",
    owner: "Communications",
    capability: "Turns operational signals into a concise daily script or briefing.",
    primaryModel: "openai/gpt-4o-mini",
    fallbackModels: ["google/gemini-2.0-flash-001"],
    providerFamilies: ["OpenAI", "Google"],
    route: "OpenRouter",
    dataClassification: "School/customer data",
    costTier: "low",
    qualityTier: "fast",
    status: "active",
    decisionNotes: "Briefs should be cheap, quick and easy to regenerate.",
    sourceFiles: ["apps/platform/src/lib/morning-brief/script-generator.ts"],
    lastReviewed: LAST_REVIEWED,
  },
  {
    id: "embeddings-semantic-search",
    area: "Evidence semantic search embeddings",
    owner: "Evidence platform",
    capability: "Creates embeddings for semantic search and evidence retrieval.",
    primaryModel: "text-embedding-3-small",
    fallbackModels: ["openai/gpt-4o-mini"],
    providerFamilies: ["OpenAI"],
    route: "Direct OpenAI",
    dataClassification: "School/customer data",
    costTier: "low",
    qualityTier: "specialist",
    status: "active",
    decisionNotes: "Use the small embedding model unless search quality evidence justifies an upgrade.",
    sourceFiles: ["apps/platform/src/lib/embeddings.ts"],
    lastReviewed: LAST_REVIEWED,
  },
];

export function getAiModelRegistrySummary() {
  const activeEntries = AI_MODEL_REGISTRY.filter(
    (entry) => entry.status === "active",
  ).length;
  const highCostEntries = AI_MODEL_REGISTRY.filter(
    (entry) => entry.costTier === "high",
  ).length;
  const providerFamilies = Array.from(
    new Set(AI_MODEL_REGISTRY.flatMap((entry) => entry.providerFamilies)),
  ).sort();

  return {
    totalEntries: AI_MODEL_REGISTRY.length,
    activeEntries,
    highCostEntries,
    providerFamilies,
  };
}

export function getAiModelRegistryByArea() {
  return [...AI_MODEL_REGISTRY].sort((left, right) =>
    left.area.localeCompare(right.area),
  );
}
