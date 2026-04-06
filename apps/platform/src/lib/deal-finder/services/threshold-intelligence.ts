/**
 * DealFind — Procurement Threshold Intelligence
 *
 * Tracks cumulative spend per supplier, alerts when approaching
 * procurement thresholds, suggests supplier rotation.
 *
 * UK Thresholds:
 * - £10,000: Three written quotations required
 * - £40,000: Formal competitive tender
 * - £207,720: Procurement Act 2023 full compliance
 *
 * MAT aggregation: Procurement Act 2023 Schedule 3 para 4 requires
 * MATs to aggregate spend across ALL schools when buying same type
 * of goods. Individual school three-quote exercises do NOT override
 * trust-level thresholds.
 */

export interface ProcurementThreshold {
  name: string;
  threshold_gbp: number;
  requirement: string;
}

export interface SupplierSpendSummary {
  supplier_name: string;
  total_spend: number;
  transaction_count: number;
  financial_year: string;
}

export interface ThresholdAlert {
  supplier_name: string;
  current_spend: number;
  next_threshold: ProcurementThreshold;
  proximity_pct: number;
  alert_level: "green" | "amber" | "red";
  message: string;
  suggestion?: string;
}

export const PROCUREMENT_THRESHOLDS: ProcurementThreshold[] = [
  {
    name: "Three Quotes",
    threshold_gbp: 10000,
    requirement: "Obtain minimum three written quotations",
  },
  {
    name: "Formal Tender",
    threshold_gbp: 40000,
    requirement: "Formal competitive tender process required",
  },
  {
    name: "Procurement Act",
    threshold_gbp: 207720,
    requirement:
      "Full Procurement Act 2023 compliance — open tender, standstill period, contract notices",
  },
];

/**
 * Calculate threshold proximity for a supplier's spend
 */
export function calculateThresholdAlert(
  supplier_name: string,
  total_spend: number,
): ThresholdAlert {
  // Find the next threshold the spend is approaching
  const nextThreshold = PROCUREMENT_THRESHOLDS.find(
    (t) => total_spend < t.threshold_gbp,
  ) || PROCUREMENT_THRESHOLDS[PROCUREMENT_THRESHOLDS.length - 1];

  const proximity_pct = (total_spend / nextThreshold.threshold_gbp) * 100;

  let alert_level: "green" | "amber" | "red";
  let message: string;
  let suggestion: string | undefined;

  if (proximity_pct >= 90) {
    alert_level = "red";
    const remaining = nextThreshold.threshold_gbp - total_spend;
    message = `CRITICAL: £${remaining.toFixed(0)} from the ${nextThreshold.name} threshold (£${nextThreshold.threshold_gbp.toLocaleString()}). ${nextThreshold.requirement}.`;
    suggestion = `Consider alternative suppliers to keep ${supplier_name} spend below £${nextThreshold.threshold_gbp.toLocaleString()}.`;
  } else if (proximity_pct >= 75) {
    alert_level = "amber";
    const remaining = nextThreshold.threshold_gbp - total_spend;
    message = `WARNING: £${remaining.toFixed(0)} from the ${nextThreshold.name} threshold. Review spend with ${supplier_name}.`;
    suggestion = `Look for equivalent products from other suppliers to spread spend.`;
  } else {
    alert_level = "green";
    message = `Spend within safe range for ${nextThreshold.name} threshold.`;
  }

  return {
    supplier_name,
    current_spend: total_spend,
    next_threshold: nextThreshold,
    proximity_pct: Math.round(proximity_pct * 100) / 100,
    alert_level,
    message,
    suggestion,
  };
}

/**
 * Generate rotation suggestions when a supplier is near threshold.
 * Returns alternative suppliers from the results that could be used instead.
 */
export function suggestRotation(
  nearThresholdSupplier: string,
  alternatives: Array<{ supplier: string; price: number; product_name: string }>,
  currentSpend: number,
  purchaseAmount: number,
): {
  should_rotate: boolean;
  reason?: string;
  alternatives: Array<{
    supplier: string;
    price: number;
    product_name: string;
    price_diff: number;
  }>;
} {
  const nextThreshold = PROCUREMENT_THRESHOLDS.find(
    (t) => currentSpend < t.threshold_gbp,
  );

  if (!nextThreshold) {
    return { should_rotate: false, alternatives: [] };
  }

  const wouldExceed = currentSpend + purchaseAmount >= nextThreshold.threshold_gbp * 0.75;

  if (!wouldExceed) {
    return { should_rotate: false, alternatives: [] };
  }

  // Find alternatives from different suppliers
  const basePrice = alternatives.find(
    (a) => a.supplier.toLowerCase() === nearThresholdSupplier.toLowerCase(),
  )?.price;

  const rotationOptions = alternatives
    .filter(
      (a) => a.supplier.toLowerCase() !== nearThresholdSupplier.toLowerCase(),
    )
    .map((a) => ({
      ...a,
      price_diff: basePrice ? a.price - basePrice : 0,
    }))
    .sort((a, b) => a.price - b.price);

  return {
    should_rotate: true,
    reason: `This purchase would bring your ${nearThresholdSupplier} spend to £${(currentSpend + purchaseAmount).toLocaleString()}, which is ${Math.round(((currentSpend + purchaseAmount) / nextThreshold.threshold_gbp) * 100)}% of the ${nextThreshold.name} threshold (£${nextThreshold.threshold_gbp.toLocaleString()}).`,
    alternatives: rotationOptions,
  };
}
