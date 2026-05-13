import { describe, expect, it } from "vitest";

import {
  getMeetingDocumentRecipient,
  mapMeetingTemplateToDocumentModule,
} from "./meeting-document-linking";

describe("meeting document linking", () => {
  it("maps HR meetings to HR documents", () => {
    expect(
      mapMeetingTemplateToDocumentModule({
        category: "hr",
        name: "Return to Work — Short-term Absence",
      }),
    ).toBe("hr");
  });

  it("maps operational estates assurance meetings to estates documents", () => {
    expect(
      mapMeetingTemplateToDocumentModule({
        category: "operational",
        name: "Estates Contractor Pre-start Assurance",
      }),
    ).toBe("estates");
  });

  it("maps finance-named operational meetings to finance documents", () => {
    expect(
      mapMeetingTemplateToDocumentModule({
        category: "operational",
        name: "Finance Budget Monitoring Review",
      }),
    ).toBe("finance");
  });

  it("links staff attendees as staff recipients", () => {
    expect(
      getMeetingDocumentRecipient({
        meeting: {
          attendee_name: "Jane Smith",
          attendee_role: "Teacher",
        },
        attendees: [
          {
            staff_id: "staff-1",
            attendee_name: "Jane Smith",
            attendee_email: "jane@example.com",
            is_primary: true,
          },
        ],
      }),
    ).toEqual({
      recipient_type: "staff",
      recipient_id: "staff-1",
      recipient_name: "Jane Smith",
      recipient_email: "jane@example.com",
    });
  });
});
