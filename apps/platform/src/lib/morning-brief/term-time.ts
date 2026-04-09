/**
 * Term-Time Awareness
 *
 * Checks whether today is a school day before generating a briefing.
 * - Skip weekends
 * - Skip UK bank holidays (gov.uk API)
 * - Skip school holidays (stored per-school in Supabase settings)
 * - Still generate on INSET days (head needs to know what's happening)
 */

// ─── Weekend check ─────────────────────────────────────────────────

export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// ─── UK Bank Holidays ──────────────────────────────────────────────

let _bankHolidayCache: { dates: Set<string>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchBankHolidays(): Promise<Set<string>> {
  // Return cached if fresh
  if (_bankHolidayCache && Date.now() - _bankHolidayCache.fetchedAt < CACHE_TTL_MS) {
    return _bankHolidayCache.dates;
  }

  try {
    const response = await fetch("https://www.gov.uk/bank-holidays.json", {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn("[Term-Time] Failed to fetch bank holidays:", response.status);
      return _bankHolidayCache?.dates ?? new Set();
    }

    const data = await response.json();
    const events = data?.["england-and-wales"]?.events ?? [];
    const dates = new Set<string>(events.map((e: { date: string }) => e.date));

    _bankHolidayCache = { dates, fetchedAt: Date.now() };
    return dates;
  } catch (err) {
    console.warn("[Term-Time] Bank holiday fetch error:", err);
    return _bankHolidayCache?.dates ?? new Set();
  }
}

export async function isBankHoliday(date: Date = new Date()): Promise<boolean> {
  const dateStr = date.toISOString().slice(0, 10);
  const holidays = await fetchBankHolidays();
  return holidays.has(dateStr);
}

// ─── School Holidays (per-org) ─────────────────────────────────────

export interface SchoolHolidayPeriod {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  name: string;
}

export function isInSchoolHoliday(
  date: Date,
  holidays: SchoolHolidayPeriod[],
): boolean {
  const dateStr = date.toISOString().slice(0, 10);
  return holidays.some(
    (h) => dateStr >= h.start_date && dateStr <= h.end_date,
  );
}

// ─── Combined check ────────────────────────────────────────────────

export async function isSchoolDay(
  date: Date = new Date(),
  schoolHolidays: SchoolHolidayPeriod[] = [],
): Promise<boolean> {
  // Weekends are never school days
  if (isWeekend(date)) return false;

  // Bank holidays are not school days
  if (await isBankHoliday(date)) return false;

  // School holiday periods (INSET days should NOT be in this list)
  if (isInSchoolHoliday(date, schoolHolidays)) return false;

  return true;
}
