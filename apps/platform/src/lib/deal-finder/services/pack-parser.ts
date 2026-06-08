export interface PackInfo {
  pack_quantity: number;
  pack_unit: string;
  unit_weight_g: number | null;
  unit_volume_ml: number | null;
  raw_pack_text: string | null;
  raw_weight_text: string | null;
  confidence: number;
}

const PACK_PATTERNS: Array<{ regex: RegExp; group: number }> = [
  { regex: /pack\s+of\s+(\d+)/i, group: 1 },
  { regex: /box\s+of\s+(\d+)/i, group: 1 },
  { regex: /case\s+of\s+(\d+)/i, group: 1 },
  { regex: /set\s+of\s+(\d+)/i, group: 1 },
  { regex: /bag\s+of\s+(\d+)/i, group: 1 },
  { regex: /carton\s+of\s+(\d+)/i, group: 1 },
  { regex: /ream\s+of\s+(\d+)/i, group: 1 },
  { regex: /\b(?:pk|pack)\s+(\d+)\b/i, group: 1 },
  { regex: /(\d+)\s*-?\s*(?:pk|pack)\b/i, group: 1 },
  { regex: /\bx\s*(\d+)\b/i, group: 1 },
  { regex: /\b(\d+)\s*x\b/i, group: 1 },
  { regex: /qty\s*:?\s*(\d+)/i, group: 1 },
];

const UNIT_PATTERNS: Array<{
  regex: RegExp;
  group: number;
  type: "pack";
  unit: string;
}> = [
  { regex: /\b(\d+)\s*ream/i, group: 1, type: "pack", unit: "ream" },
  { regex: /\b(\d+)\s*sheet/i, group: 1, type: "pack", unit: "sheet" },
];

const WEIGHT_PATTERNS: Array<{
  regex: RegExp;
  group: number;
  multiplier: number;
}> = [
  { regex: /\b(\d+(?:\.\d+)?)\s*g\b/i, group: 1, multiplier: 1 },
  { regex: /\b(\d+(?:\.\d+)?)\s*kg\b/i, group: 1, multiplier: 1000 },
];

const VOLUME_PATTERNS: Array<{
  regex: RegExp;
  group: number;
  multiplier: number;
}> = [
  { regex: /\b(\d+(?:\.\d+)?)\s*ml\b/i, group: 1, multiplier: 1 },
  { regex: /\b(\d+(?:\.\d+)?)\s*(?<![m])l\b/i, group: 1, multiplier: 1000 },
];

function extractPackUnit(text: string): string {
  const lower = text.toLowerCase();
  if (/\bream\b/.test(lower)) return "ream";
  if (/\bsheet\b/.test(lower)) return "sheet";
  if (/\bbox\b/.test(lower)) return "box";
  if (/\bcase\b/.test(lower)) return "case";
  if (/\bcarton\b/.test(lower)) return "carton";
  if (/\bbag\b/.test(lower)) return "bag";
  if (/\bset\b/.test(lower)) return "set";
  if (/\bpack\b|\bpk\b/.test(lower)) return "pack";
  return "pack";
}

export function parsePackInfo(
  productName: string,
  description?: string,
): PackInfo {
  const text = `${productName} ${description || ""}`.trim();

  let pack_quantity = 1;
  let raw_pack_text: string | null = null;
  let packConfidence = 0;

  for (const { regex, group } of PACK_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const qty = parseInt(match[group], 10);
      if (qty > 1 && qty <= 10000) {
        pack_quantity = qty;
        raw_pack_text = match[0];
        packConfidence = 0.9;
        break;
      }
    }
  }

  if (pack_quantity === 1) {
    for (const { regex, group } of UNIT_PATTERNS) {
      const match = text.match(regex);
      if (match) {
        const qty = parseInt(match[group], 10);
        if (qty > 1 && qty <= 10000) {
          pack_quantity = qty;
          raw_pack_text = match[0];
          packConfidence = 0.8;
          break;
        }
      }
    }
  }

  let unit_weight_g: number | null = null;
  let raw_weight_text: string | null = null;
  let weightConfidence = 0;

  for (const { regex, group, multiplier } of WEIGHT_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const val = parseFloat(match[group]);
      if (val > 0 && val * multiplier <= 100000) {
        unit_weight_g = +(val * multiplier).toFixed(2);
        raw_weight_text = match[0];
        weightConfidence = 0.85;
        break;
      }
    }
  }

  let unit_volume_ml: number | null = null;

  for (const { regex, group, multiplier } of VOLUME_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const val = parseFloat(match[group]);
      if (val > 0 && val * multiplier <= 100000) {
        unit_volume_ml = +(val * multiplier).toFixed(2);
        if (!raw_weight_text) {
          raw_weight_text = match[0];
          weightConfidence = 0.85;
        }
        break;
      }
    }
  }

  let pack_unit = pack_quantity > 1 ? extractPackUnit(text) : "each";

  const looksLikeCopyPaper =
    /\b(?:a3|a4|copy|copier|printer|print)\b/i.test(text) &&
    /\bpaper\b/i.test(text);
  const sheetCountMatch = text.match(/\b(\d{3,6})\s*sheets?\b/i);

  if (looksLikeCopyPaper && sheetCountMatch) {
    const sheetCount = parseInt(sheetCountMatch[1], 10);
    if (raw_pack_text?.toLowerCase().includes("sheet")) {
      const reams = sheetCount >= 500 ? sheetCount / 500 : 1;
      if (reams > 0 && reams <= 200 && Number.isFinite(reams)) {
        pack_quantity = Number.isInteger(reams) ? reams : +reams.toFixed(2);
        pack_unit = "ream";
        raw_pack_text = `${sheetCount} sheets`;
      }
    } else if (pack_quantity > 1) {
      pack_unit = "ream";
    }
  }

  if (
    looksLikeCopyPaper &&
    pack_quantity >= 500 &&
    pack_quantity <= 100000 &&
    /\b(?:pack|box|case)\s+of\s+\d{3,6}\b/i.test(raw_pack_text || "")
  ) {
    const reams = pack_quantity / 500;
    if (reams > 0 && reams <= 200 && Number.isFinite(reams)) {
      pack_quantity = Number.isInteger(reams) ? reams : +reams.toFixed(2);
      pack_unit = "ream";
      raw_pack_text = `${raw_pack_text} sheets`;
    }
  }

  const confidence =
    packConfidence > 0 || weightConfidence > 0
      ? +(
          (packConfidence + weightConfidence) / 2 ||
          packConfidence ||
          weightConfidence
        ).toFixed(2)
      : 0.5;

  return {
    pack_quantity,
    pack_unit,
    unit_weight_g,
    unit_volume_ml,
    raw_pack_text,
    raw_weight_text,
    confidence,
  };
}
