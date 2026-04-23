/**
 * Building 3D Viewer Components
 *
 * A stunning 3D visualization system for school buildings with:
 * - Interactive 3D building viewer with React Three Fiber
 * - Room drill-down with media galleries
 * - Asset overlays (fire extinguishers, boilers, etc.)
 * - Animated evacuation routes
 * - AI-powered room detection from floor plans
 */

export { default as Building3DViewer } from "./Building3DViewer";
export {
  default as RoomDetailPanel,
} from "./RoomDetailPanel";

// Re-export types from Building3DViewer
export type {
  Building3DData,
  Building3D,
  Floor3D,
  Room3D,
  RoomType3D,
  AssetOverlay,
  EvacuationRoute3D,
  ViewMode,
  OverlayMode,
} from "./Building3DViewer";

export type { RoomMedia, RoomAssetDetail, RoomIssue } from "./RoomDetailPanel";
