import { describe, expect, it } from "vitest";
import {
  buildDefaultDestinationClasses,
  classBuilderCohortLabel,
  classBuilderYearStorageAliases,
  formatClassBuilderCohortYearGroups,
  generateClassGroups,
  parseClassBuilderPupilCsv,
  parseClassBuilderSessionYearGroups,
  validateClassBuilderSubmission,
  type ClassBuilderChoiceInput,
  type ClassBuilderPupil,
  type ClassBuilderSessionState,
} from "./class-builder";

const pupils: ClassBuilderPupil[] = [
  {
    id: "p1",
    first_name: "Ava",
    last_name: "Adams",
    year_group: "4",
    current_class: "4A",
    gender: "F",
    send_status: null,
    ehcp: false,
  },
  {
    id: "p2",
    first_name: "Ben",
    last_name: "Brown",
    year_group: "4",
    current_class: "4A",
    gender: "M",
    send_status: null,
    ehcp: false,
  },
  {
    id: "p3",
    first_name: "Cara",
    last_name: "Cole",
    year_group: "4",
    current_class: "4B",
    gender: "F",
    send_status: "K",
    ehcp: false,
  },
  {
    id: "p4",
    first_name: "Dan",
    last_name: "Dunn",
    year_group: "4",
    current_class: "4B",
    gender: "M",
    send_status: "E",
    ehcp: true,
  },
  {
    id: "p5",
    first_name: "Eli",
    last_name: "Evans",
    year_group: "4",
    current_class: "4C",
    gender: "M",
    send_status: null,
    ehcp: false,
  },
  {
    id: "p6",
    first_name: "Faye",
    last_name: "Fox",
    year_group: "4",
    current_class: "4C",
    gender: "F",
    send_status: null,
    ehcp: false,
  },
];

const openSession: ClassBuilderSessionState = {
  id: "session-1",
  status: "open",
};

function choice(
  chooserPupilId: string,
  chosenPupilId: string,
  choiceType: "friendship" | "work_well",
  rank: number,
): ClassBuilderChoiceInput {
  return {
    chooser_pupil_id: chooserPupilId,
    chosen_pupil_id: chosenPupilId,
    choice_type: choiceType,
    rank,
  };
}

describe("class builder cohort helpers", () => {
  it("normalises flexible multi-year survey cohorts", () => {
    expect(formatClassBuilderCohortYearGroups(["Year 1", "Reception", "Y1"])).toBe(
      "R,1",
    );
    expect(parseClassBuilderSessionYearGroups("Year R,Year 1")).toEqual(["R", "1"]);
    expect(parseClassBuilderSessionYearGroups("R,1")).toEqual(["R", "1"]);
    expect(classBuilderCohortLabel("R,1")).toBe("Reception + Year 1");
    expect(classBuilderYearStorageAliases(["R", "1"])).toEqual(
      expect.arrayContaining(["R", "Reception", "Year R", "1", "Year 1", "Y1"]),
    );
  });
});

describe("validateClassBuilderSubmission", () => {
  it("rejects self-selection", () => {
    const result = validateClassBuilderSubmission({
      session: openSession,
      pupilId: "p1",
      cohortPupilIds: pupils.map((pupil) => pupil.id),
      choices: [choice("p1", "p1", "friendship", 1)],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Pupils cannot choose themselves.");
  });

  it("rejects duplicate choices for the same type", () => {
    const result = validateClassBuilderSubmission({
      session: openSession,
      pupilId: "p1",
      cohortPupilIds: pupils.map((pupil) => pupil.id),
      choices: [
        choice("p1", "p2", "friendship", 1),
        choice("p1", "p2", "friendship", 2),
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Each friendship choice must name a different pupil.",
    );
  });

  it("rejects responses for closed sessions", () => {
    const result = validateClassBuilderSubmission({
      session: { id: "session-1", status: "closed" },
      pupilId: "p1",
      cohortPupilIds: pupils.map((pupil) => pupil.id),
      choices: [choice("p1", "p2", "friendship", 1)],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("This survey session is closed.");
  });

  it("rejects choices outside the session cohort", () => {
    const result = validateClassBuilderSubmission({
      session: openSession,
      pupilId: "p1",
      cohortPupilIds: pupils.map((pupil) => pupil.id),
      choices: [choice("p1", "outside", "work_well", 1)],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Choices can only include pupils in this session cohort.",
    );
  });
});

describe("parseClassBuilderPupilCsv", () => {
  it("parses exported spreadsheet pupil rows", () => {
    const result = parseClassBuilderPupilCsv(`first_name,last_name,year_group,current_class,gender,send_status,ehcp
Ava,Adams,4,4A,F,,false
Dan,Dunn,4,4B,M,E,true`);

    expect(result.errors).toEqual([]);
    expect(result.pupils).toEqual([
      expect.objectContaining({
        first_name: "Ava",
        last_name: "Adams",
        year_group: "4",
        current_class: "4A",
        gender: "F",
        ehcp: false,
      }),
      expect.objectContaining({
        first_name: "Dan",
        last_name: "Dunn",
        send_status: "E",
        ehcp: true,
      }),
    ]);
  });

  it("reports rows missing required pupil fields", () => {
    const result = parseClassBuilderPupilCsv(`first_name,last_name,year_group,current_class
Ava,,4,4A`);

    expect(result.pupils).toEqual([]);
    expect(result.errors).toContain("Row 2 is missing last_name.");
  });
});

describe("generateClassGroups", () => {
  it("keeps mutual friendship pairs together where balance allows", () => {
    const result = generateClassGroups({
      pupils,
      choices: [
        choice("p1", "p2", "friendship", 1),
        choice("p2", "p1", "friendship", 1),
        choice("p3", "p4", "friendship", 1),
        choice("p4", "p3", "friendship", 1),
        choice("p5", "p6", "work_well", 1),
        choice("p6", "p5", "work_well", 1),
      ],
      targetClassCount: 3,
    });

    expect(result.groups).toHaveLength(3);
    expect(result.groups.every((group) => group.pupilIds.length === 2)).toBe(
      true,
    );
    expect(result.summary.mutualFriendshipsKept).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pupilIds: ["p1", "p2"] }),
        expect.objectContaining({ pupilIds: ["p3", "p4"] }),
      ]),
    );
    expect(result.summary.tradeOffs).toEqual(expect.any(Array));
    expect(result.summary.balance.gender).toBeDefined();
    expect(result.summary.selectionCounts.highDemand).toEqual(
      expect.any(Array),
    );
  });

  it("applies mixed-year destination class rules", () => {
    const mixedPupils: ClassBuilderPupil[] = [
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `y4-${index + 1}`,
        first_name: `Year4${index + 1}`,
        last_name: "Pupil",
        year_group: "4",
        current_class: "Rowan",
        gender: index % 2 === 0 ? "F" : "M",
        send_status: null,
        ehcp: false,
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `y5-${index + 1}`,
        first_name: `Year5${index + 1}`,
        last_name: "Pupil",
        year_group: "5",
        current_class: "Willow",
        gender: index % 2 === 0 ? "F" : "M",
        send_status: null,
        ehcp: false,
      })),
    ];

    const result = generateClassGroups({
      pupils: mixedPupils,
      choices: [],
      targetClassCount: 3,
      destinationClasses: buildDefaultDestinationClasses("4,5", 3),
    });

    expect(result.groups.map((group) => group.name)).toEqual([
      "Year 5",
      "Year 5/6",
      "Year 6",
    ]);
    expect(result.groups.map((group) => group.pupilIds.length)).toEqual([
      4,
      4,
      4,
    ]);

    const pupilById = new Map(mixedPupils.map((pupil) => [pupil.id, pupil]));
    const year5Group = result.groups.find((group) => group.name === "Year 5");
    const mixedGroup = result.groups.find((group) => group.name === "Year 5/6");
    const year6Group = result.groups.find((group) => group.name === "Year 6");

    expect(year5Group?.pupilIds.every((id) => pupilById.get(id)?.year_group === "4")).toBe(true);
    expect(year6Group?.pupilIds.every((id) => pupilById.get(id)?.year_group === "5")).toBe(true);
    expect(
      mixedGroup?.pupilIds.some((id) => pupilById.get(id)?.year_group === "4"),
    ).toBe(true);
    expect(
      mixedGroup?.pupilIds.some((id) => pupilById.get(id)?.year_group === "5"),
    ).toBe(true);
  });
});
