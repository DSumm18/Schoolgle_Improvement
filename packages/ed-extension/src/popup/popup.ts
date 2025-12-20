// Popup UI for Ed Extension Configuration

interface EdConfig {
  provider: 'openrouter' | 'gemini';
  openRouterApiKey?: string;
  geminiApiKey?: string;
  fishAudioApiKey?: string;
  enableAI: boolean;
  enableTTS: boolean;
  ttsProvider?: 'browser' | 'fish';
  persona?: string;
  language?: string;
  fishAudioVoiceIds?: {
    edwina?: string;
  };
  ed_dev_mode?: boolean;
}

// Load current configuration
async function loadConfig(): Promise<EdConfig | null> {
  try {
    const result = await chrome.storage.local.get('ed_config');
    return result.ed_config || null;
  } catch (error) {
    console.error('Failed to load config:', error);
    return null;
  }
}

// Save configuration
async function saveConfig(config: Partial<EdConfig>): Promise<void> {
  try {
    const current = await loadConfig();
    const updated = {
      provider: 'openrouter' as const,
      enableAI: true,
      enableTTS: true,
      ttsProvider: 'fish' as const,
      persona: 'edwina',
      language: 'en-GB',
      ...current,
      ...config,
    };
    
    await chrome.storage.local.set({ ed_config: updated });
    showStatus('✅ Configuration saved! Reload the page to apply.', 'success');
    updateCurrentConfig(updated);
  } catch (error) {
    showStatus('❌ Failed to save configuration: ' + (error instanceof Error ? error.message : String(error)), 'error');
  }
}

// Show status message
function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
    
    if (type === 'success') {
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);
    }
  }
}

// Update current config display
function updateCurrentConfig(config: EdConfig) {
  const configEl = document.getElementById('current-config');
  if (configEl) {
    chrome.storage.local.get(['ed_dev_mode'], (result) => {
      const devMode = result.ed_dev_mode !== false;
      if (configEl) {
        configEl.innerHTML = `
          <strong>Current Config:</strong><br>
          API: ${devMode ? 'localhost:3000' : 'production'}<br>
          Provider: ${config.provider || 'not set'}<br>
          TTS: ${config.ttsProvider || 'not set'}<br>
          Persona: ${config.persona || 'not set'}<br>
          Keys: Gemini=${!!config.geminiApiKey}, OpenRouter=${!!config.openRouterApiKey}, Fish=${!!config.fishAudioApiKey}
        `;
      }
    });
  }
}

// Initialize popup
async function init() {
  // Load current config
  const config = await loadConfig();
  
  if (config) {
    // Populate form fields
    const geminiInput = document.getElementById('gemini-key') as HTMLInputElement;
    const openrouterInput = document.getElementById('openrouter-key') as HTMLInputElement;
    const fishAudioInput = document.getElementById('fish-audio-key') as HTMLInputElement;
    const edwinaVoiceInput = document.getElementById('edwina-voice-id') as HTMLInputElement;
    const personaSelect = document.getElementById('persona') as HTMLSelectElement;
    const ttsSelect = document.getElementById('tts-provider') as HTMLSelectElement;
    const devModeCheckbox = document.getElementById('dev-mode') as HTMLInputElement;
    
    if (geminiInput) geminiInput.value = config.geminiApiKey || '';
    if (openrouterInput) openrouterInput.value = config.openRouterApiKey || '';
    if (fishAudioInput) fishAudioInput.value = config.fishAudioApiKey || '';
    if (edwinaVoiceInput) edwinaVoiceInput.value = config.fishAudioVoiceIds?.edwina || '';
    if (personaSelect) personaSelect.value = config.persona || 'edwina';
    if (ttsSelect) ttsSelect.value = config.ttsProvider || 'fish';
    
    // Check dev mode from storage (default to true if not set)
    chrome.storage.local.get(['ed_dev_mode'], (result) => {
      if (devModeCheckbox) {
        devModeCheckbox.checked = result.ed_dev_mode !== false; // Default to true for dev
      }
    });
    
    updateCurrentConfig(config);
  }
  
  // Save button handler
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const geminiInput = document.getElementById('gemini-key') as HTMLInputElement;
      const openrouterInput = document.getElementById('openrouter-key') as HTMLInputElement;
      const fishAudioInput = document.getElementById('fish-audio-key') as HTMLInputElement;
      const edwinaVoiceInput = document.getElementById('edwina-voice-id') as HTMLInputElement;
      const personaSelect = document.getElementById('persona') as HTMLSelectElement;
      const ttsSelect = document.getElementById('tts-provider') as HTMLSelectElement;
      const devModeCheckbox = document.getElementById('dev-mode') as HTMLInputElement;
      
      // Save dev mode separately
      await chrome.storage.local.set({
        ed_dev_mode: devModeCheckbox?.checked !== false, // Default to true
      });
      
      await saveConfig({
        geminiApiKey: geminiInput?.value.trim() || undefined,
        openRouterApiKey: openrouterInput?.value.trim() || undefined,
        fishAudioApiKey: fishAudioInput?.value.trim() || undefined,
        persona: personaSelect?.value || 'edwina',
        ttsProvider: ttsSelect?.value as 'fish' | 'browser' || 'fish',
        fishAudioVoiceIds: edwinaVoiceInput?.value.trim() ? {
          edwina: edwinaVoiceInput.value.trim(),
        } : undefined,
      });
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
