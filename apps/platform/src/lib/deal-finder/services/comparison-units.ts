/**
 * Smart comparison units - maps equivalence groups to natural comparison bases.
 * e.g. glue-stick -> "per stick", copy-paper -> "per ream", hand-soap -> "per ml"
 */

export interface ComparisonUnit {
  label: string;
  field: "unit_price_each" | "volume" | "weight";
}

const GROUP_UNITS: Record<string, ComparisonUnit> = {
  "glue-stick": { label: "per stick", field: "unit_price_each" },
  "pva-glue": { label: "per ml", field: "volume" },
  pen: { label: "per pen", field: "unit_price_each" },
  "ballpoint-pen": { label: "per pen", field: "unit_price_each" },
  "fountain-pen": { label: "per pen", field: "unit_price_each" },
  pencil: { label: "per pencil", field: "unit_price_each" },
  "copy-paper": { label: "per ream", field: "unit_price_each" },
  paper: { label: "per sheet", field: "unit_price_each" },
  "marker-pen": { label: "per marker", field: "unit_price_each" },
  "whiteboard-marker": { label: "per marker", field: "unit_price_each" },
  highlighter: { label: "per highlighter", field: "unit_price_each" },
  "toilet-roll": { label: "per roll", field: "unit_price_each" },
  "paper-towel": { label: "per roll", field: "unit_price_each" },
  "hand-soap": { label: "per ml", field: "volume" },
  "cleaning-product": { label: "per ml", field: "volume" },
  "hand-sanitiser": { label: "per ml", field: "volume" },
  eraser: { label: "per eraser", field: "unit_price_each" },
  scissors: { label: "per pair", field: "unit_price_each" },
};

const DEFAULT_UNIT: ComparisonUnit = {
  label: "per unit",
  field: "unit_price_each",
};

export function getComparisonUnit(
  equivalenceGroup: string | null,
): ComparisonUnit {
  if (!equivalenceGroup) return DEFAULT_UNIT;
  return GROUP_UNITS[equivalenceGroup] || DEFAULT_UNIT;
}

/**
 * Calculate the comparison price based on the comparison unit type.
 */
export function getComparisonPrice(
  unitPriceEach: number | null,
  unitWeightG: number | null,
  unitVolumeMl: number | null,
  priceGbp: number | null,
  comparisonUnit: ComparisonUnit,
): number | null {
  switch (comparisonUnit.field) {
    case "volume":
      if (unitVolumeMl && unitVolumeMl > 0 && priceGbp !== null) {
        return +(priceGbp / unitVolumeMl).toFixed(4);
      }
      return unitPriceEach;

    case "weight":
      if (unitWeightG && unitWeightG > 0 && priceGbp !== null) {
        return +(priceGbp / unitWeightG).toFixed(4);
      }
      return unitPriceEach;

    case "unit_price_each":
    default:
      return unitPriceEach;
  }
}
