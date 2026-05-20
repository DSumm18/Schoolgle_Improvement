import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSubscriptionState } from "@/lib/subscription/state";
import { getEnabledConnectorAppKeys } from "./connector-entitlements";

vi.mock("@/lib/subscription/state", () => ({
  getSubscriptionState: vi.fn(),
}));

describe("connector entitlements", () => {
  beforeEach(() => {
    vi.mocked(getSubscriptionState).mockReset();
  });

  it("returns connector app keys from the organization's subscription state", async () => {
    vi.mocked(getSubscriptionState).mockResolvedValue({
      organizationId: "org-1",
      status: "active",
      enabledModules: ["toolbox", "ofsted-readiness", "estates-compliance"],
      trialEnd: null,
      periodEnd: null,
      effectiveEnd: null,
      daysRemaining: null,
      isActive: true,
      isTrialing: false,
      isExpired: false,
    });

    await expect(getEnabledConnectorAppKeys({} as never, "org-1")).resolves.toEqual([
      "ofsted-readiness",
      "estates",
    ]);
  });
});
