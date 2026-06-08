import { describe, expect, it } from "vitest";
import {
  buildPupilProfileCards,
  buildPupilDataInventory,
  formatPupilDisplayName,
} from "./pupil-profile-spine";

describe("pupil profile spine", () => {
  it("formats a pupil display name without hiding incomplete import data", () => {
    expect(formatPupilDisplayName({ first_name: "Ada", last_name: "Lovelace", pupil_id: "P001" })).toBe("Ada Lovelace");
    expect(formatPupilDisplayName({ first_name: "", last_name: "", pupil_id: "P002" })).toBe("Pupil P002");
  });

  it("builds module cards that keep core profile and SEND records separate", () => {
    const cards = buildPupilProfileCards({
      pupil: {
        id: "pupil-uuid",
        pupil_id: "P001",
        first_name: "Ada",
        last_name: "Lovelace",
        year_group: "4",
        current_class: "4A",
        send_status: "E",
        ehcp: true,
        is_active: true,
      },
      modules: {
        send: {
          register: {
            id: "send-1",
            sen_status: "E",
            primary_need: "ASD",
            has_ehcp: true,
            date_identified: "2025-09-01",
          },
          activeProvisions: 2,
          openActions: 1,
        },
        assessmentWork: { evidenceItems: 3 },
      },
    });

    expect(cards.map((card) => card.id)).toEqual(["overview", "send", "assessment-work", "gdpr"]);
    expect(cards.find((card) => card.id === "send")?.status).toBe("EHCP");
    expect(cards.find((card) => card.id === "assessment-work")?.metric).toBe("3");
  });

  it("declares a GDPR inventory across core and app-owned pupil records", () => {
    const inventory = buildPupilDataInventory(["core", "send", "assessment-work"]);

    expect(inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ moduleId: "core", includedInDsarExport: true }),
        expect.objectContaining({ moduleId: "send", sensitivity: "special_category", includedInDsarExport: true }),
        expect.objectContaining({ moduleId: "assessment-work", retentionOwner: "school_policy" }),
      ]),
    );
  });
});
