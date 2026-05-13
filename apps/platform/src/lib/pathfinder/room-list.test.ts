import { describe, expect, it } from "vitest";

import {
  applyRoomListValidationToExtraction,
  extractRoomListFromText,
  matchDetectedRoomsToRoomList,
} from "./room-list";
import type { PathfinderExtractionResult } from "./prototype";

const baseExtraction: PathfinderExtractionResult = {
  source: "vision-ai",
  generatedAt: "2026-04-23T12:00:00.000Z",
  image: {
    src: "/uploaded-plan.png",
    width: 1200,
    height: 800,
    title: "Uploaded plan",
  },
  rooms: [
    {
      id: "room-1",
      label: "Reception",
      roomCode: "G01",
      type: "office",
      polygon: [],
      bounds: { x: 10, y: 10, width: 120, height: 80 },
      confidence: 0.72,
      needsReview: true,
    },
    {
      id: "room-2",
      label: "Year 2 classroom",
      roomCode: "G02",
      type: "classroom",
      polygon: [],
      bounds: { x: 160, y: 10, width: 120, height: 80 },
      confidence: 0.66,
      needsReview: true,
    },
  ],
  assets: [],
  routes: [],
  tickets: [],
  supportProfiles: [],
  evacuationZones: [],
  musterPoints: [],
  siteContext: {
    center: { lat: 0, lon: 0 },
    zoom: 18,
    provider: "openstreetmap",
    tileTemplate: "",
    attribution: "",
    sourceUrl: "",
    features: [],
    warnings: [],
  },
  warnings: [],
  metrics: {
    roomCount: 2,
    corridorCount: 0,
    reviewCount: 2,
    averageConfidence: 0.69,
    assetCount: 0,
    doorCandidateCount: 0,
  },
};

describe("Pathfinder room-list validation", () => {
  it("extracts likely room entries from a spreadsheet-style text export", () => {
    const entries = extractRoomListFromText(
      [
        "Room Code,Room Name,Floor",
        "G01,Reception,Ground",
        "G02,Year 2 Classroom,Ground",
        "G03,Medical Room,Ground",
      ].join("\n"),
    );

    expect(entries).toEqual([
      expect.objectContaining({ code: "G01", name: "Reception" }),
      expect.objectContaining({ code: "G02", name: "Year 2 Classroom" }),
      expect.objectContaining({ code: "G03", name: "Medical Room" }),
    ]);
  });

  it("compares extracted rooms with the uploaded room list", () => {
    const roomList = extractRoomListFromText("G01,Reception\nG02,Year 2 Classroom\nG03,Medical Room");
    const summary = matchDetectedRoomsToRoomList(baseExtraction.rooms, roomList);

    expect(summary.referenceRoomCount).toBe(3);
    expect(summary.detectedRoomCount).toBe(2);
    expect(summary.matchedCount).toBe(2);
    expect(summary.missingFromPlan).toEqual([expect.objectContaining({ code: "G03" })]);
    expect(summary.unmatchedDetectedRooms).toEqual([]);
  });

  it("adds validation guidance to the extraction result without approving rooms", () => {
    const roomList = extractRoomListFromText("G01,Reception\nG02,Year 2 Classroom\nG03,Medical Room");
    const result = applyRoomListValidationToExtraction(baseExtraction, roomList);

    expect(result.roomListValidation).toEqual(
      expect.objectContaining({
        referenceRoomCount: 3,
        detectedRoomCount: 2,
        matchedCount: 2,
      }),
    );
    expect(result.warnings).toContain(
      "Room-list check: 2 of 3 reference rooms matched the draft plan. Review 1 listed room that was not found.",
    );
    expect(result.rooms.every((room) => room.needsReview)).toBe(true);
  });
});
