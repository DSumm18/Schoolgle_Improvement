import { describe, expect, it, vi } from "vitest";
import { getSubscriptionState } from "./state";

function mockSupabase(data: Record<string, unknown> | null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
            })),
          })),
        })),
      })),
    })),
  };
}

describe("subscription state", () => {
  it("returns only explicitly enabled modules and apps", async () => {
    const supabase = mockSupabase({
      status: "active",
      enabled_modules: ["maintenance-tickets", "class-builder"],
      trial_end: null,
      current_period_end: "2099-01-01T00:00:00.000Z",
    });

    const state = await getSubscriptionState(supabase as never, "org-1");

    expect(state.enabledModules).toEqual(["maintenance-tickets", "class-builder"]);
    expect(state.enabledModules).not.toContain("toolbox");
  });
});
