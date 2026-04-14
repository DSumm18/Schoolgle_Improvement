import sharp from "sharp";

import {
  buildExtractionResult,
  getRoomCentre,
  normaliseBounds,
  type PathfinderAssetDraft,
  type PathfinderBounds,
  type PathfinderExtractionResult,
  type PathfinderPoint,
  type PathfinderRoomDraft,
  type PathfinderRoomType,
  type PathfinderRouteDraft,
} from "./prototype";

interface RasterComponent {
  id: number;
  area: number;
  redPixels: number;
  bounds: PathfinderBounds;
  fillRatio: number;
}

const PLAN_CROP = {
  left: 80,
  top: 80,
  right: 2700,
  bottom: 2200,
};

const WALL_THRESHOLD = 105;
const WALL_DILATION_RADIUS = 4;

function boundsToPolygon(bounds: PathfinderBounds): PathfinderPoint[] {
  return [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ];
}

function classifySpace(component: RasterComponent): PathfinderRoomType {
  const { width, height } = component.bounds;
  const longest = Math.max(width, height);
  const shortest = Math.max(Math.min(width, height), 1);
  const aspect = longest / shortest;
  const redDensity = component.redPixels / Math.max(component.area, 1);

  if (aspect >= 3.2 || component.fillRatio < 0.5 || redDensity > 0.018) {
    return "corridor";
  }
  if (component.area > 120000 && component.fillRatio > 0.75) {
    return "hall";
  }
  if (component.area < 5200 || (width < 85 && height < 95)) {
    return "storage";
  }
  if (width < 90 || height < 70) {
    return "toilet";
  }
  return "classroom";
}

function inferBlock(bounds: PathfinderBounds): string {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;

  if (cx < 610 && cy > 900) return "West wing";
  if (cx < 1210 && cy > 1120) return cy > 1500 ? "Block 1 / 2 south" : "Block 1 / 2";
  if (cx < 1865 && cy < 1040) return "Block 4";
  if (cx > 1850 && cy < 930) return "Block 6 / Block 3";
  if (cx > 1760) return "Block 3";
  return "Central";
}

function componentToRoom(component: RasterComponent, index: number): PathfinderRoomDraft {
  const bounds = normaliseBounds(component.bounds);
  const type = classifySpace(component);
  const code = `RS-${String(index + 1).padStart(2, "0")}`;

  return {
    id: `raster-${String(index + 1).padStart(2, "0")}`,
    sourceId: `component-${component.id}`,
    label: type === "corridor" ? `Corridor / route space ${index + 1}` : `Detected space ${index + 1}`,
    roomCode: code,
    block: inferBlock(bounds),
    type,
    polygon: boundsToPolygon(bounds),
    bounds,
    confidence: type === "corridor" ? 0.66 : 0.72,
    needsReview: true,
    notes: `Raster wall segmentation from the source PNG. Area ${component.area}px, fill ${Math.round(
      component.fillRatio * 100,
    )}%.`,
  };
}

function getRoomDistanceToPoint(room: PathfinderRoomDraft, point: PathfinderPoint): number {
  const centre = getRoomCentre(room);
  return Math.hypot(centre.x - point.x, centre.y - point.y);
}

function findNearestRoom(rooms: PathfinderRoomDraft[], point: PathfinderPoint): PathfinderRoomDraft | undefined {
  return rooms
    .map((room) => ({ room, distance: getRoomDistanceToPoint(room, point) }))
    .sort((a, b) => a.distance - b.distance)[0]?.room;
}

function applyKnownPrototypeHints(rooms: PathfinderRoomDraft[]): PathfinderRoomDraft[] {
  const hints: Array<{
    point: PathfinderPoint;
    label: string;
    type: PathfinderRoomType;
    confidence: number;
    note: string;
  }> = [
    {
      point: { x: 1990, y: 1580 },
      label: "Reception / main entrance candidate",
      type: "entrance",
      confidence: 0.74,
      note: "Named from its proximity to the visible MAIN ENTRANCE label and lower central lobby area.",
    },
    {
      point: { x: 1670, y: 1510 },
      label: "Headteacher / admin office candidate",
      type: "headteacher",
      confidence: 0.68,
      note: "Marked as a critical school hub candidate near the main entrance spine. Confirm whether this is the headteacher office, school office, or another admin room.",
    },
    {
      point: { x: 1125, y: 1490 },
      label: "Medical room candidate",
      type: "medical",
      confidence: 0.66,
      note: "Marked as a critical school hub candidate. Confirm with the school because the raster plan does not reliably expose the room label.",
    },
    {
      point: { x: 1095, y: 1375 },
      label: "School office / admin candidate",
      type: "office",
      confidence: 0.68,
      note: "Likely admin-side space near the main entrance spine. Confirm against the drawing labels.",
    },
    {
      point: { x: 1665, y: 760 },
      label: "Large hall / shared space candidate",
      type: "hall",
      confidence: 0.7,
      note: "Large enclosed region inferred as a likely hall or shared area. Confirm against the room register.",
    },
  ];
  const usedRoomIds = new Set<string>();
  const replacements = new Map<string, PathfinderRoomDraft>();

  for (const hint of hints) {
    const room = rooms
      .filter((candidate) => !usedRoomIds.has(candidate.id))
      .map((candidate) => ({ candidate, distance: getRoomDistanceToPoint(candidate, hint.point) }))
      .sort((a, b) => a.distance - b.distance)[0]?.candidate;

    if (!room) continue;
    usedRoomIds.add(room.id);
    replacements.set(room.id, {
      ...room,
      label: hint.label,
      type: hint.type,
      confidence: Math.max(room.confidence, hint.confidence),
      notes: `${room.notes} ${hint.note}`,
    });
  }

  return rooms.map((room) => replacements.get(room.id) ?? room);
}

function isWallPixel(data: Buffer, index: number): boolean {
  return data[index] < WALL_THRESHOLD && data[index + 1] < WALL_THRESHOLD && data[index + 2] < WALL_THRESHOLD;
}

function isRedRoutePixel(data: Buffer, index: number): boolean {
  return data[index] > 160 && data[index + 1] < 95 && data[index + 2] < 95;
}

function createBlockedMask(data: Buffer, width: number, height: number): Uint8Array {
  const blocked = new Uint8Array(width * height);

  for (let y = PLAN_CROP.top; y < Math.min(PLAN_CROP.bottom, height); y += 1) {
    for (let x = PLAN_CROP.left; x < Math.min(PLAN_CROP.right, width); x += 1) {
      const pixelIndex = (y * width + x) * 3;
      if (!isWallPixel(data, pixelIndex)) continue;

      for (let dy = -WALL_DILATION_RADIUS; dy <= WALL_DILATION_RADIUS; dy += 1) {
        const yy = y + dy;
        if (yy < PLAN_CROP.top || yy >= PLAN_CROP.bottom) continue;

        for (let dx = -WALL_DILATION_RADIUS; dx <= WALL_DILATION_RADIUS; dx += 1) {
          const xx = x + dx;
          if (xx < PLAN_CROP.left || xx >= PLAN_CROP.right) continue;
          blocked[yy * width + xx] = 1;
        }
      }
    }
  }

  return blocked;
}

function extractComponents(data: Buffer, width: number, height: number): RasterComponent[] {
  const blocked = createBlockedMask(data, width, height);
  const seen = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  const components: RasterComponent[] = [];
  let nextComponentId = 1;

  const cropRight = Math.min(PLAN_CROP.right, width);
  const cropBottom = Math.min(PLAN_CROP.bottom, height);

  for (let y = PLAN_CROP.top; y < cropBottom; y += 2) {
    for (let x = PLAN_CROP.left; x < cropRight; x += 2) {
      const startIndex = y * width + x;
      if (blocked[startIndex] || seen[startIndex]) continue;

      let head = 0;
      let tail = 0;
      let area = 0;
      let redPixels = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let touchesCropEdge = false;

      queueX[tail] = x;
      queueY[tail] = y;
      tail += 1;
      seen[startIndex] = 1;

      while (head < tail) {
        const cx = queueX[head];
        const cy = queueY[head];
        head += 1;
        area += 1;

        const pixelIndex = (cy * width + cx) * 3;
        if (isRedRoutePixel(data, pixelIndex)) redPixels += 1;

        if (
          cx <= PLAN_CROP.left + 2 ||
          cx >= cropRight - 3 ||
          cy <= PLAN_CROP.top + 2 ||
          cy >= cropBottom - 3
        ) {
          touchesCropEdge = true;
        }
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        const neighbours = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];

        for (const [nx, ny] of neighbours) {
          if (nx < PLAN_CROP.left || nx >= cropRight || ny < PLAN_CROP.top || ny >= cropBottom) {
            continue;
          }
          const neighbourIndex = ny * width + nx;
          if (seen[neighbourIndex] || blocked[neighbourIndex]) continue;
          seen[neighbourIndex] = 1;
          queueX[tail] = nx;
          queueY[tail] = ny;
          tail += 1;
        }
      }

      const componentWidth = maxX - minX + 1;
      const componentHeight = maxY - minY + 1;
      const fillRatio = area / (componentWidth * componentHeight);

      if (
        !touchesCropEdge &&
        area > 1500 &&
        componentWidth > 28 &&
        componentHeight > 28 &&
        fillRatio > 0.12 &&
        fillRatio < 0.98
      ) {
        components.push({
          id: nextComponentId,
          area,
          redPixels,
          bounds: {
            x: minX,
            y: minY,
            width: componentWidth,
            height: componentHeight,
          },
          fillRatio,
        });
        nextComponentId += 1;
      }
    }
  }

  return components.sort((a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x);
}

function axisOverlap(startA: number, endA: number, startB: number, endB: number): number {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
}

function gapBetween(a: PathfinderBounds, b: PathfinderBounds): number {
  const xGap = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width));
  const yGap = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height));
  return Math.hypot(xGap, yGap);
}

function getLinkPoint(a: PathfinderRoomDraft, b: PathfinderRoomDraft): PathfinderPoint {
  const aCentre = getRoomCentre(a);
  const bCentre = getRoomCentre(b);
  const verticalOverlap = axisOverlap(
    a.bounds.y,
    a.bounds.y + a.bounds.height,
    b.bounds.y,
    b.bounds.y + b.bounds.height,
  );
  const horizontalOverlap = axisOverlap(
    a.bounds.x,
    a.bounds.x + a.bounds.width,
    b.bounds.x,
    b.bounds.x + b.bounds.width,
  );

  if (verticalOverlap >= horizontalOverlap) {
    return {
      x:
        aCentre.x < bCentre.x
          ? Math.round((a.bounds.x + a.bounds.width + b.bounds.x) / 2)
          : Math.round((b.bounds.x + b.bounds.width + a.bounds.x) / 2),
      y: Math.round((Math.max(a.bounds.y, b.bounds.y) + Math.min(a.bounds.y + a.bounds.height, b.bounds.y + b.bounds.height)) / 2),
    };
  }

  return {
    x: Math.round((Math.max(a.bounds.x, b.bounds.x) + Math.min(a.bounds.x + a.bounds.width, b.bounds.x + b.bounds.width)) / 2),
    y:
      aCentre.y < bCentre.y
        ? Math.round((a.bounds.y + a.bounds.height + b.bounds.y) / 2)
        : Math.round((b.bounds.y + b.bounds.height + a.bounds.y) / 2),
  };
}

function createRouteAndDoorDrafts(rooms: PathfinderRoomDraft[]): {
  assets: PathfinderAssetDraft[];
  routes: PathfinderRouteDraft[];
} {
  const corridors = rooms.filter((room) => room.type === "corridor");
  const assets: PathfinderAssetDraft[] = [];
  const routes: PathfinderRouteDraft[] = [];
  const linkedPairs = new Set<string>();

  function addLink(from: PathfinderRoomDraft, to: PathfinderRoomDraft, confidence: number) {
    const key = [from.id, to.id].sort().join(":");
    if (linkedPairs.has(key)) return;
    linkedPairs.add(key);

    const doorPoint = getLinkPoint(from, to);
    const fromCentre = getRoomCentre(from);
    const toCentre = getRoomCentre(to);

    assets.push({
      id: `door-${String(assets.length + 1).padStart(3, "0")}`,
      label: `Door / opening candidate ${assets.length + 1}`,
      type: "door",
      x: doorPoint.x,
      y: doorPoint.y,
      linkedRoomId: from.type === "corridor" ? to.id : from.id,
      confidence,
    });
    routes.push({
      id: `route-${from.id}-${to.id}`,
      from: from.id,
      to: to.id,
      points: [fromCentre, doorPoint, toCentre],
      confidence,
    });
  }

  for (const corridor of corridors) {
    const nearby = rooms
      .filter((room) => room.id !== corridor.id)
      .map((room) => ({ room, gap: gapBetween(corridor.bounds, room.bounds) }))
      .filter(({ gap }) => gap <= 95)
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 8);

    for (const { room, gap } of nearby) {
      addLink(corridor, room, gap <= 20 ? 0.68 : 0.52);
    }
  }

  if (corridors.length > 1) {
    for (const corridor of corridors) {
      const centre = getRoomCentre(corridor);
      const nearestCorridor = corridors
        .filter((other) => other.id !== corridor.id)
        .map((other) => ({ other, distance: Math.hypot(getRoomCentre(other).x - centre.x, getRoomCentre(other).y - centre.y) }))
        .sort((a, b) => a.distance - b.distance)[0];

      if (nearestCorridor && nearestCorridor.distance <= 520) {
        addLink(corridor, nearestCorridor.other, 0.48);
      }
    }
  }

  return {
    assets: assets.slice(0, 140),
    routes: routes.slice(0, 140),
  };
}

export async function buildRasterPathfinderBaseline(): Promise<PathfinderExtractionResult> {
  const imagePath = "public/site-plans/grove-house-ground-floor.png";
  const { data, info } = await sharp(imagePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const components = extractComponents(data, info.width, info.height);
  const rooms = applyKnownPrototypeHints(components.map(componentToRoom));
  const { assets, routes } = createRouteAndDoorDrafts(rooms);
  const receptionAnchorRoom = findNearestRoom(rooms, { x: 1990, y: 1580 });
  const receptionAnchorCentre = receptionAnchorRoom ? getRoomCentre(receptionAnchorRoom) : { x: 1990, y: 1580 };
  const eastEntranceAnchorRoom = findNearestRoom(rooms, { x: 2550, y: 1450 });
  const eastEntranceAnchorCentre = eastEntranceAnchorRoom ? getRoomCentre(eastEntranceAnchorRoom) : { x: 2550, y: 1450 };

  return buildExtractionResult({
    source: "raster-wall-segmentation",
    rooms,
    assets: [
      ...assets,
      {
        id: "qr-main-entrance",
        label: "QR scan anchor - main entrance",
        type: "qr_anchor",
        x: receptionAnchorCentre.x,
        y: receptionAnchorCentre.y,
        linkedRoomId: receptionAnchorRoom?.id,
        confidence: 0.74,
      },
      {
        id: "qr-east-entrance",
        label: "QR scan anchor - east entrance",
        type: "qr_anchor",
        x: eastEntranceAnchorCentre.x,
        y: eastEntranceAnchorCentre.y,
        linkedRoomId: eastEntranceAnchorRoom?.id,
        confidence: 0.74,
      },
    ],
    routes,
    warnings: [
      "Raster wall segmentation is a draft generated from the source PNG, not a validated life-safety or accessibility plan.",
      "Corridors and door candidates are now modelled as first-class review items, but labels and room types still need human confirmation.",
      "The next accuracy step is vector PDF/CAD import or a validation screen where the site team accepts, splits, merges, and names each detected space.",
    ],
  });
}
