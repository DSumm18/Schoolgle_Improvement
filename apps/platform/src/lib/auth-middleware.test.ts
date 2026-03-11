/**
 * Auth Middleware Tests
 *
 * Tests the withAuth middleware and protectedRoute wrapper.
 * Run with: npx vitest run apps/platform/src/lib/auth-middleware.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
vi.mock("./supabase-server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { withAuth, type AuthContext } from "./auth-middleware";
import { createServerSupabaseClient } from "./supabase-server";
import { NextRequest, NextResponse } from "next/server";

function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {},
) {
  const { method = "GET", body, headers = {} } = options;
  const fullUrl = `http://localhost:3002${url}`;

  const init: any = { method, headers: new Headers(headers) };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers.set("content-type", "application/json");
  }

  return new NextRequest(fullUrl, init);
}

function mockSupabase(user: any, membership: any) {
  (createServerSupabaseClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "No user" },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: membership,
              error: membership ? null : { message: "Not found" },
            }),
          }),
        }),
      }),
    }),
  });
}

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("withAuth", () => {
    it("should return 401 when no user session exists", async () => {
      mockSupabase(null, null);

      const request = makeRequest("/api/test?organizationId=org-1");
      const handler = vi.fn();

      const response = await withAuth(request, handler);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.code).toBe("UNAUTHORIZED");
      expect(handler).not.toHaveBeenCalled();
    });

    it("should return 400 when organizationId is missing", async () => {
      mockSupabase({ id: "user-1", email: "test@school.uk" }, null);

      const request = makeRequest("/api/test");
      const handler = vi.fn();

      const response = await withAuth(request, handler);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe("MISSING_ORG");
    });

    it("should return 403 when user is not org member", async () => {
      mockSupabase({ id: "user-1", email: "test@school.uk" }, null);

      const request = makeRequest("/api/test?organizationId=org-1");
      const handler = vi.fn();

      const response = await withAuth(request, handler);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.code).toBe("FORBIDDEN");
    });

    it("should call handler with auth context for valid session", async () => {
      mockSupabase(
        { id: "user-1", email: "test@school.uk" },
        { role: "teacher" },
      );

      const request = makeRequest("/api/test?organizationId=org-1");
      const handler = vi
        .fn()
        .mockResolvedValue(NextResponse.json({ ok: true }));

      const response = await withAuth(request, handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          email: "test@school.uk",
          organizationId: "org-1",
          role: "teacher",
        }),
        expect.anything(),
      );
      expect(response.status).toBe(200);
    });

    it("should return 403 when role is insufficient", async () => {
      mockSupabase(
        { id: "user-1", email: "test@school.uk" },
        { role: "viewer" },
      );

      const request = makeRequest("/api/test?organizationId=org-1");
      const handler = vi.fn();

      const response = await withAuth(request, handler, {
        requiredRole: "slt",
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.code).toBe("INSUFFICIENT_ROLE");
      expect(handler).not.toHaveBeenCalled();
    });

    it("should allow higher roles when lower role is required", async () => {
      mockSupabase(
        { id: "user-1", email: "admin@school.uk" },
        { role: "admin" },
      );

      const request = makeRequest("/api/test?organizationId=org-1");
      const handler = vi
        .fn()
        .mockResolvedValue(NextResponse.json({ ok: true }));

      const response = await withAuth(request, handler, {
        requiredRole: "caretaker",
      });

      expect(handler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should extract organizationId from POST body", async () => {
      mockSupabase({ id: "user-1", email: "test@school.uk" }, { role: "slt" });

      const request = makeRequest("/api/test", {
        method: "POST",
        body: { organizationId: "org-from-body", data: "test" },
      });
      const handler = vi
        .fn()
        .mockResolvedValue(NextResponse.json({ ok: true }));

      const response = await withAuth(request, handler);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: "org-from-body" }),
        expect.anything(),
      );
    });
  });
});
