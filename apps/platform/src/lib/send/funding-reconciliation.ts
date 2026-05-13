export type FundingPaymentFrequency = "monthly" | "termly" | "annual";

export type FundingReconciliationStatus =
  | "matched"
  | "underpaid"
  | "overpaid"
  | "overdue"
  | "expected_later"
  | "unmatched_receipt";

export interface ExpectedFundingScheduleInput {
  allocationId: string;
  pupilId: string;
  annualTopUpAmount: number;
  effectiveFrom: string;
  effectiveTo: string;
  paymentFrequency: FundingPaymentFrequency;
  firstPaymentDueDate: string;
}

export interface ExpectedFundingPeriod {
  allocationId: string;
  pupilId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  expectedAmount: number;
  isBackdated: boolean;
}

export interface FundingReceipt {
  receiptId: string;
  pupilId: string;
  periodStart: string;
  periodEnd: string;
  receivedAmount: number;
  receivedDate: string;
}

export interface FundingReconciliationInput {
  asOfDate: string;
  expectedSchedule: ExpectedFundingPeriod[];
  receipts: FundingReceipt[];
}

export interface FundingReconciliationItem {
  allocationId: string | null;
  pupilId: string;
  receiptId: string | null;
  periodStart: string;
  periodEnd: string;
  dueDate: string | null;
  expectedAmount: number;
  receivedAmount: number;
  varianceAmount: number;
  status: FundingReconciliationStatus;
  isBackdated: boolean;
}

export interface FundingReconciliationResult {
  items: FundingReconciliationItem[];
}

export interface FundingReconciliationSummary {
  expectedTotal: number;
  receivedTotal: number;
  outstandingTotal: number;
  backdatedOutstandingTotal: number;
  varianceCount: number;
  unmatchedReceiptTotal: number;
}

const ISO_DATE_LENGTH = 10;

function parseDate(value: string): Date {
  return new Date(`${value.slice(0, ISO_DATE_LENGTH)}T00:00:00.000Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function daysInclusive(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function maxDate(a: Date, b: Date): Date {
  return a.getTime() > b.getTime() ? a : b;
}

function minDate(a: Date, b: Date): Date {
  return a.getTime() < b.getTime() ? a : b;
}

function isBeforeMonth(date: Date, comparison: Date): boolean {
  const dateMonth = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  const comparisonMonth = Date.UTC(
    comparison.getUTCFullYear(),
    comparison.getUTCMonth(),
    1,
  );
  return dateMonth < comparisonMonth;
}

function dueDateForPeriod(periodStart: Date, firstPaymentDueDate: Date): string {
  if (isBeforeMonth(periodStart, firstPaymentDueDate)) {
    return toIsoDate(firstPaymentDueDate);
  }

  const requestedDay = firstPaymentDueDate.getUTCDate();
  const lastDayInMonth = endOfMonth(periodStart).getUTCDate();
  return toIsoDate(
    new Date(
      Date.UTC(
        periodStart.getUTCFullYear(),
        periodStart.getUTCMonth(),
        Math.min(requestedDay, lastDayInMonth),
      ),
    ),
  );
}

function buildMonthlySchedule(
  input: ExpectedFundingScheduleInput,
): ExpectedFundingPeriod[] {
  const effectiveFrom = parseDate(input.effectiveFrom);
  const effectiveTo = parseDate(input.effectiveTo);
  const firstPaymentDueDate = parseDate(input.firstPaymentDueDate);
  const monthlyAmount = input.annualTopUpAmount / 12;
  const periods: ExpectedFundingPeriod[] = [];

  for (
    let monthStart = startOfMonth(effectiveFrom);
    monthStart <= effectiveTo;
    monthStart = addMonths(monthStart, 1)
  ) {
    const monthEnd = endOfMonth(monthStart);
    const activeStart = maxDate(monthStart, effectiveFrom);
    const activeEnd = minDate(monthEnd, effectiveTo);
    const activeDays = daysInclusive(activeStart, activeEnd);
    const monthDays = daysInclusive(monthStart, monthEnd);

    periods.push({
      allocationId: input.allocationId,
      pupilId: input.pupilId,
      periodStart: toIsoDate(activeStart),
      periodEnd: toIsoDate(activeEnd),
      dueDate: dueDateForPeriod(monthStart, firstPaymentDueDate),
      expectedAmount: roundCurrency(monthlyAmount * (activeDays / monthDays)),
      isBackdated: isBeforeMonth(monthStart, firstPaymentDueDate),
    });
  }

  return periods;
}

function buildAnnualSchedule(
  input: ExpectedFundingScheduleInput,
): ExpectedFundingPeriod[] {
  return [
    {
      allocationId: input.allocationId,
      pupilId: input.pupilId,
      periodStart: input.effectiveFrom,
      periodEnd: input.effectiveTo,
      dueDate: input.firstPaymentDueDate,
      expectedAmount: roundCurrency(input.annualTopUpAmount),
      isBackdated: parseDate(input.effectiveFrom) < parseDate(input.firstPaymentDueDate),
    },
  ];
}

function buildTermlySchedule(
  input: ExpectedFundingScheduleInput,
): ExpectedFundingPeriod[] {
  const effectiveFrom = parseDate(input.effectiveFrom);
  const effectiveTo = parseDate(input.effectiveTo);
  const firstPaymentDueDate = parseDate(input.firstPaymentDueDate);
  const termBoundaries = [
    ["09-01", "12-31"],
    ["01-01", "03-31"],
    ["04-01", "08-31"],
  ];
  const years = new Set<number>();

  for (let year = effectiveFrom.getUTCFullYear(); year <= effectiveTo.getUTCFullYear(); year++) {
    years.add(year);
  }

  const periods: ExpectedFundingPeriod[] = [];
  const termAmount = input.annualTopUpAmount / 3;

  for (const year of years) {
    for (const [startSuffix, endSuffix] of termBoundaries) {
      const startYear = startSuffix === "09-01" ? year : year + 1;
      const endYear = endSuffix === "12-31" ? year : year + 1;
      const termStart = parseDate(`${startYear}-${startSuffix}`);
      const termEnd = parseDate(`${endYear}-${endSuffix}`);

      if (termEnd < effectiveFrom || termStart > effectiveTo) {
        continue;
      }

      const activeStart = maxDate(termStart, effectiveFrom);
      const activeEnd = minDate(termEnd, effectiveTo);
      const activeDays = daysInclusive(activeStart, activeEnd);
      const termDays = daysInclusive(termStart, termEnd);

      periods.push({
        allocationId: input.allocationId,
        pupilId: input.pupilId,
        periodStart: toIsoDate(activeStart),
        periodEnd: toIsoDate(activeEnd),
        dueDate: dueDateForPeriod(termStart, firstPaymentDueDate),
        expectedAmount: roundCurrency(termAmount * (activeDays / termDays)),
        isBackdated: isBeforeMonth(termStart, firstPaymentDueDate),
      });
    }
  }

  return periods.sort((a, b) => a.periodStart.localeCompare(b.periodStart));
}

export function buildExpectedFundingSchedule(
  input: ExpectedFundingScheduleInput,
): ExpectedFundingPeriod[] {
  if (input.paymentFrequency === "annual") {
    return buildAnnualSchedule(input);
  }

  if (input.paymentFrequency === "termly") {
    return buildTermlySchedule(input);
  }

  return buildMonthlySchedule(input);
}

function receiptKey(receipt: Pick<FundingReceipt, "pupilId" | "periodStart" | "periodEnd">): string {
  return `${receipt.pupilId}:${receipt.periodStart}:${receipt.periodEnd}`;
}

function expectedKey(
  expected: Pick<ExpectedFundingPeriod, "pupilId" | "periodStart" | "periodEnd">,
): string {
  return `${expected.pupilId}:${expected.periodStart}:${expected.periodEnd}`;
}

function statusForExpectedPeriod(
  expectedAmount: number,
  receivedAmount: number,
  dueDate: string,
  asOfDate: string,
): FundingReconciliationStatus {
  const variance = roundCurrency(receivedAmount - expectedAmount);

  if (variance === 0) {
    return "matched";
  }

  if (receivedAmount > 0 && variance < 0) {
    return "underpaid";
  }

  if (variance > 0) {
    return "overpaid";
  }

  return parseDate(dueDate) <= parseDate(asOfDate) ? "overdue" : "expected_later";
}

export function reconcileFundingReceipts(
  input: FundingReconciliationInput,
): FundingReconciliationResult {
  const receiptsByPeriod = new Map<string, FundingReceipt[]>();

  for (const receipt of input.receipts) {
    const key = receiptKey(receipt);
    receiptsByPeriod.set(key, [...(receiptsByPeriod.get(key) ?? []), receipt]);
  }

  const matchedReceiptIds = new Set<string>();
  const expectedItems = input.expectedSchedule.map((expected) => {
    const matchingReceipts = receiptsByPeriod.get(expectedKey(expected)) ?? [];
    const receivedAmount = roundCurrency(
      matchingReceipts.reduce((total, receipt) => total + receipt.receivedAmount, 0),
    );
    const receiptId = matchingReceipts.map((receipt) => receipt.receiptId).join(",") || null;

    for (const receipt of matchingReceipts) {
      matchedReceiptIds.add(receipt.receiptId);
    }

    return {
      allocationId: expected.allocationId,
      pupilId: expected.pupilId,
      receiptId,
      periodStart: expected.periodStart,
      periodEnd: expected.periodEnd,
      dueDate: expected.dueDate,
      expectedAmount: expected.expectedAmount,
      receivedAmount,
      varianceAmount: roundCurrency(receivedAmount - expected.expectedAmount),
      status: statusForExpectedPeriod(
        expected.expectedAmount,
        receivedAmount,
        expected.dueDate,
        input.asOfDate,
      ),
      isBackdated: expected.isBackdated,
    } satisfies FundingReconciliationItem;
  });

  const unmatchedItems = input.receipts
    .filter((receipt) => !matchedReceiptIds.has(receipt.receiptId))
    .map(
      (receipt): FundingReconciliationItem => ({
        allocationId: null,
        pupilId: receipt.pupilId,
        receiptId: receipt.receiptId,
        periodStart: receipt.periodStart,
        periodEnd: receipt.periodEnd,
        dueDate: null,
        expectedAmount: 0,
        receivedAmount: receipt.receivedAmount,
        varianceAmount: receipt.receivedAmount,
        status: "unmatched_receipt",
        isBackdated: false,
      }),
    );

  return {
    items: [...expectedItems, ...unmatchedItems],
  };
}

export function summarizeFundingReconciliation(
  items: FundingReconciliationItem[],
): FundingReconciliationSummary {
  const expectedItems = items.filter((item) => item.status !== "unmatched_receipt");
  const outstandingItems = expectedItems.filter(
    (item) => item.varianceAmount < 0 && item.status !== "expected_later",
  );
  const unmatchedReceiptItems = items.filter((item) => item.status === "unmatched_receipt");

  return {
    expectedTotal: roundCurrency(
      expectedItems.reduce((total, item) => total + item.expectedAmount, 0),
    ),
    receivedTotal: roundCurrency(
      expectedItems.reduce((total, item) => total + item.receivedAmount, 0),
    ),
    outstandingTotal: roundCurrency(
      outstandingItems.reduce((total, item) => total + Math.abs(item.varianceAmount), 0),
    ),
    backdatedOutstandingTotal: roundCurrency(
      outstandingItems
        .filter((item) => item.isBackdated)
        .reduce((total, item) => total + Math.abs(item.varianceAmount), 0),
    ),
    varianceCount: outstandingItems.length,
    unmatchedReceiptTotal: roundCurrency(
      unmatchedReceiptItems.reduce((total, item) => total + item.receivedAmount, 0),
    ),
  };
}
