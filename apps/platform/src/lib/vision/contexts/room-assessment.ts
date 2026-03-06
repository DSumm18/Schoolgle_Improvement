/**
 * Vision Context: Universal Room Assessment
 *
 * The default context for a room spin. Analyses fire safety, damage,
 * assets, COSHH, classroom environment, safeguarding, and H&S
 * simultaneously from a single image or set of keyframes.
 */

import type {
  VisionContext,
  VisionResult,
  VisionMetadata,
  VisionItem,
  ComplianceIssue,
  Severity,
} from "../types";

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const ROOM_ASSESSMENT_PROMPT = `You are an expert UK school premises inspector. Analyse this image of a school room and return a JSON assessment.

Assess ALL of the following simultaneously:

FIRE SAFETY:
- Fire exits: clear, signed, accessible? Any obstructions?
- Fire doors: self-closers intact? Not wedged open?
- Fire extinguishers: present, in location, service date visible?
- Emergency lighting: visible?
- Fire action notices: displayed?

GENERAL SAFETY:
- Trip hazards: trailing cables, wet floors, damaged flooring?
- Broken or damaged furniture or fixtures?
- Water damage, damp, mould?
- Exposed wiring or damaged electrical fittings?
- Windows: intact, secure?

ASSET VERIFICATION:
- List all identifiable equipment and assets visible (projector, whiteboard, extinguisher, first aid kit, clock, display screens, etc.)
- Note their apparent condition: good, fair, poor, or damaged

SAFEGUARDING:
- Sight lines clear? No hidden areas or blind spots?
- Room layout appropriate for supervision?

CLASSROOM ENVIRONMENT (if applicable):
- Display boards: current, relevant, engaging?
- Furniture layout: appropriate for learning?
- General cleanliness and tidiness?

COSHH (if chemicals or hazardous materials visible):
- Identify any chemical products visible
- Are they stored appropriately (locked cupboard, ventilated)?
- Any hazard symbols visible?

For each issue found, assign severity: critical, high, medium, or low.

Return ONLY a JSON object with this exact structure:
{
  "room_description": "Brief description of the room type and state",
  "overall_score": 0.0 to 1.0,
  "items": [
    {
      "name": "Item name",
      "category": "fire_safety|damage|asset_present|asset_missing|trip_hazard|electrical|coshh|safeguarding|classroom_layout|display_board|building_condition|maintenance",
      "confidence": 0.0 to 1.0,
      "condition": "good|fair|poor|damaged|missing",
      "notes": "Any relevant detail"
    }
  ],
  "issues": [
    {
      "description": "Clear description of the issue",
      "severity": "critical|high|medium|low",
      "domain": "fire_safety|h_and_s|safeguarding|coshh|building_condition|electrical|teaching_learning",
      "evidence": "What was observed"
    }
  ]
}`;

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

interface RawRoomResponse {
  room_description?: string;
  overall_score?: number;
  items?: Array<{
    name?: string;
    category?: string;
    confidence?: number;
    condition?: string;
    notes?: string;
  }>;
  issues?: Array<{
    description?: string;
    severity?: string;
    domain?: string;
    evidence?: string;
  }>;
}

function parseRoomResponse(
  raw: unknown,
  metadata: VisionMetadata,
): VisionResult {
  const data = raw as RawRoomResponse;

  const items: VisionItem[] = (data.items ?? []).map((item, i) => ({
    id: `item-${i}-${Date.now()}`,
    name: item.name ?? "Unknown item",
    category: item.category ?? "asset_present",
    confidence: item.confidence ?? 0.5,
    attributes: {
      condition: item.condition ?? "unknown",
      notes: item.notes,
    },
  }));

  const validSeverities = new Set(["critical", "high", "medium", "low"]);

  const issues: ComplianceIssue[] = (data.issues ?? []).map((issue, i) => ({
    id: `issue-${i}-${Date.now()}`,
    description: issue.description ?? "Unknown issue",
    severity: (validSeverities.has(issue.severity ?? "")
      ? issue.severity
      : "medium") as Severity,
    domain: issue.domain ?? "h_and_s",
    evidence: issue.evidence,
  }));

  const score = data.overall_score ?? (issues.length === 0 ? 1.0 : 0.5);

  return {
    contextType: "room-assessment",
    confidence: score,
    items,
    compliance: {
      score,
      issues,
      passed:
        issues.filter((i) => i.severity === "critical" || i.severity === "high")
          .length === 0,
    },
    actions: issues
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .map((issue) => ({
        type: "create_action",
        description: issue.description,
        priority: issue.severity,
        module: issue.domain,
      })),
    dispatches: [], // Filled by dispatcher
    summary: data.room_description ?? "Room assessment complete.",
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Export context factory
// ---------------------------------------------------------------------------

export function getRoomAssessmentContext(): VisionContext {
  return {
    type: "room-assessment",
    systemPrompt: ROOM_ASSESSMENT_PROMPT,
    parseResponse: parseRoomResponse,
  };
}
