/**
 * Helper script to copy API keys from .env.local to chrome.storage.local
 * Run this in the browser console on any page with the extension loaded
 * 
 * Usage:
 * 1. Copy the contents of this file
 * 2. Open browser console (F12) on any website
 * 3. Paste and run
 */

(async function() {
  'use strict';
  
  // Get keys from .env.local (you'll need to paste these values)
  // Replace these with your actual keys from .env.local
  const ENV_KEYS = {
    // Fish Audio
    FISH_AUDIO_API_KEY: 'your-fish-audio-key-here',
    
    // OpenRouter (if using)
    OPENROUTER_API_KEY: 'your-openrouter-key-here',
    
    // Gemini (if using)
    GEMINI_API_KEY: 'your-gemini-key-here',
  };
  
  // Build config object
  const config = {
    provider: 'openrouter', // or 'gemini'
    openRouterApiKey: ENV_KEYS.OPENROUTER_API_KEY || undefined,
    geminiApiKey: ENV_KEYS.GEMINI_API_KEY || undefined,
    fishAudioApiKey: ENV_KEYS.FISH_AUDIO_API_KEY || undefined,
    enableAI: true,
    enableTTS: true,
    ttsProvider: 'fish', // Use Fish Audio
    persona: 'edwina', // Use Edwina voice
    language: 'en-GB',
  };
  
  // Save to chrome.storage
  try {
    await chrome.storage.local.set({ ed_config: config });
    console.log('✅ Ed configuration saved to chrome.storage!');
    console.log('Configuration:', {
      provider: config.provider,
      enableAI: config.enableAI,
      enableTTS: config.enableTTS,
      ttsProvider: config.ttsProvider,
      persona: config.persona,
      hasKeys: {
        openrouter: !!config.openRouterApiKey,
        gemini: !!config.geminiApiKey,
        fish: !!config.fishAudioApiKey,
      },
    });
    console.log('🔄 Reload the page to apply the new configuration.');
  } catch (error) {
    console.error('❌ Failed to save configuration:', error);
  }
})();

