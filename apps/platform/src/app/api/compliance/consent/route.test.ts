/**
 * Tests for /api/compliance/consent PII removal
 *
 * These tests verify that:
 * 1. pupil_name is replaced with pupil_hash (SHA-256 pseudonymised)
 * 2. parent_guardian_name is NOT stored in Supabase
 * 3. parent_guardian_email is NOT stored in Supabase
 * 4. Audit log does NOT contain pupil_name
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the modules before importing route
const mockInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: { id: "consent-1", organization_id: "org-1", pupil_hash: "abc123hash", consent_type: "photo" },
      error: null,
    }),
  }),
});

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: "consent-1", organization_id: "org-1" },
        error: null,
      }),
    }),
  }),
});

const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (table === "compliance_audit_log") {
    return { insert: vi.fn().mockResolvedValue({ error: null }) };
  }
  return {
    insert: mockInsert,
    update: mockUpdate,
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
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

// Set the hash salt env var
process.env.PUPIL_HASH_SALT = "test-salt-for-consent";

describe("/api/compliance/consent - PII safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST - create consent record", () => {
    it("should NOT store pupil_name in Supabase insert", async () => {
      const { POST } = await import("./route");
      const req = new Request("http://localhost/api/compliance/consent", {
        method: "POST",
        body: JSON.stringify({
          pupil_name: "Emily Jones",
          pupil_id: "PUP001",
          parent_guardian_name: "Mrs Jones",
          parent_guardian_email: "jones@example.com",
          consent_type: "photo",
          consent_given: true,
        }),
      });

      await POST(req);

      // Get the insert call args
      const insertCall = mockInsert.mock.calls[0]?.[0];
      expect(insertCall).toBeDefined();

      // MUST NOT contain pupil_name — this is PII
      expect(insertCall).not.toHaveProperty("pupil_name");

      // MUST contain pupil_hash instead
      expect(insertCall).toHaveProperty("pupil_hash");
      expect(typeof insertCall.pupil_hash).toBe("string");
      expect(insertCall.pupil_hash.length).toBe(64); // SHA-256 hex = 64 chars
    });

    it("should NOT store parent_guardian_name in Supabase", async () => {
      const { POST } = await import("./route");
      const req = new Request("http://localhost/api/compliance/consent", {
        method: "POST",
        body: JSON.stringify({
          pupil_name: "Emily Jones",
          pupil_id: "PUP001",
          parent_guardian_name: "Mrs Jones",
          parent_guardian_email: "jones@example.com",
          consent_type: "photo",
        }),
      });

      await POST(req);

      const insertCall = mockInsert.mock.calls[0]?.[0];
      expect(insertCall).not.toHaveProperty("parent_guardian_name");
    });

    it("should NOT store parent_guardian_email in Supabase", async () => {
      const { POST } = await import("./route");
      const req = new Request("http://localhost/api/compliance/consent", {
        method: "POST",
        body: JSON.stringify({
          pupil_name: "Emily Jones",
          pupil_id: "PUP001",
          parent_guardian_name: "Mrs Jones",
          parent_guardian_email: "jones@example.com",
          consent_type: "photo",
        }),
      });

      await POST(req);

      const insertCall = mockInsert.mock.calls[0]?.[0];
      expect(insertCall).not.toHaveProperty("parent_guardian_email");
    });

    it("should NOT include pupil_name in audit log metadata", async () => {
      const { POST } = await import("./route");

      // Track audit log insert
      let auditMetadata: any = null;
      mockFrom.mockImplementation((table: string) => {
        if (table === "compliance_audit_log") {
          return {
            insert: vi.fn().mockImplementation((data: any) => {
              auditMetadata = data.metadata;
              return Promise.resolve({ error: null });
            }),
          };
        }
        return {
          insert: mockInsert,
          update: mockUpdate,
        };
      });

      const req = new Request("http://localhost/api/compliance/consent", {
        method: "POST",
        body: JSON.stringify({
          pupil_name: "Emily Jones",
          pupil_id: "PUP001",
          consent_type: "photo",
          consent_given: true,
        }),
      });

      await POST(req);

      expect(auditMetadata).toBeDefined();
      expect(auditMetadata).not.toHaveProperty("pupil_name");
    });

    it("should require pupil_hash or pupil_id, not pupil_name for validation", async () => {
      const { POST } = await import("./route");

      // Request with no pupil_id and no pupil_hash — should fail
      const req = new Request("http://localhost/api/compliance/consent", {
        method: "POST",
        body: JSON.stringify({
          consent_type: "photo",
          consent_given: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("PUT - update consent record", () => {
    it("should NOT allow pupil_name in allowed update fields", async () => {
      const { PUT } = await import("./route");
      const req = new Request("http://localhost/api/compliance/consent", {
        method: "PUT",
        body: JSON.stringify({
          id: "consent-1",
          pupil_name: "Changed Name",
          parent_guardian_name: "New Guardian",
          parent_guardian_email: "new@example.com",
        }),
      });

      await PUT(req);

      const updateCall = mockUpdate.mock.calls[0]?.[0];
      expect(updateCall).not.toHaveProperty("pupil_name");
      expect(updateCall).not.toHaveProperty("parent_guardian_name");
      expect(updateCall).not.toHaveProperty("parent_guardian_email");
    });
  });
});
