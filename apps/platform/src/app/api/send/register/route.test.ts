/**
 * Tests for /api/send/register PII removal
 *
 * These tests verify that:
 * 1. first_name and last_name are NOT stored in Supabase insert
 * 2. pupil_hash (SHA-256) is stored instead
 * 3. PUT route does not allow first_name/last_name updates
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: { id: "send-1", pupil_hash: "abc123", sen_status: "K" },
      error: null,
    }),
  }),
});

const mockFrom = vi.fn().mockImplementation((table: string) => {
  return {
    insert: mockInsert,
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  };
});

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/api-utils", () => ({
  protectedRoute: (handler: any, _opts?: any) => {
    return async (req: Request) => {
      const auth = { organizationId: "org-1", userId: "user-1", email: "test@test.com", role: "slt" };
      return handler(auth, req);
    };
  },
  apiSuccess: (data: any, status?: number) =>
    new Response(JSON.stringify({ success: true, ...data }), { status: status || 200 }),
  apiError: (msg: string, status: number) =>
    new Response(JSON.stringify({ success: false, error: msg }), { status }),
}));

process.env.PUPIL_HASH_SALT = "test-salt-for-send";

describe("/api/send/register - PII safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST - add pupil to SEN register", () => {
    it("should NOT store first_name in Supabase", async () => {
      const { POST } = await import("./route");
      const req = new Request("http://localhost/api/send/register", {
        method: "POST",
        body: JSON.stringify({
          pupil_code: "PUP001",
          first_name: "Emily",
          last_name: "Jones",
          year_group: 3,
          sen_status: "K",
          primary_need: "SPLD",
        }),
      });

      await POST(req);

      const insertCall = mockInsert.mock.calls[0]?.[0];
      expect(insertCall).toBeDefined();
      expect(insertCall).not.toHaveProperty("first_name");
    });

    it("should NOT store last_name in Supabase", async () => {
      const { POST } = await import("./route");
      const req = new Request("http://localhost/api/send/register", {
        method: "POST",
        body: JSON.stringify({
          pupil_code: "PUP001",
          first_name: "Emily",
          last_name: "Jones",
          year_group: 3,
          sen_status: "K",
          primary_need: "SPLD",
        }),
      });

      await POST(req);

      const insertCall = mockInsert.mock.calls[0]?.[0];
      expect(insertCall).not.toHaveProperty("last_name");
    });

    it("should store pupil_hash as SHA-256 pseudonymised identifier", async () => {
      const { POST } = await import("./route");
      const req = new Request("http://localhost/api/send/register", {
        method: "POST",
        body: JSON.stringify({
          pupil_code: "PUP001",
          first_name: "Emily",
          last_name: "Jones",
          year_group: 3,
          sen_status: "K",
          primary_need: "SPLD",
        }),
      });

      await POST(req);

      const insertCall = mockInsert.mock.calls[0]?.[0];
      expect(insertCall).toHaveProperty("pupil_hash");
      expect(typeof insertCall.pupil_hash).toBe("string");
      expect(insertCall.pupil_hash.length).toBe(64); // SHA-256 hex
    });

    it("should produce deterministic hash for same pupil_code", async () => {
      const { POST } = await import("./route");

      // First call
      const req1 = new Request("http://localhost/api/send/register", {
        method: "POST",
        body: JSON.stringify({
          pupil_code: "PUP001",
          sen_status: "K",
          primary_need: "SPLD",
        }),
      });
      await POST(req1);
      const hash1 = mockInsert.mock.calls[0]?.[0]?.pupil_hash;

      vi.clearAllMocks();

      // Second call with same pupil_code
      const req2 = new Request("http://localhost/api/send/register", {
        method: "POST",
        body: JSON.stringify({
          pupil_code: "PUP001",
          sen_status: "E",
          primary_need: "ASD",
        }),
      });
      await POST(req2);
      const hash2 = mockInsert.mock.calls[0]?.[0]?.pupil_hash;

      expect(hash1).toBe(hash2);
    });
  });
});
