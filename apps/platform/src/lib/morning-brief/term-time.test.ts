/**
 * Term-Time Awareness Tests
 *
 * Tests weekend, bank holiday, and school holiday checking.
 * Run with: npx vitest run apps/platform/src/lib/morning-brief/term-time.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { isWeekend, isInSchoolHoliday, isSchoolDay, isBankHoliday } from "./term-time";

// Mock fetch for bank holiday API
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Term-Time Awareness", () => {
  describe("isWeekend", () => {
    it("should return true for Saturday", () => {
      // 2026-04-11 is a Saturday
      expect(isWeekend(new Date("2026-04-11T10:00:00Z"))).toBe(true);
    });

    it("should return true for Sunday", () => {
      // 2026-04-12 is a Sunday
      expect(isWeekend(new Date("2026-04-12T10:00:00Z"))).toBe(true);
    });

    it("should return false for Monday", () => {
      // 2026-04-06 is a Monday
      expect(isWeekend(new Date("2026-04-06T10:00:00Z"))).toBe(false);
    });

    it("should return false for Wednesday", () => {
      // 2026-04-08 is a Wednesday
      expect(isWeekend(new Date("2026-04-08T10:00:00Z"))).toBe(false);
    });
  });

  describe("isInSchoolHoliday", () => {
    const holidays = [
      { start_date: "2026-04-06", end_date: "2026-04-17", name: "Easter" },
      { start_date: "2026-07-22", end_date: "2026-09-01", name: "Summer" },
    ];

    it("should return true for a date within a holiday period", () => {
      expect(isInSchoolHoliday(new Date("2026-04-10T10:00:00Z"), holidays)).toBe(true);
    });

    it("should return true for the first day of a holiday", () => {
      expect(isInSchoolHoliday(new Date("2026-04-06T10:00:00Z"), holidays)).toBe(true);
    });

    it("should return true for the last day of a holiday", () => {
      expect(isInSchoolHoliday(new Date("2026-04-17T10:00:00Z"), holidays)).toBe(true);
    });

    it("should return false for a date outside all holidays", () => {
      expect(isInSchoolHoliday(new Date("2026-05-01T10:00:00Z"), holidays)).toBe(false);
    });

    it("should return false when no holidays are defined", () => {
      expect(isInSchoolHoliday(new Date("2026-04-10T10:00:00Z"), [])).toBe(false);
    });
  });

  describe("isBankHoliday", () => {
    it("should return true for a known bank holiday", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          "england-and-wales": {
            events: [
              { date: "2026-04-03", title: "Good Friday" },
              { date: "2026-04-06", title: "Easter Monday" },
            ],
          },
        }),
      });

      const result = await isBankHoliday(new Date("2026-04-03T10:00:00Z"));
      expect(result).toBe(true);
    });

    it("should return false for a non-bank-holiday", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          "england-and-wales": {
            events: [{ date: "2026-04-03", title: "Good Friday" }],
          },
        }),
      });

      const result = await isBankHoliday(new Date("2026-04-09T10:00:00Z"));
      expect(result).toBe(false);
    });
  });

  describe("isSchoolDay", () => {
    it("should return false for a Saturday", async () => {
      const result = await isSchoolDay(new Date("2026-04-11T10:00:00Z"));
      expect(result).toBe(false);
    });

    it("should return false for a date in school holidays", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ "england-and-wales": { events: [] } }),
      });

      const holidays = [{ start_date: "2026-04-06", end_date: "2026-04-17", name: "Easter" }];
      const result = await isSchoolDay(new Date("2026-04-08T10:00:00Z"), holidays);
      expect(result).toBe(false);
    });

    it("should return true for a normal weekday with no holidays", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ "england-and-wales": { events: [] } }),
      });

      const result = await isSchoolDay(new Date("2026-05-05T10:00:00Z"));
      expect(result).toBe(true);
    });
  });
});
