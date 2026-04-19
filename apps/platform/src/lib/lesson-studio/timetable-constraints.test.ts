import { describe, it, expect } from "vitest";
import {
  detectClashes,
  validatePPA,
  timesOverlap,
} from "./timetable-constraints";
import type { TimetableSlotInput } from "./timetable-constraints";

describe("timesOverlap", () => {
  it("returns true for overlapping times", () => {
    expect(timesOverlap("09:00", "10:00", "09:30", "10:30")).toBe(true);
  });

  it("returns false for non-overlapping times", () => {
    expect(timesOverlap("09:00", "10:00", "10:00", "11:00")).toBe(false);
  });
});

describe("detectClashes", () => {
  it("detects resource clash when two classes book same hall at same time", () => {
    const slots: TimetableSlotInput[] = [
      {
        classId: "class-1",
        day: 1,
        start: "09:00",
        end: "10:00",
        subject: "PE",
        resource: "Main Hall",
      },
      {
        classId: "class-2",
        day: 1,
        start: "09:30",
        end: "10:30",
        subject: "Assembly",
        resource: "Main Hall",
      },
    ];

    const clashes = detectClashes(slots);
    expect(clashes).toHaveLength(1);
    expect(clashes[0].type).toBe("resource");
    expect(clashes[0].resource).toBe("Main Hall");
    expect(clashes[0].classIds).toContain("class-1");
    expect(clashes[0].classIds).toContain("class-2");
  });

  it("returns no clash when same resource is booked at different times", () => {
    const slots: TimetableSlotInput[] = [
      {
        classId: "class-1",
        day: 1,
        start: "09:00",
        end: "10:00",
        subject: "PE",
        resource: "Main Hall",
      },
      {
        classId: "class-2",
        day: 1,
        start: "10:00",
        end: "11:00",
        subject: "Assembly",
        resource: "Main Hall",
      },
    ];

    const clashes = detectClashes(slots);
    expect(clashes).toHaveLength(0);
  });

  it("returns no clashes when no resources are assigned", () => {
    const slots: TimetableSlotInput[] = [
      {
        classId: "class-1",
        day: 1,
        start: "09:00",
        end: "10:00",
        subject: "Maths",
      },
      {
        classId: "class-2",
        day: 1,
        start: "09:00",
        end: "10:00",
        subject: "English",
      },
    ];

    const clashes = detectClashes(slots);
    expect(clashes).toHaveLength(0);
  });
});

describe("validatePPA", () => {
  it("flags a class with no PPA slot", () => {
    const slots: TimetableSlotInput[] = [
      {
        classId: "class-1",
        day: 1,
        start: "09:00",
        end: "10:00",
        subject: "Maths",
      },
    ];

    const issues = validatePPA(slots, ["class-1"]);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("no_ppa");
    expect(issues[0].classId).toBe("class-1");
    expect(issues[0].severity).toBe("error");
  });

  it("passes when a class has a PPA slot", () => {
    const slots: TimetableSlotInput[] = [
      {
        classId: "class-1",
        day: 1,
        start: "09:00",
        end: "10:00",
        subject: "Maths",
      },
      {
        classId: "class-1",
        day: 3,
        start: "14:00",
        end: "15:00",
        subject: "PPA",
      },
    ];

    const issues = validatePPA(slots, ["class-1"]);
    expect(issues).toHaveLength(0);
  });
});
