/**
 * Schoolgle Vision AI -- Shared Types
 *
 * Central type definitions used by the Vision service, contexts,
 * dispatcher, and API routes.
 */

// ---------------------------------------------------------------------------
// Context types -- each maps to a specialised prompt + model selection
// ---------------------------------------------------------------------------

export type VisionContextType =
  | "room-assessment"
  | "coshh-scan"
  | "snagging"
  | "lone-worker";

export type CheckType =
  | "am_open"
  | "pm_close"
  | "holiday_progress"
  | "contractor_snagging"
  | "ad_hoc";

// ---------------------------------------------------------------------------
// Request / Response
// ---------------------------------------------------------------------------

export interface VisionRequest {
  contextType: VisionContextType;
  organizationId: string;
  mediaType: "image" | "video-clip";
  /** Base64-encoded media or a Supabase Storage URL */
  media: string;
  mimeType: string;
  metadata: VisionMetadata;
}

export interface VisionMetadata {
  assetId: string;
  capturedAt: string;
  deviceGps?: { lat: number; lng: number };
  deviceId?: string;
  checkType?: CheckType;
  userId?: string;
}

export interface VisionResult {
  contextType: VisionContextType;
  confidence: number;
  items: VisionItem[];
  compliance: ComplianceAssessment;
  actions: SuggestedAction[];
  dispatches: ModuleDispatch[];
  summary: string;
  raw?: unknown;
}

// ---------------------------------------------------------------------------
// Items detected by the vision model
// ---------------------------------------------------------------------------

export interface VisionItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  boundingBox?: { x: number; y: number; w: number; h: number };
  /** Context-specific attributes (hazard class, expiry, condition, etc.) */
  attributes: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Compliance assessment from a scan
// ---------------------------------------------------------------------------

export type Severity = "critical" | "high" | "medium" | "low";

export interface ComplianceIssue {
  id: string;
  description: string;
  severity: Severity;
  domain: string;
  evidence?: string;
}

export interface ComplianceAssessment {
  score: number;
  issues: ComplianceIssue[];
  passed: boolean;
}

// ---------------------------------------------------------------------------
// Actions suggested by the vision analysis
// ---------------------------------------------------------------------------

export interface SuggestedAction {
  type: string;
  description: string;
  priority: Severity;
  assignTo?: string;
  module?: string;
  referenceId?: string;
}

// ---------------------------------------------------------------------------
// Module dispatch -- what findings were routed where
// ---------------------------------------------------------------------------

export type DispatchModule =
  | "estates"
  | "helpdesk"
  | "asset_register"
  | "coshh"
  | "teaching_learning"
  | "safeguarding"
  | "h_and_s";

export type DispatchAction =
  | "updated"
  | "ticket_created"
  | "flag_raised"
  | "no_issues";

export interface ModuleDispatch {
  module: DispatchModule;
  action: DispatchAction;
  detail: string;
  referenceId?: string;
}

// ---------------------------------------------------------------------------
// Vision context configuration (used by context modules)
// ---------------------------------------------------------------------------

export interface VisionContext {
  type: VisionContextType;
  systemPrompt: string;
  /** JSON schema description for structured output */
  responseSchema?: string;
  /** Post-process raw model output into VisionResult */
  parseResponse: (raw: unknown, metadata: VisionMetadata) => VisionResult;
}

// ---------------------------------------------------------------------------
// Evidence integrity
// ---------------------------------------------------------------------------

export interface EvidenceRecord {
  mediaHash: string;
  deviceGps?: { lat: number; lng: number };
  deviceId?: string;
  captureTimestamp: string;
  serverReceivedAt: string;
  locked: boolean;
  lockedAt?: string;
}
