// Configuration management for Ed extension
// Reads from chrome.storage (not .env.local) for runtime config

export interface EdConfig {
  provider: 'openrouter' | 'gemini';
  openRouterApiKey?: string;
  geminiApiKey?: string;
  fishAudioApiKey?: string;
  enableAI: boolean;
  enableTTS: boolean;
  ttsProvider?: 'browser' | 'fish';
  schoolId?: string;
  language?: string;
  persona?: string;
  fishAudioVoiceIds?: {
    ed?: string;
    edwina?: string;
    santa?: string;
    elf?: string;
    headteacher?: string;
  };
}

const DEFAULT_CONFIG: EdConfig = {
  provider: 'openrouter',
  enableAI: true,
  enableTTS: true,
  ttsProvider: 'fish', // Default to Fish Audio for better voice quality
  language: 'en-GB',
  persona: 'edwina', // Default to Edwina voice
};

// Helper to get Fish Audio API key from common env var names
function getFishAudioKeyFromEnv(): string | undefined {
  // In browser context, we can't access process.env directly
  // But we can check if it was injected via a script tag or global
  if (typeof window !== 'undefined') {
    const win = window as any;
    // Check for common patterns
    return win.FISH_AUDIO_API_KEY || 
           win.NEXT_PUBLIC_FISH_AUDIO_API_KEY ||
           win.__FISH_AUDIO_KEY__;
  }
  return undefined;
}

/**
 * Load Ed configuration from chrome.storage
 * Falls back to defaults if not set
 * Safe to call in any context (checks for chrome.storage availability)
 */
export async function loadEdConfig(): Promise<EdConfig> {
  // Check if chrome.storage is available
  if (typeof chrome === 'undefined' || !chrome?.storage?.local) {
    console.warn('[Ed Config] chrome.storage not available, using defaults');
    return DEFAULT_CONFIG;
  }
  
  try {
    const result = await chrome.storage.local.get('ed_config');
    const stored = result.ed_config;
    
    if (stored && typeof stored === 'object') {
      return {
        ...DEFAULT_CONFIG,
        ...stored,
      };
    }
    
    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn('[Ed Config] Failed to load from storage, using defaults:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save Ed configuration to chrome.storage
 */
export async function saveEdConfig(config: Partial<EdConfig>): Promise<void> {
  try {
    const current = await loadEdConfig();
    const updated = { ...current, ...config };
    await chrome.storage.local.set({ ed_config: updated });
    console.log('[Ed Config] Configuration saved:', {
      provider: updated.provider,
      enableAI: updated.enableAI,
      enableTTS: updated.enableTTS,
      ttsProvider: updated.ttsProvider,
      hasKeys: {
        openrouter: !!updated.openRouterApiKey,
        gemini: !!updated.geminiApiKey,
        fish: !!updated.fishAudioApiKey,
      },
    });
  } catch (error) {
    console.error('[Ed Config] Failed to save configuration:', error);
  }
}

/**
 * Get API keys from background script (if available)
 * This allows keys to be fetched from backend API based on subscription
 * Safe to call in any context (checks for chrome.runtime availability)
 */
export async function getApiKeysFromBackground(): Promise<{
  openRouterApiKey?: string;
  geminiApiKey?: string;
  fishAudioApiKey?: string;
}> {
  // Check if chrome.runtime is available
  if (typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) {
    return {};
  }
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_API_KEYS' });
    if (response && !response.error) {
      return {
        openRouterApiKey: response.openRouterApiKey,
        geminiApiKey: response.geminiApiKey,
        fishAudioApiKey: response.fishAudioApiKey,
      };
    }
  } catch (error) {
    console.debug('[Ed Config] Could not get API keys from background:', error);
  }
  return {};
}

/**
 * Build final config for widget initialization
 * Merges storage config with API keys from background
 * Safe to call in any context (checks for chrome.storage availability)
 */
export async function buildWidgetConfig(): Promise<EdConfig> {
  // Check if we're in extension context (chrome.storage available)
  const hasChromeStorage = typeof chrome !== 'undefined' && chrome?.storage?.local;
  
  let config: EdConfig = DEFAULT_CONFIG;
  let apiKeys: { openRouterApiKey?: string; geminiApiKey?: string; fishAudioApiKey?: string } = {};
  
  if (hasChromeStorage) {
    try {
      config = await loadEdConfig();
      apiKeys = await getApiKeysFromBackground();
    } catch (error) {
      console.warn('[Ed Config] Failed to load from storage, using defaults:', error);
    }
  } else {
    console.log('[Ed Config] Not in extension context, using defaults');
  }
  
  // Merge API keys (background keys take precedence)
  const finalConfig: EdConfig = {
    ...config,
    openRouterApiKey: apiKeys.openRouterApiKey || config.openRouterApiKey,
    geminiApiKey: apiKeys.geminiApiKey || config.geminiApiKey,
    fishAudioApiKey: apiKeys.fishAudioApiKey || config.fishAudioApiKey,
  };
  
  // Log configuration
  console.log('[Ed Config] Provider:', finalConfig.provider);
  console.log('[Ed Config] TTS:', finalConfig.enableTTS ? finalConfig.ttsProvider : 'disabled');
  console.log('[Ed Config] Keys present:', {
    openrouter: !!finalConfig.openRouterApiKey,
    gemini: !!finalConfig.geminiApiKey,
    fish: !!finalConfig.fishAudioApiKey,
  });
  
  return finalConfig;
}

