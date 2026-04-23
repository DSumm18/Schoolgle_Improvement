# 3D Building Visualization System

**Stunning interactive 3D building models for school estates management**

---

## Overview

A cutting-edge 3D visualization system that transforms 2D floor plans into interactive 3D building models. Schools can upload their CAD drawings or PDF floor plans, and AI automatically detects rooms to create a navigable 3D model with:

- **Interactive 3D Viewer** - Drag to rotate, scroll to zoom, click rooms to explore
- **Room Drill-Down** - Click any room to see interior photos, videos, and asset details
- **Data Overlays** - Toggle views for fire safety, assets, issues, evacuation routes
- **Animated Evacuation** - Visualize emergency routes with animated pathfinding
- **Asset Tracking** - See fire extinguishers, boilers, and equipment in 3D space

---

## Components

### Building3DViewer

The main 3D canvas component using React Three Fiber.

```tsx
import { Building3DViewer } from "@/components/estates-compliance/building-3d-viewer";

<Building3DViewer
  data={buildingData}
  onRoomSelect={(room) => console.log("Selected:", room)}
/>
```

**Props:**
- `data: Building3DData` - The building model with rooms, floors, etc.
- `onRoomSelect?: (room: Room3D | null) => void` - Callback when room is clicked

### RoomDetailPanel

Slide-out panel showing room details with tabs for Overview, Media, Assets, Issues.

```tsx
import { RoomDetailPanel } from "@/components/estates-compliance/building-3d-viewer";

<RoomDetailPanel
  room={selectedRoom}
  onClose={() => setSelectedRoom(null)}
  media={roomMedia}
  assets={roomAssets}
  issues={roomIssues}
  evacuationRoute={evacuationRoute}
/>
```

### BuildingOnboardingUpload

Upload component for onboarding - accepts PDF/image files and shows AI detection progress.

```tsx
import { BuildingOnboardingUpload } from "@/components/estates-compliance/building-3d-viewer";

<BuildingOnboardingUpload />
```

---

## Data Structure

```typescript
interface Building3DData {
  id: string;
  name: string;
  buildings: Building3D[];
  groundPlane?: { width: number; depth: number };
}

interface Building3D {
  id: string;
  name: string;
  position: [x, y, z];
  floors: Floor3D[];
}

interface Floor3D {
  id: string;
  label: string;
  level: number; // -1 = basement, 0 = ground, 1 = first
  height: number; // Floor-to-floor in meters
  rooms: Room3D[];
}

interface Room3D {
  id: string;
  name: string;
  type: "classroom" | "hall" | "office" | "kitchen" | "toilet" | ...
  position: [x, y, z];
  size: [width, height, depth];
  color: string;
  hasFireExit?: boolean;
  assets?: AssetOverlay[];
  issues?: number;
  evacuationRoute?: EvacuationRoute3D;
}
```

---

## API Endpoints

### POST /api/estates/building-detect

Upload a floor plan and get AI-detected rooms back.

```typescript
const response = await fetch("/api/estates/building-detect", {
  method: "POST",
  body: JSON.stringify({
    fileUrl: "https://...",
    fileName: "floor-plan.pdf",
    buildingName: "Main Building",
    floorLevel: 0
  })
});

const { buildingData, detection } = await response.json();
```

### GET /api/estates/building-detect

List all saved floor plans for the organization.

### PATCH /api/estates/building-detect

Update/correct detected building data.

### DELETE /api/estates/building-detect?id={id}

Delete a floor plan.

---

## Pages

- `/dashboard/estates/building-3d` - Full-screen 3D viewer demo

---

## Features by Overlay Mode

| Mode | Shows |
|------|-------|
| **Fire Safety** | Fire extinguishers, alarms, exits, evacuation routes |
| **Assets** | Boilers, electrical panels, first aid kits |
| **Issues** | Open maintenance tickets, compliance warnings |
| **Evacuation** | Animated paths to nearest exits with distance |

---

## Tech Stack

- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Helpers (OrbitControls, Text, Environment, etc.)
- **@react-three/postprocessing** - Bloom, depth of field effects (future)
- **three** - 3D engine
- **framer-motion** - UI animations

---

## Usage Example

```tsx
"use client";

import { Building3DViewer, Building3DData } from "@/components/estates-compliance/building-3d-viewer";

const myBuilding: Building3DData = {
  id: "my-school",
  name: "My Primary School",
  buildings: [
    {
      id: "main",
      name: "Main Building",
      position: [0, 0, 0],
      floors: [
        {
          id: "ground",
          label: "Ground Floor",
          level: 0,
          height: 3.5,
          rooms: [
            {
              id: "rm-1",
              name: "Classroom 1A",
              type: "classroom",
              position: [0, 0, 0],
              size: [6, 2.8, 5],
              color: "#bfdbfe",
              hasFireExit: true,
            }
          ]
        }
      ]
    }
  ]
};

export default function MyBuildingViewer() {
  return (
    <div className="h-screen">
      <Building3DViewer data={myBuilding} />
    </div>
  );
}
```

---

## AI Room Detection

The vision model analyzes floor plans and extracts:
- Room boundaries (polygons)
- Room labels (OCR)
- Room types (classification)
- Door positions
- Fire exits
- Relative scale/coordinates

**Models used:**
- `google/gemini-2.0-flash-exp` - Fast, accurate room detection

---

## Future Enhancements

- [ ] Multi-floor stacking view
- [ ] First-person walkthrough mode
- [ ] VR/AR export
- [ ] Real-time sensor data overlay
- [ ] Heat mapping (temperature, occupancy)
- [ ] Asset QR code scanning
- [ ] Mobile AR view

---

**Status:** ✅ Core Implementation Complete
**Date:** 2026-03-23
