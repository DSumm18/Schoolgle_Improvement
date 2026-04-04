/**
 * Generate a canonical product key for exact product identification.
 * e.g. "Pritt Stick 43g" -> "pritt-stick-43g"
 */
export function generateCanonicalKey(
  name: string,
  brand?: string,
  weightG?: number | null,
  volumeMl?: number | null,
): string {
  const parts: string[] = [];

  if (brand) {
    parts.push(brand.trim());
  }

  const cleanName = name
    .replace(/\b(?:pack|box|case|carton|bag|set|ream)\s+of\s+\d+/gi, "")
    .replace(/\b\d+\s*-?\s*(?:pk|pack)\b/gi, "")
    .replace(/\bx\s*\d+\b/gi, "")
    .replace(/\b\d+\s*x\b/gi, "")
    .replace(/\bqty\s*:?\s*\d+/gi, "")
    .trim();

  parts.push(cleanName);

  if (weightG && weightG > 0) {
    parts.push(`${weightG}g`);
  }
  if (volumeMl && volumeMl > 0) {
    parts.push(`${volumeMl}ml`);
  }

  return parts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const PRODUCT_TYPE_MAP: Array<{ patterns: RegExp[]; group: string }> = [
  {
    patterns: [/\bpritt\b.*\bstick/i, /\bglue\s*stick/i],
    group: "glue-stick",
  },
  {
    patterns: [/\bpva\b.*\bglue/i, /\bpva\b/i],
    group: "pva-glue",
  },
  { patterns: [/\bglue\b/i], group: "glue" },
  {
    patterns: [/\bballpoint\b|\bball\s*point\b|\bbiro\b/i],
    group: "ballpoint-pen",
  },
  {
    patterns: [/\bfountain\s*pen/i],
    group: "fountain-pen",
  },
  {
    patterns: [/\bwhiteboard\s*marker/i, /\bdry\s*(?:wipe|erase)\s*marker/i],
    group: "whiteboard-marker",
  },
  { patterns: [/\bmarker\b|\bfelt\s*tip/i], group: "marker-pen" },
  { patterns: [/\bpen\b|\bpens\b/i], group: "pen" },
  { patterns: [/\bpencil\b/i], group: "pencil" },
  { patterns: [/\bruler\b/i], group: "ruler" },
  { patterns: [/\beraser\b|\brubber\b/i], group: "eraser" },
  { patterns: [/\bscissors\b/i], group: "scissors" },
  { patterns: [/\bsharpener\b/i], group: "sharpener" },
  { patterns: [/\bhighlighter\b/i], group: "highlighter" },
  {
    patterns: [/\bcorrection\s*(?:fluid|tape|pen)/i, /\btipp-?ex\b/i],
    group: "correction-fluid",
  },
  {
    patterns: [/\bsticky\s*note/i, /\bpost-?it\b/i],
    group: "sticky-notes",
  },
  {
    patterns: [/\bnote\s*book\b|\bnotebook\b|\bexercise\s*book\b/i],
    group: "notebook",
  },
  {
    patterns: [/\bcopy\s*paper\b|\bprinter\s*paper\b|\ba4\s*paper\b/i],
    group: "copy-paper",
  },
  { patterns: [/\bpaper\b/i], group: "paper" },
  {
    patterns: [/\bsellotape\b|\badhesive\s*tape\b|\bsticky\s*tape\b/i],
    group: "adhesive-tape",
  },
  { patterns: [/\bstapler\b/i], group: "stapler" },
  { patterns: [/\bstaples\b/i], group: "staples" },
  { patterns: [/\bpaper\s*clip/i], group: "paper-clips" },
  { patterns: [/\bbinder\b|\bring\s*binder/i], group: "binder" },
  { patterns: [/\bfolder\b/i], group: "folder" },
  { patterns: [/\benvelope\b/i], group: "envelope" },
  { patterns: [/\blabel\b|\blabels\b/i], group: "labels" },
  {
    patterns: [/\btoner\b|\bcartridge\b|\bink\b/i],
    group: "printer-consumable",
  },
  {
    patterns: [/\bhand\s*soap\b|\bhand\s*wash\b/i],
    group: "hand-soap",
  },
  {
    patterns: [/\btoilet\s*(?:roll|paper|tissue)\b/i],
    group: "toilet-roll",
  },
  {
    patterns: [/\bhand\s*towel\b|\bpaper\s*towel\b/i],
    group: "paper-towel",
  },
  {
    patterns: [/\bsanitiser\b|\bsanitizer\b/i],
    group: "hand-sanitiser",
  },
  {
    patterns: [/\bcleaning\b|\bcleaner\b|\bdetergent\b/i],
    group: "cleaning-product",
  },
];

/**
 * Generate an equivalence group for product-type-level comparison.
 * e.g. "Pritt Stick 43g" -> "glue-stick"
 */
export function generateEquivalenceGroup(
  name: string,
  description?: string,
): string {
  const text = `${name} ${description || ""}`;

  for (const { patterns, group } of PRODUCT_TYPE_MAP) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return group;
      }
    }
  }

  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !["the", "and", "for", "with", "pack", "box"].includes(w),
    )
    .slice(0, 2);

  return words.join("-") || "unknown";
}

/**
 * Determine equivalence type between source and matched product.
 */
export function getEquivalenceType(
  sourceCanonical: string | null,
  matchedCanonical: string | null,
  sourceEquivalence: string | null,
  matchedEquivalence: string | null,
  matchType: string,
): "identical" | "alternative" | "different" {
  if (
    sourceCanonical &&
    matchedCanonical &&
    sourceCanonical === matchedCanonical
  ) {
    return "identical";
  }

  if (matchType === "exact_sku" || matchType === "barcode") {
    return "identical";
  }

  if (
    sourceEquivalence &&
    matchedEquivalence &&
    sourceEquivalence === matchedEquivalence
  ) {
    return "alternative";
  }

  if (matchType === "fingerprint") {
    return "identical";
  }

  return "different";
}
