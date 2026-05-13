import type {
  PathfinderExtractionResult,
  PathfinderRoomDraft,
  PathfinderRoomListEntry,
  PathfinderRoomListValidationSummary,
} from "./prototype";

const CODE_HEADER_RE = /\b(room\s*)?(code|number|no\.?|ref|id)\b/i;
const NAME_HEADER_RE = /\b(room|space|location|area|name|description)\b/i;
const ROOM_WORD_RE = /\b(room|classroom|office|hall|reception|medical|toilet|wc|kitchen|store|storage|plant|library|corridor)\b/i;

function cleanCell(value: string): string {
  return value.replace(/^["']|["']$/g, "").replace(/\s+/g, " ").trim();
}

function splitLine(line: string): string[] {
  const delimiter = line.includes("\t") ? "\t" : line.includes(",") ? "," : /\s{2,}/;
  return line
    .split(delimiter)
    .map(cleanCell)
    .filter(Boolean);
}

function normalise(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(room|classroom|space|area)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseCode(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function looksLikeRoomCode(value: string): boolean {
  const cleaned = value.trim();
  return /^(room\s*)?[a-z]?\d{1,4}[a-z]?$/i.test(cleaned) || /^[a-z]\.?\d{1,3}$/i.test(cleaned);
}

function looksLikeRoomName(value: string): boolean {
  const cleaned = value.trim();
  if (cleaned.length < 3) return false;
  if (/^(floor|block|level|total|notes?)$/i.test(cleaned)) return false;
  return ROOM_WORD_RE.test(cleaned) || /[a-z]{3,}/i.test(cleaned);
}

function uniqueEntries(entries: PathfinderRoomListEntry[]): PathfinderRoomListEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${normaliseCode(entry.code)}:${normalise(entry.name)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractRoomListFromText(
  text: string,
  source: PathfinderRoomListEntry["source"] = "spreadsheet",
): PathfinderRoomListEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 500);

  if (lines.length === 0) return [];

  const headerCells = splitLine(lines[0]);
  const codeIndex = headerCells.findIndex((cell) => CODE_HEADER_RE.test(cell));
  const nameIndex = headerCells.findIndex((cell, index) => index !== codeIndex && NAME_HEADER_RE.test(cell));
  const hasHeader = codeIndex >= 0 || nameIndex >= 0;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const entries = dataLines.flatMap((line, index): PathfinderRoomListEntry[] => {
    const cells = splitLine(line);
    if (cells.length === 0) return [];

    if (hasHeader) {
      const code = codeIndex >= 0 ? cells[codeIndex] : undefined;
      const nameCandidate =
        nameIndex >= 0
          ? cells[nameIndex]
          : cells.find((cell, cellIndex) => cellIndex !== codeIndex && looksLikeRoomName(cell));
      if (!nameCandidate || !looksLikeRoomName(nameCandidate)) return [];
      return [
        {
          code: code && looksLikeRoomCode(code) ? code.toUpperCase() : undefined,
          name: nameCandidate,
          source,
          sourceLine: index + (hasHeader ? 2 : 1),
        },
      ];
    }

    const code = cells.find(looksLikeRoomCode);
    const name = cells.find((cell) => cell !== code && looksLikeRoomName(cell)) ?? (cells.length === 1 ? cells[0] : undefined);
    if (!name || !looksLikeRoomName(name)) return [];
    return [
      {
        code: code ? code.toUpperCase() : undefined,
        name,
        source,
        sourceLine: index + 1,
      },
    ];
  });

  return uniqueEntries(entries).slice(0, 300);
}

function scoreMatch(room: PathfinderRoomDraft, reference: PathfinderRoomListEntry) {
  const referenceCode = normaliseCode(reference.code);
  const roomCode = normaliseCode(room.roomCode);
  if (referenceCode && roomCode && referenceCode === roomCode) {
    return { confidence: 0.98, reason: "code" as const };
  }

  const referenceName = normalise(reference.name);
  const roomName = normalise(`${room.roomCode ?? ""} ${room.label}`);
  if (!referenceName || !roomName) {
    return { confidence: 0, reason: "unmatched" as const };
  }
  if (referenceName === roomName) {
    return { confidence: 0.92, reason: "name" as const };
  }
  if (roomName.includes(referenceName) || referenceName.includes(roomName)) {
    return { confidence: 0.74, reason: "partial" as const };
  }

  const referenceTokens = new Set(referenceName.split(" ").filter((token) => token.length > 2));
  const roomTokens = new Set(roomName.split(" ").filter((token) => token.length > 2));
  const overlap = [...referenceTokens].filter((token) => roomTokens.has(token)).length;
  if (overlap > 0 && overlap >= Math.min(referenceTokens.size, roomTokens.size)) {
    return { confidence: 0.68, reason: "partial" as const };
  }
  return { confidence: 0, reason: "unmatched" as const };
}

export function matchDetectedRoomsToRoomList(
  rooms: PathfinderRoomDraft[],
  roomList: PathfinderRoomListEntry[],
): PathfinderRoomListValidationSummary {
  const usedRoomIds = new Set<string>();
  const matches = roomList.map((reference) => {
    const best = rooms
      .filter((room) => !usedRoomIds.has(room.id))
      .map((room) => ({ room, ...scoreMatch(room, reference) }))
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (!best || best.confidence < 0.6) {
      return { reference, confidence: 0, reason: "unmatched" as const };
    }

    usedRoomIds.add(best.room.id);
    return {
      reference,
      roomId: best.room.id,
      roomLabel: best.room.label,
      confidence: best.confidence,
      reason: best.reason,
    };
  });

  return {
    referenceRoomCount: roomList.length,
    detectedRoomCount: rooms.length,
    matchedCount: matches.filter((match) => Boolean(match.roomId)).length,
    missingFromPlan: matches
      .filter((match) => !match.roomId)
      .map((match) => match.reference),
    unmatchedDetectedRooms: rooms
      .filter((room) => !usedRoomIds.has(room.id))
      .map((room) => ({ id: room.id, label: room.label, roomCode: room.roomCode })),
    matches,
  };
}

export function applyRoomListValidationToExtraction(
  extraction: PathfinderExtractionResult,
  roomList: PathfinderRoomListEntry[],
): PathfinderExtractionResult {
  if (roomList.length === 0) return extraction;

  const roomListValidation = matchDetectedRoomsToRoomList(extraction.rooms, roomList);
  const missingCount = roomListValidation.missingFromPlan.length;
  const warning =
    `Room-list check: ${roomListValidation.matchedCount} of ${roomListValidation.referenceRoomCount} reference rooms matched the draft plan.` +
    (missingCount > 0
      ? ` Review ${missingCount} listed room${missingCount === 1 ? "" : "s"} that ${missingCount === 1 ? "was" : "were"} not found.`
      : " No listed rooms are currently missing from the draft.");

  return {
    ...extraction,
    roomListValidation,
    warnings: [...extraction.warnings.filter((item) => !item.startsWith("Room-list check:")), warning],
  };
}
