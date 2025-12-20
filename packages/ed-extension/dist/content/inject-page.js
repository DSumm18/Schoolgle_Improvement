// Page Context Script - Runs in page's JavaScript context, not content script context
"use strict";
(() => {
  // src/content/inject-page.ts
  (function() {
    "use strict";
    if (window.__ED_PAGE_SCRIPT_LOADED__) {
      console.debug("[Ed Page] Skipping \u2013 already loaded");
      return;
    }
    window.__ED_PAGE_SCRIPT_LOADED__ = true;
    console.log("[Ed Page] Page context script injected");
    let EXTENSION_ID = window.__ED_EXTENSION_ID__;
    if (!EXTENSION_ID) {
      const scriptTag = document.currentScript;
      if (scriptTag) {
        EXTENSION_ID = scriptTag.getAttribute("data-extension-id") || "";
      }
    }
    if (!EXTENSION_ID) {
      const scriptTag = document.currentScript;
      if (scriptTag && scriptTag.src) {
        const match = scriptTag.src.match(/chrome-extension:\/\/([^/]+)/);
        if (match) {
          EXTENSION_ID = match[1];
        }
      }
    }
    if (!EXTENSION_ID) {
      console.error("[Ed Page] Extension ID not found");
      return;
    }
    window.__ED_EXTENSION_ID__ = EXTENSION_ID;
    console.log("[Ed Page] Extension ID:", EXTENSION_ID);
    function sendToContentScript(message) {
      window.postMessage({
        source: "ed-page-script",
        extensionId: EXTENSION_ID,
        ...message
      }, "*");
    }
    window.addEventListener("message", (event) => {
      if (event.data?.source !== "ed-content-script" || event.data?.extensionId !== EXTENSION_ID) {
        return;
      }
      const { type, payload } = event.data;
      switch (type) {
        case "INIT_WIDGET": {
          initWidget(payload);
          break;
        }
        case "SET_TOOL_CONTEXT": {
          if (window.__ED_INSTANCE__?.setToolContext) {
            window.__ED_INSTANCE__.setToolContext(payload);
          }
          break;
        }
        case "DESTROY_WIDGET": {
          if (window.__ED_INSTANCE__) {
            window.__ED_INSTANCE__.destroy();
            delete window.__ED_INSTANCE__;
          }
          break;
        }
      }
    });
    async function initWidget(config) {
      try {
        let resolveWidgetApi = function() {
          const g = window.EdWidget;
          if (g?.init && typeof g.init === "function") {
            console.log("[Ed Page] Found EdWidget API directly on window.EdWidget");
            return g;
          }
          if (g?.EdWidget?.init && typeof g.EdWidget.init === "function") {
            console.log("[Ed Page] Found EdWidget API at window.EdWidget.EdWidget");
            return g.EdWidget;
          }
          if (g?.default?.init && typeof g.default.init === "function") {
            console.log("[Ed Page] Found EdWidget API at window.EdWidget.default");
            return g.default;
          }
          if (g?.Ed?.init && typeof g.Ed.init === "function") {
            console.log("[Ed Page] Found EdWidget API at window.EdWidget.Ed");
            return g.Ed;
          }
          console.error("[Ed Page] EdWidget API not found. Structure:", {
            hasInit: "init" in g,
            hasEdWidget: "EdWidget" in g,
            hasDefault: "default" in g,
            hasEd: "Ed" in g,
            keys: Object.keys(g)
          });
          return null;
        };
        console.log("[Ed Page] Initializing Ed widget with config:", {
          provider: config.provider,
          enableAI: config.enableAI,
          enableTTS: config.enableTTS,
          ttsProvider: config.ttsProvider,
          hasKeys: {
            openrouter: !!config.openRouterApiKey,
            gemini: !!config.geminiApiKey,
            fish: !!config.fishAudioApiKey
          }
        });
        window.ED_CONFIG = {
          provider: config.provider || "openrouter",
          openRouterApiKey: config.openRouterApiKey,
          geminiApiKey: config.geminiApiKey,
          fishAudioApiKey: config.fishAudioApiKey,
          enableAI: config.enableAI !== false,
          enableTTS: config.enableTTS !== false,
          ttsProvider: config.ttsProvider || "fish",
          // Default to Fish Audio
          schoolId: config.schoolId,
          language: config.language,
          persona: config.persona || "edwina",
          // Default to Edwina voice
          // Fish Audio voice IDs (if provided)
          fishAudioVoiceIds: config.fishAudioVoiceIds || void 0
        };
        console.log("[Ed Page] \u2705 window.ED_CONFIG set before widget load");
        console.log("[Ed Page] Provider:", window.ED_CONFIG.provider);
        console.log("[Ed Page] TTS:", window.ED_CONFIG.enableTTS ? window.ED_CONFIG.ttsProvider : "disabled");
        const bundleUrl = `chrome-extension://${EXTENSION_ID}/ed-widget/ed-widget.iife.js`;
        const cssUrl = `chrome-extension://${EXTENSION_ID}/ed-widget/ed-widget.css`;
        console.log("[Ed Page] Loading bundle from:", bundleUrl);
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssUrl;
        document.head.appendChild(link);
        console.log("[Ed Page] CSS loaded");
        const script = document.createElement("script");
        script.src = bundleUrl;
        script.type = "text/javascript";
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("[Ed Page] Script loaded successfully");
            resolve();
          };
          script.onerror = (error) => {
            console.error("[Ed Page] Script load error:", error);
            reject(new Error(`Failed to load Ed widget bundle from ${bundleUrl}`));
          };
          document.head.appendChild(script);
        });
        console.log("[Ed Page] Waiting for EdWidget global...");
        let attempts = 0;
        const maxAttempts = 100;
        while (!window.EdWidget && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
          if (attempts % 10 === 0) {
            console.log(`[Ed Page] Still waiting for EdWidget... (${attempts}/${maxAttempts})`);
            console.log("[Ed Page] window keys:", Object.keys(window).filter((k) => k.toLowerCase().includes("ed")));
          }
        }
        if (!window.EdWidget) {
          console.error("[Ed Page] EdWidget not found. window.EdWidget:", window.EdWidget);
          console.error("[Ed Page] Available window keys:", Object.keys(window).filter((k) => k.toLowerCase().includes("ed")));
          throw new Error("EdWidget not available after loading bundle");
        }
        console.log("[Ed Page] \u2705 EdWidget found on window:", window.EdWidget);
        const api = resolveWidgetApi();
        if (!api) {
          throw new Error("EdWidget API not found on window (no init method)");
        }
        const ed = api.init(config);
        window.__ED_INSTANCE__ = ed;
        console.log("[Ed Page] \u2705 Ed widget initialized successfully");
        console.log("[Ed Page] Ed instance:", ed);
        sendToContentScript({
          type: "WIDGET_READY",
          payload: { success: true }
        });
      } catch (error) {
        console.error("[Ed Page] \u274C Error initializing widget:", error);
        sendToContentScript({
          type: "WIDGET_ERROR",
          payload: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    }
    sendToContentScript({
      type: "PAGE_SCRIPT_READY",
      payload: { extensionId: EXTENSION_ID }
    });
    console.log("[Ed Page] Page context script ready, waiting for init command");
  })();
})();
