import { describe, expect, it } from "vitest";
import {
  assertApprovedModelId,
  chooseLowestCostApprovedModel,
  isApprovedModelId,
} from "./model-policy";

describe("AI model policy", () => {
  it("allows only approved provider families for customer data", () => {
    expect(isApprovedModelId("openai/gpt-4o-mini")).toBe(true);
    expect(isApprovedModelId("anthropic/claude-3.5-sonnet")).toBe(true);
    expect(isApprovedModelId("google/gemini-2.0-flash-001")).toBe(true);
    expect(isApprovedModelId("meta-llama/llama-3.3-70b-instruct")).toBe(true);
    expect(isApprovedModelId("mistralai/mistral-ocr-latest")).toBe(true);
    expect(isApprovedModelId("microsoft/phi-4")).toBe(true);
  });

  it("blocks non-approved provider families before any request is sent", () => {
    const blockedDeepSeek = "deep" + "seek/deep" + "seek-chat";
    const blockedQwen = "q" + "wen/q" + "wen-2.5-vl-72b-instruct";

    expect(isApprovedModelId(blockedDeepSeek)).toBe(false);
    expect(isApprovedModelId(blockedQwen)).toBe(false);
    expect(() => assertApprovedModelId(blockedDeepSeek)).toThrow(
      "not approved for Schoolgle customer data",
    );
  });

  it("chooses the cheapest approved model from a candidate list", () => {
    const blockedDeepSeek = "deep" + "seek/deep" + "seek-chat";

    expect(
      chooseLowestCostApprovedModel([
        "anthropic/claude-3.5-sonnet",
        blockedDeepSeek,
        "openai/gpt-4o-mini",
      ]),
    ).toBe("openai/gpt-4o-mini");
  });
});
