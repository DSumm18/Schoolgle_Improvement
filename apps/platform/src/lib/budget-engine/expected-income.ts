/**
 * Expected Income Tracker
 *
 * Schools know income is coming but it hasn't appeared in FMS yet.
 * This tracker lets them log expected income so the Budget Confidence
 * engine can show the TRUE financial position, not just what FMS knows.
 *
 * Common scenarios:
 * - Staff member seconded to another school → monthly salary recharge coming back
 * - Pupil Premium grant → DfE publishes amounts before LA posts to FMS
 * - Energy recharges → LA processes quarterly but school knows the pattern
 * - Insurance claims → submitted but not yet paid out
 * - Lettings income → booked but cash not yet in FMS
 * - SEN top-up funding → agreed by LA panel but not yet posted
 * - Sports/PE premium → published nationally but LA hasn't allocated yet
 */

export type ExpectedIncomeStatus =
  | "expected"
  | "partially_received"
  | "received"
  | "overdue"
  | "written_off";
export type IncomeConfidence =
  | "confirmed"
  | "highly_likely"
  | "likely"
  | "uncertain";
export type IncomeFrequency =
  | "one_off"
  | "monthly"
  | "termly"
  | "quarterly"
  | "annual";

export interface ExpectedIncomeEntry {
  id: string;
  organization_id: string;
  financial_year: string;

  // What
  description: string;
  category: ExpectedIncomeCategory;
  cfr_code: string; // I01-I18D
  cost_centre?: string; // FMS cost centre if known

  // How much
  total_expected: number; // Total amount expected for the year
  amount_received: number; // How much has appeared in FMS so far
  amount_outstanding: number; // total_expected - amount_received

  // When
  frequency: IncomeFrequency;
  expected_dates: ExpectedPaymentDate[];

  // Confidence
  confidence: IncomeConfidence;
  confidence_reason: string; // e.g. "DfE published allocation letter"
  evidence_url?: string; // Link to allocation letter, email, etc.

  // Source
  source: string; // e.g. "Local Authority", "DfE", "Other School"
  source_reference?: string; // e.g. "LA ref: PP/2025-26/123"

  // Status
  status: ExpectedIncomeStatus;

  // Tracking
  created_by: string;
  created_at: string;
  updated_at: string;
  notes: string[];
}

export type ExpectedIncomeCategory =
  | "la_delegated" // I01 - Main school budget share
  | "sen_top_up" // I03 - High needs top-up
  | "pupil_premium" // I05
  | "government_grant" // I06 - PE/sports, UIFSM, etc.
  | "other_grant" // I07
  | "lettings" // I08a
  | "insurance_claim" // I10/I11
  | "staff_recharge" // Secondment income
  | "energy_recharge" // LA energy framework rebates
  | "catering" // I09
  | "training_income" // Training delivered to other schools
  | "other";

export interface ExpectedPaymentDate {
  date: string; // ISO date
  amount: number;
  status: "pending" | "received" | "overdue";
  fms_transaction_id?: string; // Matched FMS transaction when received
}

// Templates for common expected income patterns
export interface IncomeTemplate {
  name: string;
  category: ExpectedIncomeCategory;
  cfr_code: string;
  frequency: IncomeFrequency;
  confidence: IncomeConfidence;
  description_template: string; // e.g. "Pupil Premium {{financial_year}}"
  typical_months: number[]; // When payments usually arrive (1-12)
  notes: string;
}

export const INCOME_TEMPLATES: IncomeTemplate[] = [
  {
    name: "Pupil Premium Grant",
    category: "pupil_premium",
    cfr_code: "I05",
    frequency: "quarterly",
    confidence: "confirmed",
    description_template: "Pupil Premium Grant {{financial_year}}",
    typical_months: [7, 10, 1, 4], // July, Oct, Jan, April
    notes:
      "DfE publishes rates in March for following year. LA usually processes within 4-6 weeks of each quarter.",
  },
  {
    name: "PE & Sport Premium",
    category: "government_grant",
    cfr_code: "I18D",
    frequency: "annual",
    confidence: "confirmed",
    description_template: "PE & Sport Premium {{financial_year}}",
    typical_months: [10], // Usually October
    notes:
      "Fixed amount per pupil. Published nationally. Some LAs split across terms.",
  },
  {
    name: "Universal Infant Free School Meals",
    category: "government_grant",
    cfr_code: "I18D",
    frequency: "termly",
    confidence: "confirmed",
    description_template: "UIFSM Grant {{financial_year}}",
    typical_months: [10, 1, 5], // Autumn, Spring, Summer
    notes: "Based on meal take-up census. Provisional then adjusted.",
  },
  {
    name: "SEN Top-Up Funding",
    category: "sen_top_up",
    cfr_code: "I03",
    frequency: "termly",
    confidence: "highly_likely",
    description_template: "SEN Top-Up Funding - {{pupil_count}} pupils",
    typical_months: [9, 1, 4],
    notes:
      "Based on EHCP panel decisions. Amount confirmed per pupil. Can change if pupils move.",
  },
  {
    name: "Staff Secondment Recharge",
    category: "staff_recharge",
    cfr_code: "I07",
    frequency: "monthly",
    confidence: "confirmed",
    description_template:
      "Secondment recharge - {{staff_role}} to {{destination}}",
    typical_months: [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
    notes:
      "Monthly salary + on-costs recharged to receiving school. Usually processed 1-2 months in arrears by LA.",
  },
  {
    name: "Lettings Income",
    category: "lettings",
    cfr_code: "I08a",
    frequency: "monthly",
    confidence: "likely",
    description_template: "Lettings income - {{term}}",
    typical_months: [9, 10, 11, 12, 1, 2, 3, 4, 5, 6], // Term-time
    notes:
      "Based on bookings. Can fluctuate with cancellations. Summer holidays typically nil.",
  },
  {
    name: "Insurance Claim",
    category: "insurance_claim",
    cfr_code: "I10",
    frequency: "one_off",
    confidence: "likely",
    description_template: "Insurance claim - {{reason}}",
    typical_months: [],
    notes:
      "Processing time varies. Staff absence claims typically 4-8 weeks. Property claims longer.",
  },
  {
    name: "Energy Framework Rebate",
    category: "energy_recharge",
    cfr_code: "I07",
    frequency: "annual",
    confidence: "uncertain",
    description_template: "Energy framework rebate {{financial_year}}",
    typical_months: [3], // Year end
    notes:
      "LA energy framework sometimes returns unused contingency. Not guaranteed.",
  },
];

/**
 * Category labels for display
 */
export const INCOME_CATEGORY_LABELS: Record<ExpectedIncomeCategory, string> = {
  la_delegated: "LA Delegated Budget",
  sen_top_up: "SEN Top-Up Funding",
  pupil_premium: "Pupil Premium",
  government_grant: "Government Grant",
  other_grant: "Other Grant",
  lettings: "Lettings",
  insurance_claim: "Insurance Claim",
  staff_recharge: "Staff Recharge",
  energy_recharge: "Energy Recharge",
  catering: "Catering Income",
  training_income: "Training Income",
  other: "Other Income",
};

/**
 * Confidence display metadata
 */
export const CONFIDENCE_META: Record<
  IncomeConfidence,
  { label: string; weight: number; colour: string; description: string }
> = {
  confirmed: {
    label: "Confirmed",
    weight: 1.0,
    colour: "#22c55e",
    description:
      "Written confirmation received (allocation letter, signed agreement, panel decision)",
  },
  highly_likely: {
    label: "Highly Likely",
    weight: 0.9,
    colour: "#3b82f6",
    description:
      "Based on published rates or established pattern, but no formal confirmation yet",
  },
  likely: {
    label: "Likely",
    weight: 0.7,
    colour: "#f59e0b",
    description:
      "Expected based on verbal agreement, historical pattern, or pending application",
  },
  uncertain: {
    label: "Uncertain",
    weight: 0.4,
    colour: "#ef4444",
    description:
      "Possible but not guaranteed — claim submitted, rebate hoped for, or speculative",
  },
};

/**
 * Calculate the expected income position
 */
export function calculateExpectedIncome(
  entries: ExpectedIncomeEntry[],
  asAtDate: string,
): {
  total_expected: number;
  total_received: number;
  total_outstanding: number;
  by_confidence: Record<IncomeConfidence, number>;
  by_category: Record<
    ExpectedIncomeCategory,
    { expected: number; received: number; outstanding: number }
  >;
  overdue_items: ExpectedIncomeEntry[];
  next_expected: ExpectedPaymentDate[];
} {
  const byConfidence: Record<IncomeConfidence, number> = {
    confirmed: 0,
    highly_likely: 0,
    likely: 0,
    uncertain: 0,
  };

  const allCategories: ExpectedIncomeCategory[] = [
    "la_delegated",
    "sen_top_up",
    "pupil_premium",
    "government_grant",
    "other_grant",
    "lettings",
    "insurance_claim",
    "staff_recharge",
    "energy_recharge",
    "catering",
    "training_income",
    "other",
  ];
  const byCategory: Record<
    ExpectedIncomeCategory,
    { expected: number; received: number; outstanding: number }
  > = {} as any;
  for (const cat of allCategories) {
    byCategory[cat] = { expected: 0, received: 0, outstanding: 0 };
  }

  const overdue: ExpectedIncomeEntry[] = [];
  const nextExpected: ExpectedPaymentDate[] = [];

  let totalExpected = 0;
  let totalReceived = 0;

  for (const entry of entries) {
    // Skip written-off entries from totals
    if (entry.status === "written_off") continue;

    totalExpected += entry.total_expected;
    totalReceived += entry.amount_received;
    byConfidence[entry.confidence] += entry.amount_outstanding;

    if (byCategory[entry.category]) {
      byCategory[entry.category].expected += entry.total_expected;
      byCategory[entry.category].received += entry.amount_received;
      byCategory[entry.category].outstanding += entry.amount_outstanding;
    }

    if (entry.status === "overdue") {
      overdue.push(entry);
    }

    // Also mark entries overdue if any payment dates are past and still pending
    const hasOverduePayments = entry.expected_dates.some(
      (pd) => pd.status === "pending" && pd.date < asAtDate,
    );
    if (
      hasOverduePayments &&
      entry.status !== "overdue" &&
      !overdue.includes(entry)
    ) {
      overdue.push(entry);
    }

    for (const pd of entry.expected_dates) {
      if (pd.status === "pending" && pd.date > asAtDate) {
        nextExpected.push(pd);
      }
    }
  }

  nextExpected.sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_expected: totalExpected,
    total_received: totalReceived,
    total_outstanding: totalExpected - totalReceived,
    by_confidence: byConfidence,
    by_category: byCategory,
    overdue_items: overdue,
    next_expected: nextExpected.slice(0, 10),
  };
}

/**
 * Auto-detect overdue status for expected income entries.
 * Marks entries as overdue if any expected payment date has passed
 * without being received.
 */
export function updateOverdueStatus(
  entries: ExpectedIncomeEntry[],
  asAtDate: string,
  graceDays: number = 14,
): ExpectedIncomeEntry[] {
  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  const checkDate = new Date(asAtDate);

  return entries.map((entry) => {
    if (entry.status === "received" || entry.status === "written_off") {
      return entry;
    }

    let hasOverduePayment = false;
    const updatedDates = entry.expected_dates.map((pd) => {
      if (pd.status !== "pending") return pd;

      const expectedDate = new Date(pd.date);
      const overdueThreshold = new Date(expectedDate.getTime() + graceMs);

      if (checkDate > overdueThreshold) {
        hasOverduePayment = true;
        return { ...pd, status: "overdue" as const };
      }
      return pd;
    });

    if (hasOverduePayment && entry.status === "expected") {
      return {
        ...entry,
        status: "overdue" as ExpectedIncomeStatus,
        expected_dates: updatedDates,
        updated_at: asAtDate,
      };
    }

    return { ...entry, expected_dates: updatedDates };
  });
}

/**
 * Match an FMS transaction to an expected income entry.
 * Returns the entry ID and payment date index if a match is found.
 */
export function matchFMSTransaction(
  entries: ExpectedIncomeEntry[],
  transaction: {
    amount: number;
    date: string;
    description: string;
    reference?: string;
  },
  tolerancePercent: number = 5,
): { entryId: string; paymentDateIndex: number; confidence: number } | null {
  let bestMatch: {
    entryId: string;
    paymentDateIndex: number;
    confidence: number;
  } | null = null;
  let bestScore = 0;

  for (const entry of entries) {
    if (entry.status === "received" || entry.status === "written_off") continue;

    for (let i = 0; i < entry.expected_dates.length; i++) {
      const pd = entry.expected_dates[i];
      if (pd.status === "received") continue;

      let score = 0;

      // Amount match (within tolerance)
      const amountDiff = Math.abs(transaction.amount - pd.amount);
      const amountTolerance = pd.amount * (tolerancePercent / 100);
      if (amountDiff <= amountTolerance) {
        // Closer amount = higher score
        score += 50 * (1 - amountDiff / Math.max(amountTolerance, 1));
      } else {
        continue; // Amount must be within tolerance
      }

      // Date proximity (within 30 days of expected date scores highest)
      const daysDiff = Math.abs(
        (new Date(transaction.date).getTime() - new Date(pd.date).getTime()) /
          (24 * 60 * 60 * 1000),
      );
      if (daysDiff <= 7) score += 30;
      else if (daysDiff <= 14) score += 25;
      else if (daysDiff <= 30) score += 15;
      else if (daysDiff <= 60) score += 5;

      // Description keyword match
      const descLower = transaction.description.toLowerCase();
      const entryDescLower = entry.description.toLowerCase();
      const keywords = entryDescLower.split(/\s+/).filter((w) => w.length > 3);
      const matchedKeywords = keywords.filter((kw) => descLower.includes(kw));
      if (keywords.length > 0) {
        score += 20 * (matchedKeywords.length / keywords.length);
      }

      // Reference match bonus
      if (transaction.reference && entry.source_reference) {
        if (
          transaction.reference
            .toLowerCase()
            .includes(entry.source_reference.toLowerCase()) ||
          entry.source_reference
            .toLowerCase()
            .includes(transaction.reference.toLowerCase())
        ) {
          score += 20;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          entryId: entry.id,
          paymentDateIndex: i,
          confidence: Math.min(score, 100),
        };
      }
    }
  }

  // Only return if score is reasonable
  if (bestMatch && bestScore >= 40) {
    return bestMatch;
  }

  return null;
}

/**
 * Create expected income entries from a template.
 * Generates payment dates based on the template's typical_months and frequency.
 */
export function createFromTemplate(
  template: IncomeTemplate,
  params: {
    organization_id: string;
    financial_year: string;
    total_amount: number;
    created_by: string;
    fy_start_month: number; // 4 for LA (April), 9 for Academy (September)
    custom_description?: string;
    source?: string;
    source_reference?: string;
    evidence_url?: string;
    notes?: string;
  },
): ExpectedIncomeEntry {
  const id = `exp-inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // Build the description from template
  const description =
    params.custom_description ||
    template.description_template
      .replace("{{financial_year}}", params.financial_year)
      .replace(/\{\{.*?\}\}/g, ""); // Strip any remaining unfilled placeholders

  // Generate payment dates based on frequency and typical months
  const expectedDates: ExpectedPaymentDate[] = [];
  const fyYear = parseInt(params.financial_year.split("/")[0]);

  if (template.typical_months.length > 0) {
    const paymentCount = template.typical_months.length;
    const amountPerPayment =
      Math.round((params.total_amount / paymentCount) * 100) / 100;
    // Adjust last payment for rounding
    let allocated = 0;

    for (let i = 0; i < paymentCount; i++) {
      const month = template.typical_months[i];
      // Determine the year for this payment month
      // If the month is before the FY start month, it falls in the next calendar year
      const year = month >= params.fy_start_month ? fyYear : fyYear + 1;
      const date = `${year}-${String(month).padStart(2, "0")}-15`; // Mid-month estimate

      const isLast = i === paymentCount - 1;
      const amount = isLast
        ? Math.round((params.total_amount - allocated) * 100) / 100
        : amountPerPayment;
      allocated += amount;

      expectedDates.push({
        date,
        amount,
        status: "pending",
      });
    }
  } else {
    // One-off payment, no typical month known — put at mid-year
    const midMonth =
      params.fy_start_month + 6 > 12
        ? params.fy_start_month + 6 - 12
        : params.fy_start_month + 6;
    const midYear = midMonth < params.fy_start_month ? fyYear + 1 : fyYear;
    expectedDates.push({
      date: `${midYear}-${String(midMonth).padStart(2, "0")}-15`,
      amount: params.total_amount,
      status: "pending",
    });
  }

  return {
    id,
    organization_id: params.organization_id,
    financial_year: params.financial_year,
    description: description.trim(),
    category: template.category,
    cfr_code: template.cfr_code,
    total_expected: params.total_amount,
    amount_received: 0,
    amount_outstanding: params.total_amount,
    frequency: template.frequency,
    expected_dates: expectedDates,
    confidence: template.confidence,
    confidence_reason: template.notes,
    evidence_url: params.evidence_url,
    source: params.source || "Local Authority",
    source_reference: params.source_reference,
    status: "expected",
    created_by: params.created_by,
    created_at: now,
    updated_at: now,
    notes: params.notes ? [params.notes] : [],
  };
}

/**
 * Record a partial or full receipt against an expected income entry.
 * Updates amounts, payment date status, and overall entry status.
 */
export function recordReceipt(
  entry: ExpectedIncomeEntry,
  receipt: {
    amount: number;
    date: string;
    fms_transaction_id?: string;
    payment_date_index?: number; // Which expected date this corresponds to
    note?: string;
  },
): ExpectedIncomeEntry {
  const updated = { ...entry };
  updated.amount_received += receipt.amount;
  updated.amount_outstanding = updated.total_expected - updated.amount_received;
  updated.updated_at = new Date().toISOString();

  if (receipt.note) {
    updated.notes = [
      ...updated.notes,
      `${receipt.date}: Received £${receipt.amount.toFixed(2)} - ${receipt.note}`,
    ];
  } else {
    updated.notes = [
      ...updated.notes,
      `${receipt.date}: Received £${receipt.amount.toFixed(2)}`,
    ];
  }

  // Update the specific payment date if index provided
  if (
    receipt.payment_date_index !== undefined &&
    receipt.payment_date_index < updated.expected_dates.length
  ) {
    updated.expected_dates = [...updated.expected_dates];
    updated.expected_dates[receipt.payment_date_index] = {
      ...updated.expected_dates[receipt.payment_date_index],
      status: "received",
      fms_transaction_id: receipt.fms_transaction_id,
    };
  } else {
    // Try to match to the best pending payment date by amount
    const pendingIdx = updated.expected_dates.findIndex(
      (pd) => pd.status === "pending" || pd.status === "overdue",
    );
    if (pendingIdx >= 0) {
      updated.expected_dates = [...updated.expected_dates];
      updated.expected_dates[pendingIdx] = {
        ...updated.expected_dates[pendingIdx],
        status: "received",
        fms_transaction_id: receipt.fms_transaction_id,
      };
    }
  }

  // Update overall status
  if (updated.amount_outstanding <= 0) {
    updated.status = "received";
  } else if (updated.amount_received > 0) {
    updated.status = "partially_received";
  }

  return updated;
}

/**
 * Generate a summary narrative about expected income for governors/heads.
 */
export function generateIncomeSummaryNarrative(
  entries: ExpectedIncomeEntry[],
  asAtDate: string,
): string {
  const calc = calculateExpectedIncome(entries, asAtDate);

  if (entries.length === 0) {
    return "No expected income has been logged. Consider adding known grants, recharges, and other income that has not yet appeared in FMS to get a clearer picture of the school's true budget position.";
  }

  const parts: string[] = [];

  // Opening summary
  parts.push(
    `As at ${formatDateUK(asAtDate)}, the school is tracking ${entries.filter((e) => e.status !== "received" && e.status !== "written_off").length} expected income items totalling £${formatMoney(calc.total_expected)}.`,
  );

  // Received vs outstanding
  if (calc.total_received > 0) {
    parts.push(
      `Of this, £${formatMoney(calc.total_received)} has been received in FMS, leaving £${formatMoney(calc.total_outstanding)} outstanding.`,
    );
  }

  // Breakdown by confidence
  const confParts: string[] = [];
  if (calc.by_confidence.confirmed > 0) {
    confParts.push(`£${formatMoney(calc.by_confidence.confirmed)} confirmed`);
  }
  if (calc.by_confidence.highly_likely > 0) {
    confParts.push(
      `£${formatMoney(calc.by_confidence.highly_likely)} highly likely`,
    );
  }
  if (calc.by_confidence.likely > 0) {
    confParts.push(`£${formatMoney(calc.by_confidence.likely)} likely`);
  }
  if (calc.by_confidence.uncertain > 0) {
    confParts.push(`£${formatMoney(calc.by_confidence.uncertain)} uncertain`);
  }
  if (confParts.length > 0) {
    parts.push(`Outstanding income by confidence: ${confParts.join(", ")}.`);
  }

  // Overdue items
  if (calc.overdue_items.length > 0) {
    const overdueTotal = calc.overdue_items.reduce(
      (s, e) => s + e.amount_outstanding,
      0,
    );
    const overdueDescs = calc.overdue_items
      .slice(0, 3)
      .map((e) => `${e.description} (£${formatMoney(e.amount_outstanding)})`)
      .join(", ");
    parts.push(
      `ACTION REQUIRED: ${calc.overdue_items.length} item${calc.overdue_items.length > 1 ? "s" : ""} totalling £${formatMoney(overdueTotal)} ${calc.overdue_items.length > 1 ? "are" : "is"} overdue: ${overdueDescs}${calc.overdue_items.length > 3 ? ` and ${calc.overdue_items.length - 3} more` : ""}. Follow up with the source to confirm these will still be received.`,
    );
  }

  // Next expected
  if (calc.next_expected.length > 0) {
    const nextThree = calc.next_expected.slice(0, 3);
    const nextDescs = nextThree
      .map((pd) => `£${formatMoney(pd.amount)} on ${formatDateUK(pd.date)}`)
      .join(", ");
    parts.push(`Next expected receipts: ${nextDescs}.`);
  }

  return parts.join(" ");
}

// =====================================================
// HELPERS
// =====================================================

function formatMoney(amount: number): string {
  return Math.abs(amount).toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDateUK(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
