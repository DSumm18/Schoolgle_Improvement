import { describe, expect, it } from "vitest";
import { ED_CHATBOT_MODULE_ID, hasEdChatbotAccess } from "./visibility";

describe("hasEdChatbotAccess", () => {
  it("requires an active subscription and the Ed module entitlement", () => {
    expect(
      hasEdChatbotAccess({
        isActive: true,
        enabledModules: [ED_CHATBOT_MODULE_ID],
      }),
    ).toBe(true);

    expect(
      hasEdChatbotAccess({
        isActive: true,
        enabledModules: ["toolbox"],
      }),
    ).toBe(false);

    expect(
      hasEdChatbotAccess({
        isActive: false,
        enabledModules: [ED_CHATBOT_MODULE_ID],
      }),
    ).toBe(false);

    expect(hasEdChatbotAccess(null)).toBe(false);
  });
});
