import { describe, test, expect } from "vitest";
import { ROOM_OUTLINES } from "../grove-house-3d-data";

/**
 * Room alignment verification tests.
 *
 * Ground plane: position [-5, -0.05, 5], size 80×56.7
 * PDF image: 3309×2339 px
 *
 * Mapping:
 *   pixel_x = ((world_x + 45) / 80) * 3309
 *   pixel_y = ((33.35 - world_z) / 56.7) * 2339
 *
 * Building wall boundaries (from dark-pixel scan of PDF):
 *   Overall: world x ~ -41 to 33, z ~ -21 to 31
 *   Block 1/2: x ~ -25.4 to 0.7, z ~ -6.6 to 0.6
 *   Block 3:   x ~ -10.7 to 8.4, z ~ 11.5 to 18.8
 *   Block 4:   x ~ -7.0 to 4.6,  z ~ 19.4 to 27.4
 *   2001 Bldg: x ~ -40.9 to -30.5, z ~ 4.2 to 21.2
 */

// Convert world coords to pixel coords
function toPixelX(worldX: number): number {
  return ((worldX + 45) / 80) * 3309;
}

function toPixelY(worldZ: number): number {
  return ((33.35 - worldZ) / 56.7) * 2339;
}

describe("Room alignment with PDF", () => {
  test("all rooms have valid coordinates within image bounds", () => {
    ROOM_OUTLINES.forEach((room) => {
      // Check all four corners are within the 3309×2339 image
      const corners = [
        { x: room.x, z: room.z },
        { x: room.x + room.w, z: room.z },
        { x: room.x, z: room.z + room.d },
        { x: room.x + room.w, z: room.z + room.d },
      ];

      corners.forEach((corner) => {
        const px = toPixelX(corner.x);
        const py = toPixelY(corner.z);
        expect(px, `${room.systemId} corner x=${corner.x} → px=${px}`).toBeGreaterThan(0);
        expect(px, `${room.systemId} corner x=${corner.x} → px=${px}`).toBeLessThan(3309);
        expect(py, `${room.systemId} corner z=${corner.z} → py=${py}`).toBeGreaterThan(0);
        expect(py, `${room.systemId} corner z=${corner.z} → py=${py}`).toBeLessThan(2339);
      });
    });
  });

  test("rooms do not overlap each other", () => {
    for (let i = 0; i < ROOM_OUTLINES.length; i++) {
      for (let j = i + 1; j < ROOM_OUTLINES.length; j++) {
        const a = ROOM_OUTLINES[i];
        const b = ROOM_OUTLINES[j];
        // Two rects overlap if they overlap on both axes
        const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
        const overlapZ = a.z < b.z + b.d && a.z + a.d > b.z;
        const overlap = overlapX && overlapZ;
        expect(overlap, `Rooms ${a.systemId} and ${b.systemId} overlap`).toBe(false);
      }
    }
  });

  test("blocks are spatially grouped (rooms in same block are near each other)", () => {
    const blocks = new Map<string, typeof ROOM_OUTLINES>();
    ROOM_OUTLINES.forEach((r) => {
      if (!blocks.has(r.block)) blocks.set(r.block, []);
      blocks.get(r.block)!.push(r);
    });

    blocks.forEach((rooms, block) => {
      if (rooms.length < 2) return;
      for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
          const dist = Math.sqrt(
            Math.pow(rooms[i].x - rooms[j].x, 2) +
              Math.pow(rooms[i].z - rooms[j].z, 2)
          );
          expect(
            dist,
            `${block}: ${rooms[i].systemId} and ${rooms[j].systemId} are ${dist.toFixed(1)} units apart`
          ).toBeLessThan(20);
        }
      }
    });
  });

  test("each room has required data model fields", () => {
    ROOM_OUTLINES.forEach((room) => {
      expect(room.systemId, `Room missing systemId`).toBeTruthy();
      expect(room.systemId).toMatch(/^[A-Z0-9]+-\d+$/);
      expect(room).toHaveProperty("pdfNumber");
      expect(room).toHaveProperty("schoolLabel");
      expect(room).toHaveProperty("label");
      expect(room).toHaveProperty("block");
    });
  });

  test("systemIds are unique", () => {
    const ids = ROOM_OUTLINES.map((r) => r.systemId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test("room dimensions are reasonable (1-15m each side)", () => {
    ROOM_OUTLINES.forEach((room) => {
      expect(room.w, `${room.systemId} width`).toBeGreaterThan(1);
      expect(room.w, `${room.systemId} width`).toBeLessThan(15);
      expect(room.d, `${room.systemId} depth`).toBeGreaterThan(1);
      expect(room.d, `${room.systemId} depth`).toBeLessThan(15);
    });
  });

  test("Block 1/2 rooms are in the lower-centre area of the PDF", () => {
    const b1b2 = ROOM_OUTLINES.filter(
      (r) => r.block === "Block 1" || r.block === "Block 2"
    );
    b1b2.forEach((room) => {
      // Block 1/2 should be in world x ~ -26 to 1, z ~ -8 to 2
      expect(room.x, `${room.systemId} x too far left`).toBeGreaterThan(-28);
      expect(room.x + room.w, `${room.systemId} x+w too far right`).toBeLessThan(2);
      expect(room.z, `${room.systemId} z too high`).toBeLessThan(3);
      expect(room.z + room.d, `${room.systemId} z+d too low`).toBeGreaterThan(-12);
    });
  });

  test("Block 3 rooms are in the centre-right area", () => {
    const b3 = ROOM_OUTLINES.filter((r) => r.block === "Block 3");
    b3.forEach((room) => {
      expect(room.x, `${room.systemId} x`).toBeGreaterThan(-15);
      expect(room.x + room.w, `${room.systemId} x+w`).toBeLessThan(10);
      expect(room.z, `${room.systemId} z`).toBeGreaterThan(8);
      expect(room.z + room.d, `${room.systemId} z+d`).toBeLessThan(22);
    });
  });

  test("Block 4 rooms are in the upper area", () => {
    const b4 = ROOM_OUTLINES.filter((r) => r.block === "Block 4");
    b4.forEach((room) => {
      expect(room.x, `${room.systemId} x`).toBeGreaterThan(-10);
      expect(room.x + room.w, `${room.systemId} x+w`).toBeLessThan(10);
      expect(room.z, `${room.systemId} z`).toBeGreaterThan(16);
    });
  });

  test("2001 Building rooms are far left", () => {
    const b2001 = ROOM_OUTLINES.filter((r) => r.block === "2001 Building");
    b2001.forEach((room) => {
      expect(room.x, `${room.systemId} x`).toBeLessThan(-28);
      expect(room.z, `${room.systemId} z`).toBeGreaterThan(0);
    });
  });

  test("2017 Building rooms are at the top", () => {
    const b2017 = ROOM_OUTLINES.filter((r) => r.block === "2017 Building");
    b2017.forEach((room) => {
      expect(room.z, `${room.systemId} z`).toBeGreaterThan(24);
    });
  });
});
