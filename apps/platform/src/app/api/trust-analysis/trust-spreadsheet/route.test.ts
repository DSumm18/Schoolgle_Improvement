import { beforeEach, describe, expect, it, vi } from "vitest";

let requestedSpreadsheetOrgId: string | null = null;

vi.mock("@/lib/api-utils", () => ({
  protectedRoute: (handler: any) => async (req: Request) => handler(
    {
      organizationId: "child-school",
      userId: "user-1",
      email: "user@example.com",
      role: "admin",
    },
    req,
  ),
  apiSuccess: (data: any, status?: number) =>
    new Response(JSON.stringify({ success: true, ...data }), { status: status || 200 }),
  apiError: (error: string, status: number) =>
    new Response(JSON.stringify({ success: false, error }), { status }),
}));

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => {
      if (table === "organization_members") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { role: "admin" }, error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "trust_spreadsheets") {
        const builder = {
          select: () => builder,
          eq: (_column: string, value: string) => {
            requestedSpreadsheetOrgId = value;
            return builder;
          },
          order: async () => ({
            data: valueRows(requestedSpreadsheetOrgId),
            error: null,
          }),
          maybeSingle: async () => ({
            data: valueRows(requestedSpreadsheetOrgId)[0] ?? null,
            error: null,
          }),
        };
        return builder;
      }

      throw new Error(`Unexpected table ${table}`);
    },
  }),
}));

function valueRows(orgId: string | null) {
  if (orgId !== "parent-trust") return [];
  return [
    {
      file_name: "Trust capture.xlsx",
      parsed_data: { schools: ["GHPS", "HPS"], data: {} },
      uploaded_by: "user-1",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      capture_period: "mid_year",
    },
  ];
}

describe("/api/trust-analysis/trust-spreadsheet", () => {
  beforeEach(() => {
    requestedSpreadsheetOrgId = null;
    vi.resetModules();
  });

  it("does not resolve a school organization up to its parent trust", async () => {
    const { GET } = await import("./route");
    const req = {
      nextUrl: new URL("http://localhost/api/trust-analysis/trust-spreadsheet?organizationId=child-school"),
    } as any;

    const res = await GET(req);
    const body = await res.json();

    expect(requestedSpreadsheetOrgId).toBe("child-school");
    expect(body.current).toBeNull();
    expect(body.captures).toEqual({});
  });

  it("still returns trust-wide captures when the selected org is the trust", async () => {
    const { GET } = await import("./route");
    const req = {
      nextUrl: new URL("http://localhost/api/trust-analysis/trust-spreadsheet?organizationId=parent-trust"),
    } as any;

    const res = await GET(req);
    const body = await res.json();

    expect(requestedSpreadsheetOrgId).toBe("parent-trust");
    expect(body.current.parsed_data.schools).toEqual(["GHPS", "HPS"]);
  });
});
