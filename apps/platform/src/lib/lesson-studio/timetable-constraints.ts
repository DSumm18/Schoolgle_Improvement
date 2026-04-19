export interface TimetableSlotInput {
  classId: string;
  day: number; // 1-5
  start: string; // HH:MM
  end: string;
  subject: string;
  resource?: string; // e.g. "Main Hall"
}

export interface TimetableClash {
  type: "resource" | "teacher" | "room";
  day: number;
  start: string;
  end: string;
  resource?: string;
  classIds: string[];
  message: string;
}

export interface TimetableIssue {
  type: "no_ppa" | "ppa_too_short" | "missing_subject";
  classId: string;
  message: string;
  severity: "error" | "warning";
}

/**
 * Returns true if time range [s1, e1) overlaps with [s2, e2).
 * Touching boundaries (e.g. 10:00–11:00 and 11:00–12:00) are NOT considered overlapping.
 */
export function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 < e2 && s2 < e1;
}

/**
 * Detect resource clashes: two or more classes booking the same named resource
 * on the same day at overlapping times.
 */
export function detectClashes(slots: TimetableSlotInput[]): TimetableClash[] {
  const clashes: TimetableClash[] = [];

  // Only consider slots that have a resource assigned
  const resourceSlots = slots.filter((s) => s.resource);

  for (let i = 0; i < resourceSlots.length; i++) {
    for (let j = i + 1; j < resourceSlots.length; j++) {
      const a = resourceSlots[i];
      const b = resourceSlots[j];

      if (
        a.resource === b.resource &&
        a.day === b.day &&
        timesOverlap(a.start, a.end, b.start, b.end)
      ) {
        clashes.push({
          type: "resource",
          day: a.day,
          start: a.start < b.start ? a.start : b.start,
          end: a.end > b.end ? a.end : b.end,
          resource: a.resource,
          classIds: [a.classId, b.classId],
          message: `Resource clash: "${a.resource}" is double-booked on day ${a.day} between ${a.start}–${a.end} (${a.classId}) and ${b.start}–${b.end} (${b.classId}).`,
        });
      }
    }
  }

  return clashes;
}

/**
 * Validate PPA allocation for each class.
 * A class must have at least one slot where subject === "PPA" (case-insensitive).
 */
export function validatePPA(
  slots: TimetableSlotInput[],
  classIds: string[]
): TimetableIssue[] {
  const issues: TimetableIssue[] = [];

  for (const classId of classIds) {
    const classSlots = slots.filter((s) => s.classId === classId);
    const hasPPA = classSlots.some(
      (s) => s.subject.trim().toUpperCase() === "PPA"
    );

    if (!hasPPA) {
      issues.push({
        type: "no_ppa",
        classId,
        message: `Class "${classId}" has no PPA slot scheduled. Every class must have at least one PPA session per week.`,
        severity: "error",
      });
    }
  }

  return issues;
}
