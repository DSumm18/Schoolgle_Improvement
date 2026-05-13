import { describe, expect, it } from "vitest";
import { normalizeFoiRequest } from "./foi-tracker";

describe("normalizeFoiRequest", () => {
  it("maps API deadline fields into the UI deadline field", () => {
    expect(
      normalizeFoiRequest({
        id: "foi-1",
        requester_name: "Alex",
        description: "Budget information",
        date_received: "2026-04-01",
        deadline_date: "2026-04-29",
        status: "received",
      }),
    ).toMatchObject({
      id: "foi-1",
      requester_name: "Alex",
      subject: "Budget information",
      deadline: "2026-04-29",
      status: "received",
    });
  });
});
