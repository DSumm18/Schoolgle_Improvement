"use strict";
(() => {
  // src/popup/popup.ts
  async function loadConfig() {
    try {
      const result = await chrome.storage.local.get("ed_config");
      return result.ed_config || null;
    } catch (error) {
      console.error("Failed to load config:", error);
      return null;
    }
  }
  async function saveConfig(config) {
    try {
      const current = await loadConfig();
      const updated = {
        provider: "openrouter",
        enableAI: true,
        enableTTS: true,
        ttsProvider: "fish",
        persona: "edwina",
        language: "en-GB",
        ...current,
        ...config
      };
      await chrome.storage.local.set({ ed_config: updated });
      showStatus("\u2705 Configuration saved! Reload the page to apply.", "success");
      updateCurrentConfig(updated);
    } catch (error) {
      showStatus("\u274C Failed to save configuration: " + (error instanceof Error ? error.message : String(error)), "error");
    }
  }
  function showStatus(message, type = "info") {
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status ${type}`;
      statusEl.style.display = "block";
      if (type === "success") {
        setTimeout(() => {
          statusEl.style.display = "none";
        }, 3e3);
      }
    }
  }
  function updateCurrentConfig(config) {
    const configEl = document.getElementById("current-config");
    if (configEl) {
      chrome.storage.local.get(["ed_dev_mode"], (result) => {
        const devMode = result.ed_dev_mode !== false;
        if (configEl) {
          configEl.innerHTML = `
          <strong>Current Config:</strong><br>
          API: ${devMode ? "localhost:3000" : "production"}<br>
          Provider: ${config.provider || "not set"}<br>
          TTS: ${config.ttsProvider || "not set"}<br>
          Persona: ${config.persona || "not set"}<br>
          Keys: Gemini=${!!config.geminiApiKey}, OpenRouter=${!!config.openRouterApiKey}, Fish=${!!config.fishAudioApiKey}
        `;
        }
      });
    }
  }
  async function init() {
    const config = await loadConfig();
    if (config) {
      const geminiInput = document.getElementById("gemini-key");
      const openrouterInput = document.getElementById("openrouter-key");
      const fishAudioInput = document.getElementById("fish-audio-key");
      const edwinaVoiceInput = document.getElementById("edwina-voice-id");
      const personaSelect = document.getElementById("persona");
      const ttsSelect = document.getElementById("tts-provider");
      const devModeCheckbox = document.getElementById("dev-mode");
      if (geminiInput)
        geminiInput.value = config.geminiApiKey || "";
      if (openrouterInput)
        openrouterInput.value = config.openRouterApiKey || "";
      if (fishAudioInput)
        fishAudioInput.value = config.fishAudioApiKey || "";
      if (edwinaVoiceInput)
        edwinaVoiceInput.value = config.fishAudioVoiceIds?.edwina || "";
      if (personaSelect)
        personaSelect.value = config.persona || "edwina";
      if (ttsSelect)
        ttsSelect.value = config.ttsProvider || "fish";
      chrome.storage.local.get(["ed_dev_mode"], (result) => {
        if (devModeCheckbox) {
          devModeCheckbox.checked = result.ed_dev_mode !== false;
        }
      });
      updateCurrentConfig(config);
    }
    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const geminiInput = document.getElementById("gemini-key");
        const openrouterInput = document.getElementById("openrouter-key");
        const fishAudioInput = document.getElementById("fish-audio-key");
        const edwinaVoiceInput = document.getElementById("edwina-voice-id");
        const personaSelect = document.getElementById("persona");
        const ttsSelect = document.getElementById("tts-provider");
        const devModeCheckbox = document.getElementById("dev-mode");
        await chrome.storage.local.set({
          ed_dev_mode: devModeCheckbox?.checked !== false
          // Default to true
        });
        await saveConfig({
          geminiApiKey: geminiInput?.value.trim() || void 0,
          openRouterApiKey: openrouterInput?.value.trim() || void 0,
          fishAudioApiKey: fishAudioInput?.value.trim() || void 0,
          persona: personaSelect?.value || "edwina",
          ttsProvider: ttsSelect?.value || "fish",
          fishAudioVoiceIds: edwinaVoiceInput?.value.trim() ? {
            edwina: edwinaVoiceInput.value.trim()
          } : void 0
        });
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
