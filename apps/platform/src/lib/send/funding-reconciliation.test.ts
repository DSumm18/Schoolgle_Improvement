import { describe, expect, it } from "vitest";
import {
  buildExpectedFundingSchedule,
  reconcileFundingReceipts,
  summarizeFundingReconciliation,
} from "./funding-reconciliation";

describe("SEND funding reconciliation", () => {
  it("builds a monthly expected top-up schedule with backdating from the effective date", () => {
    const schedule = buildExpectedFundingSchedule({
      allocationId: "allocation-1",
      pupilId: "pupil-1",
      annualTopUpAmount: 12000,
      effectiveFrom: "2026-09-01",
      effectiveTo: "2027-08-31",
      paymentFrequency: "monthly",
      firstPaymentDueDate: "2026-11-01",
    });

    expect(schedule).toHaveLength(12);
    expect(schedule[0]).toMatchObject({
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      dueDate: "2026-11-01",
      expectedAmount: 1000,
      isBackdated: true,
    });
    expect(schedule[1]).toMatchObject({
      periodStart: "2026-10-01",
      periodEnd: "2026-10-31",
      dueDate: "2026-11-01",
      expectedAmount: 1000,
      isBackdated: true,
    });
    expect(schedule[2]).toMatchObject({
      periodStart: "2026-11-01",
      periodEnd: "2026-11-30",
      dueDate: "2026-11-01",
      expectedAmount: 1000,
      isBackdated: false,
    });
  });

  it("pro-rates a monthly expected amount for a mid-month end date", () => {
    const schedule = buildExpectedFundingSchedule({
      allocationId: "allocation-2",
      pupilId: "pupil-2",
      annualTopUpAmount: 12000,
      effectiveFrom: "2026-09-01",
      effectiveTo: "2026-09-15",
      paymentFrequency: "monthly",
      firstPaymentDueDate: "2026-09-30",
    });

    expect(schedule).toHaveLength(1);
    expect(schedule[0].expectedAmount).toBe(500);
  });

  it("flags matched, underpaid, overdue, expected-later, and unmatched receipts", () => {
    const expectedSchedule = buildExpectedFundingSchedule({
      allocationId: "allocation-3",
      pupilId: "pupil-3",
      annualTopUpAmount: 12000,
      effectiveFrom: "2026-09-01",
      effectiveTo: "2026-12-31",
      paymentFrequency: "monthly",
      firstPaymentDueDate: "2026-09-01",
    });

    const result = reconcileFundingReceipts({
      asOfDate: "2026-11-15",
      expectedSchedule,
      receipts: [
        {
          receiptId: "receipt-1",
          pupilId: "pupil-3",
          periodStart: "2026-09-01",
          periodEnd: "2026-09-30",
          receivedAmount: 1000,
          receivedDate: "2026-09-29",
        },
        {
          receiptId: "receipt-2",
          pupilId: "pupil-3",
          periodStart: "2026-10-01",
          periodEnd: "2026-10-31",
          receivedAmount: 750,
          receivedDate: "2026-10-31",
        },
        {
          receiptId: "receipt-unmatched",
          pupilId: "pupil-3",
          periodStart: "2027-01-01",
          periodEnd: "2027-01-31",
          receivedAmount: 999,
          receivedDate: "2026-11-01",
        },
      ],
    });

    expect(result.items.map((item) => item.status)).toEqual([
      "matched",
      "underpaid",
      "overdue",
      "expected_later",
      "unmatched_receipt",
    ]);
    expect(result.items[1]).toMatchObject({
      expectedAmount: 1000,
      receivedAmount: 750,
      varianceAmount: -250,
    });
    expect(result.items[2]).toMatchObject({
      periodStart: "2026-11-01",
      receivedAmount: 0,
      varianceAmount: -1000,
    });
  });

  it("summarises expected, received, outstanding, and backdated amounts", () => {
    const expectedSchedule = buildExpectedFundingSchedule({
      allocationId: "allocation-4",
      pupilId: "pupil-4",
      annualTopUpAmount: 12000,
      effectiveFrom: "2026-09-01",
      effectiveTo: "2026-11-30",
      paymentFrequency: "monthly",
      firstPaymentDueDate: "2026-11-01",
    });

    const result = reconcileFundingReceipts({
      asOfDate: "2026-11-15",
      expectedSchedule,
      receipts: [
        {
          receiptId: "receipt-3",
          pupilId: "pupil-4",
          periodStart: "2026-09-01",
          periodEnd: "2026-09-30",
          receivedAmount: 1000,
          receivedDate: "2026-11-01",
        },
      ],
    });

    expect(summarizeFundingReconciliation(result.items)).toEqual({
      expectedTotal: 3000,
      receivedTotal: 1000,
      outstandingTotal: 2000,
      backdatedOutstandingTotal: 1000,
      varianceCount: 2,
      unmatchedReceiptTotal: 0,
    });
  });
});
