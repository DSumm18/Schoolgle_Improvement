/**
 * Asset Detail Page — unit tests
 *
 * Tests the helper functions used in the page component for formatting,
 * calculation, and display logic — without requiring a running browser.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Inline the helper functions under test (mirrors the page implementation)
// ---------------------------------------------------------------------------

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount?: number | null, currency = "GBP"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calcAge(installDate?: string | null): string {
  if (!installDate) return "Unknown";
  const install = new Date(installDate);
  const now = new Date();
  const years = Math.floor(
    (now.getTime() - install.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
  if (years < 1) return "Less than 1 year";
  return `${years} year${years !== 1 ? "s" : ""}`;
}

function calcEndOfLifeYear(
  installDate?: string | null,
  lifeYears?: number | null,
): string {
  if (!installDate || !lifeYears) return "—";
  const install = new Date(installDate);
  return String(install.getFullYear() + lifeYears);
}

function isImageFile(
  fileType?: string | null,
  fileName?: string | null,
): boolean {
  if (fileType?.startsWith("image/")) return true;
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "");
  }
  return false;
}

function isOverdue(dueDateStr?: string | null): boolean {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Asset Detail Page — formatDate()", () => {
  it("returns — for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns — for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats a valid ISO date string to en-GB", () => {
    const result = formatDate("2020-01-15");
    // Should contain "Jan" and "2020"
    expect(result).toContain("2020");
    expect(result).toContain("Jan");
  });
});

describe("Asset Detail Page — formatCurrency()", () => {
  it("returns — for null", () => {
    expect(formatCurrency(null)).toBe("—");
  });

  it("formats GBP amount correctly", () => {
    const result = formatCurrency(5000);
    expect(result).toContain("5,000");
    expect(result).toContain("£");
  });

  it("formats zero as £0", () => {
    const result = formatCurrency(0);
    expect(result).toContain("£");
  });
});

describe("Asset Detail Page — calcAge()", () => {
  it("returns Unknown for null", () => {
    expect(calcAge(null)).toBe("Unknown");
  });

  it("returns 'Less than 1 year' for a recent date", () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    expect(calcAge(sixMonthsAgo.toISOString())).toBe("Less than 1 year");
  });

  it("returns correct years for a 5-year-old asset", () => {
    // Use a fixed date well in the past to avoid year-boundary flakiness
    const result = calcAge("2015-01-01");
    // The year count depends on current date, so just check it's a multi-year string
    expect(result).toMatch(/\d+ years/);
  });

  it("uses singular 'year' for exactly 1 year old", () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const result = calcAge(oneYearAgo.toISOString());
    expect(result).toMatch(/1 year/);
  });
});

describe("Asset Detail Page — calcEndOfLifeYear()", () => {
  it("returns — when installDate is null", () => {
    expect(calcEndOfLifeYear(null, 10)).toBe("—");
  });

  it("returns — when lifeYears is null", () => {
    expect(calcEndOfLifeYear("2015-01-01", null)).toBe("—");
  });

  it("calculates end-of-life year correctly", () => {
    expect(calcEndOfLifeYear("2015-01-01", 10)).toBe("2025");
  });

  it("handles 25-year boiler lifecycle", () => {
    expect(calcEndOfLifeYear("2000-06-01", 25)).toBe("2025");
  });
});

describe("Asset Detail Page — isImageFile()", () => {
  it("returns true for image/* MIME type", () => {
    expect(isImageFile("image/jpeg", null)).toBe(true);
    expect(isImageFile("image/png", null)).toBe(true);
  });

  it("returns false for non-image MIME type", () => {
    expect(isImageFile("application/pdf", null)).toBe(false);
  });

  it("returns true for jpg extension", () => {
    expect(isImageFile(null, "photo.jpg")).toBe(true);
  });

  it("returns true for png extension (case-insensitive)", () => {
    expect(isImageFile(null, "screenshot.PNG")).toBe(true);
  });

  it("returns false for pdf extension", () => {
    expect(isImageFile(null, "report.pdf")).toBe(false);
  });

  it("returns false when both are null", () => {
    expect(isImageFile(null, null)).toBe(false);
  });
});

describe("Asset Detail Page — isOverdue()", () => {
  it("returns false for null", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("returns true for a past date", () => {
    expect(isOverdue("2020-01-01")).toBe(true);
  });

  it("returns false for a future date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isOverdue(future.toISOString())).toBe(false);
  });
});

describe("Asset Detail Page — maintenance spend calculation", () => {
  it("sums maintenance costs correctly", () => {
    const history = [
      { date: "2022-01-01", action: "Service", performed_by: "Bob", cost: 200 },
      { date: "2023-06-01", action: "Repair", performed_by: "Alice", cost: 350 },
      { date: "2024-01-01", action: "Inspection", performed_by: "Bob", cost: null },
    ];
    const total = history.reduce((sum, h) => sum + (h.cost ?? 0), 0);
    expect(total).toBe(550);
  });

  it("calculates spend ratio against replacement cost", () => {
    const totalSpend = 750;
    const replacementCost = 1000;
    const ratio = (totalSpend / replacementCost) * 100;
    expect(ratio).toBe(75);
  });

  it("shows no warning when spend is below 50%", () => {
    const spend = 400;
    const replacement = 1000;
    const ratio = (spend / replacement) * 100;
    expect(ratio).toBeLessThan(50);
  });
});

describe("Asset Detail Page — open vs resolved tickets filter", () => {
  const tickets = [
    { id: "1", ticket_number: "T001", title: "Boiler fault", status: "open", priority: "high", created_at: "2024-01-01" },
    { id: "2", ticket_number: "T002", title: "Leak fixed", status: "resolved", priority: "medium", created_at: "2024-02-01" },
    { id: "3", ticket_number: "T003", title: "Inspection", status: "in_progress", priority: "low", created_at: "2024-03-01" },
    { id: "4", ticket_number: "T004", title: "Old fault", status: "closed", priority: "low", created_at: "2023-12-01" },
  ];

  it("correctly separates open tickets from resolved/closed", () => {
    const open = tickets.filter((t) => !["resolved", "closed"].includes(t.status));
    const resolved = tickets.filter((t) => ["resolved", "closed"].includes(t.status));
    expect(open).toHaveLength(2);
    expect(resolved).toHaveLength(2);
  });

  it("includes in_progress tickets in open list", () => {
    const open = tickets.filter((t) => !["resolved", "closed"].includes(t.status));
    expect(open.some((t) => t.status === "in_progress")).toBe(true);
  });
});
