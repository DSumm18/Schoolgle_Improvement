import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrgSwitcher from "./OrgSwitcher";

const organizations = [
  {
    id: "trust-a",
    name: "Alpha Learning Trust",
    organization_type: "trust",
    parent_organization_id: null,
  },
  {
    id: "pennine",
    name: "Pennine Academies Yorkshire",
    organization_type: "trust",
    parent_organization_id: null,
  },
  {
    id: "grove-house",
    name: "Grove House Primary School",
    organization_type: "school",
    parent_organization_id: "pennine",
  },
  {
    id: "clayton-village",
    name: "Clayton Village Primary School",
    organization_type: "school",
    parent_organization_id: "pennine",
  },
  {
    id: "rochdale",
    name: "Rochdale Council",
    organization_type: "local_authority",
    parent_organization_id: null,
  },
  {
    id: "rochdale-school",
    name: "Rochdale Demo Primary School",
    organization_type: "school",
    parent_organization_id: "rochdale",
  },
];

vi.mock("@/context/SupabaseAuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    session: {
      access_token: "token",
      refresh_token: "refresh",
    },
    loading: false,
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { setSession: vi.fn() },
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe("OrgSwitcher", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          organizations,
        }),
      ),
    );
  });

  it("restores the dropdown scroll position after selecting a school", async () => {
    const onOrgChange = vi.fn();

    render(<OrgSwitcher currentOrgId="pennine" onOrgChange={onOrgChange} />);

    await screen.findByRole("button", {
      name: /Pennine Academies Yorkshire/i,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Pennine Academies Yorkshire/i,
      }),
    );

    const menu = await screen.findByTestId("org-switcher-menu");
    fireEvent.scroll(menu, { target: { scrollTop: 160 } });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Grove House Primary School/i,
      }),
    );

    expect(onOrgChange).toHaveBeenCalledWith("grove-house");

    fireEvent.click(
      screen.getByRole("button", {
        name: /Grove House Primary School/i,
      }),
    );

    const reopenedMenu = await screen.findByTestId("org-switcher-menu");

    await waitFor(() => {
      expect(reopenedMenu.scrollTop).toBe(160);
    });
  });

  it("shows parent entities first and expands one group at a time", async () => {
    const onOrgChange = vi.fn();

    render(<OrgSwitcher currentOrgId="pennine" onOrgChange={onOrgChange} />);

    await screen.findByRole("button", {
      name: /Pennine Academies Yorkshire/i,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Pennine Academies Yorkshire/i,
      }),
    );

    expect(
      await screen.findByRole("button", {
        name: /Grove House Primary School/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Rochdale Demo Primary School/i,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Rochdale Council/i,
      }),
    );

    expect(
      await screen.findByRole("button", {
        name: /Rochdale Demo Primary School/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Grove House Primary School/i,
      }),
    ).not.toBeInTheDocument();
  });
});
