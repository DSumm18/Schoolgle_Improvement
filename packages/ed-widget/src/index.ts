/**
 * Ed Widget - Embeddable AI School Assistant
 * Entry point that creates and mounts the widget
 */

import { Ed } from './Ed';
import type { EdConfig } from './types';
import './styles/main.css';

// Global interface for the widget
declare global {
  interface Window {
    EdWidget: typeof EdWidget;
    __ED_INSTANCE__?: Ed;
  }
}

/**
 * EdWidget - The main entry point for embedding Ed
 */
const EdWidget = {
  /**
   * Initialize Ed widget on the page
   */
  init(config: Partial<EdConfig> = {}): Ed {
    if (window.__ED_INSTANCE__) {
      console.warn('[Ed] Widget already initialized');
      return window.__ED_INSTANCE__;
    }

    const ed = new Ed(config);
    window.__ED_INSTANCE__ = ed;
    return ed;
  },

  /**
   * Get the current Ed instance
   */
  getInstance(): Ed | undefined {
    return window.__ED_INSTANCE__;
  },

  /**
   * Destroy the Ed widget
   */
  destroy(): void {
    if (window.__ED_INSTANCE__) {
      window.__ED_INSTANCE__.destroy();
      delete window.__ED_INSTANCE__;
    }
  },
};

// Auto-init from script tag attributes
function autoInit() {
  // Only auto-init if not already initialized and if we're in a script tag context
  if (window.__ED_INSTANCE__) {
    return; // Already initialized
  }

  const script = document.currentScript as HTMLScriptElement | null;
  const config: Partial<EdConfig> = {};

  // Read data attributes from script tag if available
  if (script) {
    const schoolId = script.getAttribute('data-school-id');
    const theme = script.getAttribute('data-theme');
    const position = script.getAttribute('data-position');
    const apiKey = script.getAttribute('data-api-key');
    const language = script.getAttribute('data-language');
    const fishAudioApiKey = script.getAttribute('data-fish-audio-api-key');
    const fishAudioVoiceIdEd = script.getAttribute('data-fish-audio-voice-id-ed');
    const fishAudioVoiceIdEdwina = script.getAttribute('data-fish-audio-voice-id-edwina');
    const fishAudioVoiceIdSanta = script.getAttribute('data-fish-audio-voice-id-santa');
    const fishAudioVoiceIdElf = script.getAttribute('data-fish-audio-voice-id-elf');
    const fishAudioVoiceIdHeadteacher = script.getAttribute('data-fish-audio-voice-id-headteacher');

    if (schoolId) config.schoolId = schoolId;
    if (theme) config.theme = theme as EdConfig['theme'];
    if (position) config.position = position as EdConfig['position'];
    if (apiKey) config.apiKey = apiKey;
    if (language) config.language = language;
    if (fishAudioApiKey) config.fishAudioApiKey = fishAudioApiKey;
    
    // Build voice IDs object if any are provided
    if (fishAudioVoiceIdEd || fishAudioVoiceIdEdwina || fishAudioVoiceIdSanta || fishAudioVoiceIdElf || fishAudioVoiceIdHeadteacher) {
      config.fishAudioVoiceIds = {};
      if (fishAudioVoiceIdEd) config.fishAudioVoiceIds.ed = fishAudioVoiceIdEd;
      if (fishAudioVoiceIdEdwina) config.fishAudioVoiceIds.edwina = fishAudioVoiceIdEdwina;
      if (fishAudioVoiceIdSanta) config.fishAudioVoiceIds.santa = fishAudioVoiceIdSanta;
      if (fishAudioVoiceIdElf) config.fishAudioVoiceIds.elf = fishAudioVoiceIdElf;
      if (fishAudioVoiceIdHeadteacher) config.fishAudioVoiceIds.headteacher = fishAudioVoiceIdHeadteacher;
    }

    // Only auto-init if we have a script tag with attributes (not module import)
    if (script && (schoolId || theme || position)) {
      // Auto-init when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => EdWidget.init(config));
      } else {
        EdWidget.init(config);
      }
    }
  }
}

// Export for module usage
export { EdWidget, Ed };
export type { EdConfig };

// Make available globally (for IIFE builds)
if (typeof window !== 'undefined') {
  (window as any).EdWidget = EdWidget;
  console.log('[Ed Widget] ✅ EdWidget assigned to window.EdWidget');
} else if (typeof globalThis !== 'undefined') {
  (globalThis as any).EdWidget = EdWidget;
  console.log('[Ed Widget] ✅ EdWidget assigned to globalThis.EdWidget');
}

// Auto-init (only for script tag usage, not module imports)
autoInit();

