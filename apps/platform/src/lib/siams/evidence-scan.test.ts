import { describe, expect, it } from "vitest";
import { matchSiamsEvidence } from "./evidence-scan";

describe("matchSiamsEvidence", () => {
  it("matches collective worship evidence to worship questions", () => {
    const matches = matchSiamsEvidence({
      fileName: "Collective_Worship_Planning_and_Impact_2025.docx",
      folderPath: "SIAMS Readiness/Collective Worship",
    });

    expect(matches.some((match) => match.strand_id === "worship")).toBe(true);
    expect(matches[0].confidence).not.toBe("LOW");
  });

  it("matches RE evidence to religious education questions", () => {
    const matches = matchSiamsEvidence({
      fileName: "RE_Curriculum_Statement_of_Entitlement_Audit.pdf",
      folderPath: "SIAMS Readiness/Religious Education",
    });

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          strand_id: "re",
          question_id: "re-1",
        }),
      ]),
    );
  });

  it("ignores generic files without useful SIAMS signals", () => {
    const matches = matchSiamsEvidence({
      fileName: "general-notes.docx",
      folderPath: "SIAMS Readiness/00 Inbox - To Sort",
    });

    expect(matches).toHaveLength(0);
  });
});
