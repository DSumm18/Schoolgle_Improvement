// timetable-config.ts
// School day configuration types and defaults for UK primary schools.

export interface TimePeriod {
  id: string;
  start: string; // HH:MM
  end: string;
  label: string;
  type: "teaching" | "break" | "lunch" | "assembly" | "registration";
}

export interface LunchSlot {
  start: string;
  end: string;
  yearGroups: string[];
}

export interface SchoolDayConfig {
  schoolStart: string;
  schoolEnd: string;
  periods: TimePeriod[];
  breaks: TimePeriod[];
  lunchSittings: LunchSlot[];
  assemblySlot?: { day: number; start: string; end: string };
  fixedEvents: Array<{
    name: string;
    day: number;
    start: string;
    end: string;
    yearGroups: string[];
    resource?: string;
  }>;
}

/**
 * Returns sensible UK primary school defaults.
 * 5 teaching periods, morning and afternoon breaks,
 * staggered lunch sittings, Friday assembly.
 */
export function getDefaultSchoolDay(): SchoolDayConfig {
  const periods: TimePeriod[] = [
    {
      id: "period-1",
      start: "08:45",
      end: "10:00",
      label: "Period 1",
      type: "teaching",
    },
    {
      id: "period-2",
      start: "10:15",
      end: "11:30",
      label: "Period 2",
      type: "teaching",
    },
    {
      id: "period-3",
      start: "11:30",
      end: "12:00",
      label: "Period 3",
      type: "teaching",
    },
    {
      id: "period-4",
      start: "13:00",
      end: "14:15",
      label: "Period 4",
      type: "teaching",
    },
    {
      id: "period-5",
      start: "14:30",
      end: "15:15",
      label: "Period 5",
      type: "teaching",
    },
  ];

  const breaks: TimePeriod[] = [
    {
      id: "morning-break",
      start: "10:00",
      end: "10:15",
      label: "Morning Break",
      type: "break",
    },
    {
      id: "afternoon-break",
      start: "14:15",
      end: "14:30",
      label: "Afternoon Break",
      type: "break",
    },
  ];

  // Staggered lunch sittings — Nursery earliest, Year 6 latest.
  const lunchSittings: LunchSlot[] = [
    {
      start: "11:30",
      end: "12:00",
      yearGroups: ["Nursery"],
    },
    {
      start: "11:45",
      end: "12:15",
      yearGroups: ["Reception"],
    },
    {
      start: "12:00",
      end: "12:30",
      yearGroups: ["Year 1", "Year 2"],
    },
    {
      start: "12:15",
      end: "12:45",
      yearGroups: ["Year 3", "Year 4"],
    },
    {
      start: "12:30",
      end: "13:00",
      yearGroups: ["Year 5", "Year 6"],
    },
  ];

  return {
    schoolStart: "08:45",
    schoolEnd: "15:15",
    periods,
    breaks,
    lunchSittings,
    // Friday (day index 4 if Mon=0) assembly at 09:00–09:30
    assemblySlot: { day: 4, start: "09:00", end: "09:30" },
    fixedEvents: [
      {
        name: "Whole School Assembly",
        day: 4,
        start: "09:00",
        end: "09:30",
        yearGroups: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"],
        resource: "main-hall",
      },
    ],
  };
}

/**
 * Returns the appropriate time periods for the given key stage.
 * EYFS receives 3 flexible blocks suited to play-based learning.
 * KS1 and KS2 receive the full 5-period timetable.
 */
export function getPeriodsForKeyStage(
  config: SchoolDayConfig,
  keyStage: "EYFS" | "KS1" | "KS2"
): TimePeriod[] {
  if (keyStage === "EYFS") {
    return [
      {
        id: "eyfs-morning",
        start: "09:00",
        end: "11:30",
        label: "Morning Session",
        type: "teaching",
      },
      {
        id: "eyfs-afternoon-1",
        start: "13:00",
        end: "14:15",
        label: "Afternoon Session 1",
        type: "teaching",
      },
      {
        id: "eyfs-afternoon-2",
        start: "14:30",
        end: "15:15",
        label: "Afternoon Session 2",
        type: "teaching",
      },
    ];
  }

  // KS1 and KS2 get the full 5 teaching periods from config.
  return config.periods.filter((p) => p.type === "teaching");
}

/**
 * Returns the lunch sitting for a given year group string.
 * Supports prefix matching so "Year 2A" matches a sitting for "Year 2".
 */
export function getLunchSlot(
  config: SchoolDayConfig,
  yearGroup: string
): { start: string; end: string } {
  for (const sitting of config.lunchSittings) {
    for (const yg of sitting.yearGroups) {
      if (yearGroup === yg || yearGroup.startsWith(yg)) {
        return { start: sitting.start, end: sitting.end };
      }
    }
  }
  // Fallback: return the first sitting if nothing matches.
  const fallback = config.lunchSittings[0];
  return { start: fallback.start, end: fallback.end };
}

/**
 * Maps a year group label to its key stage.
 * "Nursery" / "Reception" → EYFS
 * "Year 1" / "Year 2"     → KS1
 * "Year 3" – "Year 6"     → KS2
 */
export function getKeyStageForYearGroup(
  yearGroup: string
): "EYFS" | "KS1" | "KS2" | "unknown" {
  const lower = yearGroup.toLowerCase();

  if (lower.includes("nursery") || lower.includes("reception")) {
    return "EYFS";
  }

  // Extract year number (handles "Year 2", "Year 2A", etc.)
  const match = lower.match(/year\s+(\d+)/);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year <= 2) return "KS1";
    if (year <= 6) return "KS2";
  }

  return "unknown";
}
