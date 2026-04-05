/**
 * Lesson Studio — Connector Registry
 *
 * Registry pattern for lesson plan sources. Each connector transforms
 * its source format into a common LessonInput interface ready for
 * the intent-extraction pipeline.
 */

// ---------------------------------------------------------------------------
// Common types
// ---------------------------------------------------------------------------

/** A single activity / section within a lesson */
export interface LessonActivity {
  title: string;
  description: string;
  durationMinutes?: number;
}

/** Resources referenced by or needed for the lesson */
export interface LessonResource {
  name: string;
  type: "worksheet" | "slide" | "video" | "link" | "equipment" | "other";
  url?: string;
}

/** Structured lesson data returned by every connector */
export interface LessonInput {
  /** Which connector produced this */
  source: string;
  /** Original identifier (Oak slug, filename, etc.) */
  sourceId: string;
  /** Lesson title */
  title: string;
  /** Subject area (e.g. "Mathematics", "Science") */
  subject: string;
  /** UK key stage: "KS1" | "KS2" | "KS3" | "KS4" */
  keyStage: string;
  /** Year group if known (e.g. "Year 3") */
  yearGroup?: string;
  /** Learning objectives */
  objectives: string[];
  /** Activities / sections */
  activities: LessonActivity[];
  /** Resources needed */
  resources: LessonResource[];
  /** Keywords / vocabulary */
  keywords: string[];
  /** Common misconceptions */
  misconceptions: string[];
  /** Raw text (for LLM intent extraction) */
  rawText: string;
  /** Metadata bag for connector-specific extras */
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Connector interface
// ---------------------------------------------------------------------------

/** Options passed when fetching from a connector */
export interface ConnectorFetchOptions {
  /** Subject filter */
  subject?: string;
  /** Key stage filter */
  keyStage?: string;
  /** Year group filter */
  yearGroup?: string;
  /** Free-text search query */
  query?: string;
  /** For file-based connectors: the file buffer */
  fileBuffer?: Buffer;
  /** For file-based connectors: the original filename */
  fileName?: string;
  /** For text-based connectors: raw lesson text */
  rawText?: string;
  /** Max results to return (for search-based connectors) */
  limit?: number;
}

/** A search result from connectors that support browsing */
export interface ConnectorSearchResult {
  id: string;
  title: string;
  subject: string;
  keyStage: string;
  yearGroup?: string;
  /** Short description / summary */
  snippet: string;
}

export interface LessonConnector {
  /** Unique connector id (e.g. "oak", "pdf-scheme", "manual") */
  readonly id: string;
  /** Human-readable label */
  readonly label: string;
  /** Whether this connector supports search/browse */
  readonly supportsSearch: boolean;

  /**
   * Search available lessons (only if supportsSearch === true).
   * Returns lightweight results; call `fetch` with the result id to get full data.
   */
  search(options: ConnectorFetchOptions): Promise<ConnectorSearchResult[]>;

  /**
   * Fetch a full LessonInput from this source.
   *  - For search-based connectors: pass `{ query: "<id from search>" }`
   *  - For file-based connectors: pass `{ fileBuffer, fileName }`
   *  - For manual entry: pass `{ rawText }`
   */
  fetch(options: ConnectorFetchOptions): Promise<LessonInput>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const connectors = new Map<string, LessonConnector>();

export function registerConnector(connector: LessonConnector): void {
  connectors.set(connector.id, connector);
}

export function getConnector(id: string): LessonConnector | undefined {
  return connectors.get(id);
}

export function listConnectors(): LessonConnector[] {
  return Array.from(connectors.values());
}

// ---------------------------------------------------------------------------
// Manual-text connector (built-in)
// ---------------------------------------------------------------------------

const manualConnector: LessonConnector = {
  id: "manual",
  label: "Manual Text Entry",
  supportsSearch: false,

  async search(): Promise<ConnectorSearchResult[]> {
    return [];
  },

  async fetch(options: ConnectorFetchOptions): Promise<LessonInput> {
    const text = options.rawText ?? "";
    if (!text.trim()) {
      throw new Error("manual connector requires rawText");
    }
    return {
      source: "manual",
      sourceId: `manual-${Date.now()}`,
      title: extractFirstLine(text),
      subject: options.subject ?? "Unknown",
      keyStage: options.keyStage ?? "Unknown",
      yearGroup: options.yearGroup,
      objectives: [],
      activities: [],
      resources: [],
      keywords: [],
      misconceptions: [],
      rawText: text,
      metadata: {},
    };
  },
};

function extractFirstLine(text: string): string {
  const line = text.split("\n").find((l) => l.trim().length > 0) ?? "Untitled";
  return line.trim().slice(0, 120);
}

// Register built-in
registerConnector(manualConnector);
