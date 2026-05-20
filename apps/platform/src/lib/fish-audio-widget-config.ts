export type FishAudioWidgetConfig = {
  fishAudioApiKey?: string;
  ttsProvider: "browser" | "fish";
};

type FishAudioWidgetConfigInput = {
  publicApiKey?: string;
  serverProxyConfigured: boolean;
};

export function getFishAudioWidgetConfig({
  publicApiKey,
  serverProxyConfigured,
}: FishAudioWidgetConfigInput): FishAudioWidgetConfig {
  const trimmedPublicKey = publicApiKey?.trim();

  if (trimmedPublicKey) {
    return {
      fishAudioApiKey: trimmedPublicKey,
      ttsProvider: "fish",
    };
  }

  if (serverProxyConfigured) {
    return {
      fishAudioApiKey: "proxy-enabled",
      ttsProvider: "fish",
    };
  }

  return {
    fishAudioApiKey: undefined,
    ttsProvider: "browser",
  };
}
