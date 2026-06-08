export interface EquivalentBasketInput {
  sourcePackQuantity: number;
  sourcePrice?: number;
  sourceUnitPrice: number | null;
  sourceUnitLabel: string;
  matchPackQuantity: number;
  matchPrice: number | null;
  matchUnitPrice: number | null;
  matchUnitLabel: string;
}

export interface EquivalentBasketComparison {
  sourceComparisonQuantity: number | null;
  equivalentQuantity: number | null;
  equivalentTotalPrice: number | null;
  savingGbp: number | null;
  savingPct: number | null;
  unitSavingGbp: number | null;
  unitSavingPct: number | null;
}

function shouldCompareByUnit(sourceUnitLabel: string, matchUnitLabel: string): boolean {
  return sourceUnitLabel === matchUnitLabel && sourceUnitLabel !== "each";
}

export function calculateEquivalentBasket({
  sourcePackQuantity,
  sourcePrice,
  sourceUnitPrice,
  sourceUnitLabel,
  matchPackQuantity,
  matchPrice,
  matchUnitPrice,
  matchUnitLabel,
}: EquivalentBasketInput): EquivalentBasketComparison {
  const comparableByUnit = shouldCompareByUnit(sourceUnitLabel, matchUnitLabel);

  if (!comparableByUnit) {
    const savingGbp =
      sourcePrice != null && matchPrice != null
        ? +(sourcePrice - matchPrice).toFixed(2)
        : null;
    const savingPct =
      sourcePrice != null && matchPrice != null && sourcePrice > 0
        ? +(((sourcePrice - matchPrice) / sourcePrice) * 100).toFixed(1)
        : null;

    return {
      sourceComparisonQuantity: null,
      equivalentQuantity: null,
      equivalentTotalPrice: matchPrice,
      savingGbp,
      savingPct,
      unitSavingGbp: null,
      unitSavingPct: null,
    };
  }

  const sourceQuantity = Math.max(sourcePackQuantity || 1, 1);
  const matchQuantity = Math.max(matchPackQuantity || 1, 1);
  const comparisonQuantity = Math.max(sourceQuantity, matchQuantity);
  const equivalentTotalPrice =
    matchUnitPrice !== null
      ? +(matchUnitPrice * comparisonQuantity).toFixed(2)
      : matchPrice;
  const baselineTotalPrice =
    sourceUnitPrice !== null
      ? +(sourceUnitPrice * comparisonQuantity).toFixed(2)
      : sourcePrice ?? null;

  const savingGbp =
    baselineTotalPrice !== null && equivalentTotalPrice !== null
      ? +(baselineTotalPrice - equivalentTotalPrice).toFixed(2)
      : null;
  const savingPct =
    baselineTotalPrice !== null &&
    equivalentTotalPrice !== null &&
    baselineTotalPrice > 0
      ? +(((baselineTotalPrice - equivalentTotalPrice) / baselineTotalPrice) * 100).toFixed(1)
      : null;
  const unitSavingGbp =
    sourceUnitPrice !== null && matchUnitPrice !== null
      ? +(sourceUnitPrice - matchUnitPrice).toFixed(4)
      : null;
  const unitSavingPct =
    sourceUnitPrice !== null && matchUnitPrice !== null && sourceUnitPrice > 0
      ? +(((sourceUnitPrice - matchUnitPrice) / sourceUnitPrice) * 100).toFixed(1)
      : null;

  return {
    sourceComparisonQuantity: comparisonQuantity,
    equivalentQuantity: comparisonQuantity,
    equivalentTotalPrice,
    savingGbp,
    savingPct,
    unitSavingGbp,
    unitSavingPct,
  };
}
