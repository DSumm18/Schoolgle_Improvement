import { describe, expect, it, vi } from "vitest";
import { saveStaffMember } from "./staff-directory-client";

describe("saveStaffMember", () => {
  it("creates a staff member with POST when no id is present", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "new-staff-id" }),
    });

    await saveStaffMember(
      {
        first_name: "Asha",
        last_name: "Patel",
        job_title: "Class Teacher",
        organization_id: "org-1",
      },
      fetchMock as unknown as typeof fetch,
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: "Asha",
        last_name: "Patel",
        job_title: "Class Teacher",
        organizationId: "org-1",
      }),
    });
  });

  it("updates a staff member with PUT when an id is present", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "staff-1" }),
    });

    await saveStaffMember(
      {
        id: "staff-1",
        first_name: "Asha",
        last_name: "Patel",
        job_title: "Phase Lead",
        organization_id: "org-1",
      },
      fetchMock as unknown as typeof fetch,
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/staff", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "staff-1",
        first_name: "Asha",
        last_name: "Patel",
        job_title: "Phase Lead",
      }),
    });
  });
});
