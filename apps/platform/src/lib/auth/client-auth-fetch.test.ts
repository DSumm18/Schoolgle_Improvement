import { describe, expect, it, vi } from "vitest";
import { buildClientAuthHeaders } from "./client-auth-fetch";

describe("buildClientAuthHeaders", () => {
  it("adds the Supabase bearer token while preserving existing headers", async () => {
    const supabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: "abc123" } },
        }),
      },
    };

    const headers = await buildClientAuthHeaders(supabase as never, {
      "Content-Type": "application/json",
    });

    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer abc123",
    });
  });

  it("leaves headers unchanged when no session is available", async () => {
    const supabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    };

    await expect(
      buildClientAuthHeaders(supabase as never, { Accept: "application/json" }),
    ).resolves.toEqual({ Accept: "application/json" });
  });
});
