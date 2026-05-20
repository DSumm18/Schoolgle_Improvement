import { describe, expect, it } from "vitest";
import { getFishAudioWidgetConfig } from "./fish-audio-widget-config";

describe("getFishAudioWidgetConfig", () => {
  it("uses browser TTS when neither a public key nor server proxy is configured", () => {
    expect(
      getFishAudioWidgetConfig({
        publicApiKey: undefined,
        serverProxyConfigured: false,
      }),
    ).toEqual({
      fishAudioApiKey: undefined,
      ttsProvider: "browser",
    });
  });

  it("uses the server proxy placeholder only when the proxy is configured", () => {
    expect(
      getFishAudioWidgetConfig({
        publicApiKey: undefined,
        serverProxyConfigured: true,
      }),
    ).toEqual({
      fishAudioApiKey: "proxy-enabled",
      ttsProvider: "fish",
    });
  });

  it("prefers an explicitly provided public key", () => {
    expect(
      getFishAudioWidgetConfig({
        publicApiKey: " test-key ",
        serverProxyConfigured: false,
      }),
    ).toEqual({
      fishAudioApiKey: "test-key",
      ttsProvider: "fish",
    });
  });
});
