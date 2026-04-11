# School Intelligence Canvas — Phase 2.2a Spec

**Date:** 11 April 2026
**Status:** APPROVED
**Scope:** The drag-drop node canvas experience for building reports from connectors.

---

## Vision

Schools open School Intelligence and see two ways in:
1. **Quick Start** (existing card-based landing) — click a template, get a report. For users who know what they want.
2. **Open Canvas** (new) — drag connectors onto a node canvas, see how they link together, configure visualisation, generate.

The canvas is the hero power-user experience. It shows:
- **Left shelf** — all connectors the user has access to (from the registry API, filtered by visibility)
- **Centre canvas** — drop zone where nodes represent connectors. Edges auto-drawn between nodes that share join keys (URN, postcode, pupil_hash, date, year_group). The user sees the graph of their data instantly.
- **Right panel** — report settings (template, audience, time period, visualisation, format) + the Generate button that runs the real end-to-end pipeline via Guardian + Gemini
- **Output panel** — once generated, the narrative appears with source attribution and "add these for a richer report" nudges

This is Concept A from the layout mockups, extended with a Quick Start link back to the existing landing.

---

## Design Decisions

### 1. Drag-drop via `@dnd-kit`

Already installed. Familiar to any React dev. Accessible by default. Supports touch. No need to pull in react-flow or xyflow — the canvas is a single-level graph with a small number of nodes (typically 2-6), not a complex flow editor.

### 2. Nodes are positioned divs, edges are SVG

- Each node is a positioned `<div>` with `left`/`top` React state
- Edges are SVG paths drawn between node centres
- Simpler than a full diagram library
- Framer Motion handles the node appearance/position animations

### 3. Join edges auto-drawn

When a new node lands on the canvas, compute shared join keys with every other node. For each match, draw an edge labelled with the join key (e.g. `urn`, `postcode`). No manual linking — the system shows the connections that exist in the data.

### 4. Single output node

Always present on the right side of the canvas. Represents "the report you are building." Shows the currently-selected template and a Generate button. When you click Generate, it gathers all source node connector IDs and calls the relevant generator API.

### 5. For 2.2a, the only real generator is Attendance Story

Everything else is a stub that shows a "Coming soon" overlay on the Generate button. The canvas still works with them structurally — you can drag nodes, see edges, pick the template — but only Attendance Story actually calls the LLM. More templates come in 2.2b.

### 6. No persistence

The canvas state lives in React state only. If you refresh, it's gone. No need for a `canvas_layouts` table yet. We add persistence when users ask for it.

### 7. Quick Start mode

The existing `/dashboard/school-intelligence` landing page stays as the Quick Start experience. We add a prominent "Open Canvas" button on it that links to the new canvas route. The landing templates are also clickable to pre-populate the canvas with the right connectors.

---

## Technical Architecture

### Routes

- `/dashboard/school-intelligence` — existing landing (Quick Start mode) + "Open Canvas" button
- `/dashboard/school-intelligence/canvas` — new canvas experience

### Files

```
apps/platform/src/app/(dashboard)/dashboard/school-intelligence/
  page.tsx                           — existing landing (add "Open Canvas" CTA)
  canvas/
    page.tsx                         — new canvas route

apps/platform/src/components/school-intelligence/canvas/
  Canvas.tsx                         — main canvas orchestrator
  ConnectorShelf.tsx                 — left sidebar, lists connectors from registry
  CanvasBoard.tsx                    — centre drag-drop surface with nodes + edges
  ConnectorNode.tsx                  — a dropped connector, positionable
  OutputNode.tsx                     — the "report you're building" node
  EdgeLayer.tsx                      — SVG edges between nodes on shared join keys
  SettingsPanel.tsx                  — right panel with template/viz/generate
  ResultPanel.tsx                    — narrative output after Generate
  hooks/
    useCanvasState.ts                — canvas nodes + edges state
    useJoinDetection.ts              — computes edges from node join keys
  lib/
    templates.ts                     — report template definitions + generator calls
    layout.ts                        — initial node placement logic
```

### State shape

```typescript
interface CanvasNode {
  id: string;                  // unique instance id
  connectorId: string;         // from registry
  position: { x: number; y: number };
  joinKeys: JoinKey[];
}

interface CanvasEdge {
  id: string;                  // auto-generated
  sourceNodeId: string;
  targetNodeId: string;
  sharedKey: JoinKey;          // the field they join on
}

interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedTemplate: string;    // 'attendance-story' | ...
  generating: boolean;
  result: AttendanceStoryOutput | null;
}
```

### Join detection algorithm

```typescript
function detectEdges(nodes: CanvasNode[]): CanvasEdge[] {
  const edges: CanvasEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const shared = a.joinKeys.filter(k => b.joinKeys.includes(k));
      for (const key of shared) {
        edges.push({
          id: `${a.id}-${b.id}-${key}`,
          sourceNodeId: a.id,
          targetNodeId: b.id,
          sharedKey: key,
        });
      }
    }
  }
  return edges;
}
```

For 2.2a we draw every shared-key edge. If there are too many edges (noise) we can add filtering in 2.2b.

### Templates

```typescript
interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  requiredConnectorIds: string[];      // hard requirements
  optionalConnectorIds: string[];      // improve output if present
  status: 'ready' | 'coming-soon';
  generate?: (nodes: CanvasNode[], urn: number) => Promise<GenerationResult>;
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: 'attendance-story',
    title: 'Attendance Story for Governors',
    description: '...',
    requiredConnectorIds: ['dfe-attendance'],
    optionalConnectorIds: ['dfe-census', 'contextual-factors', 'live-attendance'],
    status: 'ready',
    generate: callAttendanceStoryApi,
  },
  // Others as 'coming-soon' stubs
];
```

### Generate button behaviour

1. Check the selected template's `requiredConnectorIds` — all must be in `nodes[]`
2. If yes, call `template.generate(nodes, urn)` — which POSTs to `/api/documents/attendance-story`
3. Show `generating: true` spinner on the output node
4. When the API responds, populate `result` and show the ResultPanel
5. If any required connector is missing, the button shows "Add [Connector Name] first" with a hint to drag it from the shelf

---

## Out of Scope

- Saving canvas layouts (future)
- Cross-connector join execution (just visualisation for now — the LLM does the analysis)
- Multiple simultaneous output nodes (one output per canvas)
- Manual edge creation/deletion (edges are computed from join keys only)
- Panning and zoom on the canvas (nodes stay in a fixed viewport)
- Inline editing of the generated document (read-only for now)
- Real-time collaboration
- Keyboard shortcuts (drag-only for now)

---

## Success Criteria

1. ✅ `/dashboard/school-intelligence/canvas` renders three columns: shelf / canvas / settings
2. ✅ Connector shelf loads from `/api/connectors/registry?consumer=school-intelligence`
3. ✅ User can drag a connector from the shelf onto the canvas
4. ✅ A node appears in the canvas with the connector's name, icon, and join keys
5. ✅ User can drag a node around the canvas after placing it
6. ✅ When two nodes share a join key, an edge is drawn between them with the key label
7. ✅ Output node is always present and shows the selected template
8. ✅ Clicking Generate with DfE Attendance on the canvas calls the real API and shows a real narrative
9. ✅ Quick Start landing has an "Open Canvas" button that navigates to the canvas
10. ✅ Build passes, no new test failures
