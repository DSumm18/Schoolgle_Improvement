import { describe, expect, it } from "vitest";
import { resolveStaffTaskAssignment } from "./staff-assignment";

const staff = [
  {
    id: "staff-dsl",
    display_name: "Asha Patel",
    email: "asha.patel@example.sch.uk",
    job_title: "Designated Safeguarding Lead",
    role_category: "safeguarding",
  },
  {
    id: "staff-admin",
    display_name: "Ben Carter",
    email: "ben.carter@example.sch.uk",
    job_title: "School Business Manager",
    role_category: "admin",
  },
];

const users = [
  {
    id: "user-asha",
    email: "ASHA.PATEL@example.sch.uk",
    display_name: "Asha P.",
  },
  {
    id: "user-head",
    email: "head@example.sch.uk",
    display_name: "Headteacher",
  },
];

describe("resolveStaffTaskAssignment", () => {
  it("routes an imported staff member to their user account when email matches", () => {
    expect(
      resolveStaffTaskAssignment({
        requestedAssigneeId: "staff-dsl",
        staff,
        users,
      }),
    ).toEqual({
      assigneeUserId: "user-asha",
      ownerName: "Asha Patel",
      staffId: "staff-dsl",
      staffEmail: "asha.patel@example.sch.uk",
      staffJobTitle: "Designated Safeguarding Lead",
      staffRoleCategory: "safeguarding",
      userMatchedByEmail: true,
    });
  });

  it("keeps staff-only assignments visible even when the staff member has no login", () => {
    expect(
      resolveStaffTaskAssignment({
        requestedAssigneeId: "staff-admin",
        staff,
        users,
      }),
    ).toMatchObject({
      assigneeUserId: null,
      ownerName: "Ben Carter",
      staffId: "staff-admin",
      staffEmail: "ben.carter@example.sch.uk",
      userMatchedByEmail: false,
    });
  });

  it("preserves legacy user-id assignments when no staff row matches", () => {
    expect(
      resolveStaffTaskAssignment({
        requestedAssigneeId: "user-head",
        staff,
        users,
      }),
    ).toMatchObject({
      assigneeUserId: "user-head",
      ownerName: "Headteacher",
      staffId: null,
      userMatchedByEmail: false,
    });
  });
});
