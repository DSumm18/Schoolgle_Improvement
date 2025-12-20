"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/shared/config.ts
  var config_exports = {};
  __export(config_exports, {
    buildWidgetConfig: () => buildWidgetConfig,
    getApiKeysFromBackground: () => getApiKeysFromBackground,
    loadEdConfig: () => loadEdConfig,
    saveEdConfig: () => saveEdConfig
  });
  async function loadEdConfig() {
    if (typeof chrome === "undefined" || !chrome?.storage?.local) {
      console.warn("[Ed Config] chrome.storage not available, using defaults");
      return DEFAULT_CONFIG;
    }
    try {
      const result = await chrome.storage.local.get("ed_config");
      const stored = result.ed_config;
      if (stored && typeof stored === "object") {
        return {
          ...DEFAULT_CONFIG,
          ...stored
        };
      }
      return DEFAULT_CONFIG;
    } catch (error) {
      console.warn("[Ed Config] Failed to load from storage, using defaults:", error);
      return DEFAULT_CONFIG;
    }
  }
  async function saveEdConfig(config) {
    try {
      const current = await loadEdConfig();
      const updated = { ...current, ...config };
      await chrome.storage.local.set({ ed_config: updated });
      console.log("[Ed Config] Configuration saved:", {
        provider: updated.provider,
        enableAI: updated.enableAI,
        enableTTS: updated.enableTTS,
        ttsProvider: updated.ttsProvider,
        hasKeys: {
          openrouter: !!updated.openRouterApiKey,
          gemini: !!updated.geminiApiKey,
          fish: !!updated.fishAudioApiKey
        }
      });
    } catch (error) {
      console.error("[Ed Config] Failed to save configuration:", error);
    }
  }
  async function getApiKeysFromBackground() {
    if (typeof chrome === "undefined" || !chrome?.runtime?.sendMessage) {
      return {};
    }
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_API_KEYS" });
      if (response && !response.error) {
        return {
          openRouterApiKey: response.openRouterApiKey,
          geminiApiKey: response.geminiApiKey,
          fishAudioApiKey: response.fishAudioApiKey
        };
      }
    } catch (error) {
      console.debug("[Ed Config] Could not get API keys from background:", error);
    }
    return {};
  }
  async function buildWidgetConfig() {
    const hasChromeStorage = typeof chrome !== "undefined" && chrome?.storage?.local;
    let config = DEFAULT_CONFIG;
    let apiKeys = {};
    if (hasChromeStorage) {
      try {
        config = await loadEdConfig();
        apiKeys = await getApiKeysFromBackground();
      } catch (error) {
        console.warn("[Ed Config] Failed to load from storage, using defaults:", error);
      }
    } else {
      console.log("[Ed Config] Not in extension context, using defaults");
    }
    const finalConfig = {
      ...config,
      openRouterApiKey: apiKeys.openRouterApiKey || config.openRouterApiKey,
      geminiApiKey: apiKeys.geminiApiKey || config.geminiApiKey,
      fishAudioApiKey: apiKeys.fishAudioApiKey || config.fishAudioApiKey
    };
    console.log("[Ed Config] Provider:", finalConfig.provider);
    console.log("[Ed Config] TTS:", finalConfig.enableTTS ? finalConfig.ttsProvider : "disabled");
    console.log("[Ed Config] Keys present:", {
      openrouter: !!finalConfig.openRouterApiKey,
      gemini: !!finalConfig.geminiApiKey,
      fish: !!finalConfig.fishAudioApiKey
    });
    return finalConfig;
  }
  var DEFAULT_CONFIG;
  var init_config = __esm({
    "src/shared/config.ts"() {
      "use strict";
      DEFAULT_CONFIG = {
        provider: "openrouter",
        enableAI: true,
        enableTTS: true,
        ttsProvider: "fish",
        // Default to Fish Audio for better voice quality
        language: "en-GB",
        persona: "edwina"
        // Default to Edwina voice
      };
    }
  });

  // src/shared/types.ts
  var STORAGE_KEYS = {
    ED_STATE: "ed_state",
    USER_PREFERENCES: "ed_user_prefs",
    RESPONSE_CACHE: "ed_response_cache",
    TOOL_HISTORY: "ed_tool_history",
    AUTH_TOKEN: "ed_auth_token",
    SUBSCRIPTION: "ed_subscription"
  };

  // src/content/tool-detector.ts
  var TOOL_FINGERPRINTS = [
    // MIS Systems
    {
      id: "sims",
      name: "SIMS",
      category: "MIS",
      urlPatterns: [/sims\.co\.uk/i, /capita-sims/i, /ess-sims/i],
      titlePatterns: [/sims/i]
    },
    {
      id: "arbor",
      name: "Arbor",
      category: "MIS",
      urlPatterns: [/arbor-education\.com/i, /arbor\.sc/i],
      titlePatterns: [/arbor/i]
    },
    {
      id: "bromcom",
      name: "Bromcom",
      category: "MIS",
      urlPatterns: [/bromcom\.com/i, /bromcom\.cloud/i],
      titlePatterns: [/bromcom/i]
    },
    {
      id: "scholarpack",
      name: "ScholarPack",
      category: "MIS",
      urlPatterns: [/scholarpack\.com/i],
      titlePatterns: [/scholarpack/i]
    },
    // Finance
    {
      id: "every-budget",
      name: "Every Budget Builder",
      category: "Finance",
      urlPatterns: [/every\.education/i, /everybudget/i],
      titlePatterns: [/every.*budget/i]
    },
    {
      id: "ps-financials",
      name: "PS Financials",
      category: "Finance",
      urlPatterns: [/psfinancials\.com/i, /ps-financials/i],
      titlePatterns: [/ps.*financials/i]
    },
    {
      id: "access-finance",
      name: "Access Finance",
      category: "Finance",
      urlPatterns: [/theaccessgroup\.com.*finance/i],
      titlePatterns: [/access.*finance/i]
    },
    // Safeguarding
    {
      id: "cpoms",
      name: "CPOMS",
      category: "Safeguarding",
      urlPatterns: [/cpoms\.co\.uk/i],
      titlePatterns: [/cpoms/i]
    },
    {
      id: "myconcern",
      name: "MyConcern",
      category: "Safeguarding",
      urlPatterns: [/myconcern\.education/i, /myconcern\.co\.uk/i],
      titlePatterns: [/myconcern/i]
    },
    {
      id: "safeguard-my-school",
      name: "Safeguard My School",
      category: "Safeguarding",
      urlPatterns: [/safeguardmyschool\.com/i],
      titlePatterns: [/safeguard.*my.*school/i]
    },
    // HR
    {
      id: "the-key-hr",
      name: "The Key HR",
      category: "HR",
      urlPatterns: [/thekeysupport\.com/i, /schoolleaders\.thekeysupport/i],
      titlePatterns: [/the key/i]
    },
    {
      id: "every-hr",
      name: "Every HR",
      category: "HR",
      urlPatterns: [/every\.education.*hr/i],
      titlePatterns: [/every.*hr/i]
    },
    {
      id: "access-people-hr",
      name: "Access People HR",
      category: "HR",
      urlPatterns: [/theaccessgroup\.com.*people/i],
      titlePatterns: [/access.*people/i]
    },
    // Parent Communication
    {
      id: "parentpay",
      name: "ParentPay",
      category: "Parents",
      urlPatterns: [/parentpay\.com/i],
      titlePatterns: [/parentpay/i]
    },
    {
      id: "parentmail",
      name: "ParentMail",
      category: "Parents",
      urlPatterns: [/parentmail\.co\.uk/i],
      titlePatterns: [/parentmail/i]
    },
    {
      id: "schoolcomms",
      name: "SchoolComms",
      category: "Parents",
      urlPatterns: [/schoolcomms\.com/i],
      titlePatterns: [/schoolcomms/i]
    },
    {
      id: "weduc",
      name: "Weduc",
      category: "Parents",
      urlPatterns: [/weduc\.co\.uk/i],
      titlePatterns: [/weduc/i]
    },
    // Teaching & Learning
    {
      id: "google-classroom",
      name: "Google Classroom",
      category: "Teaching",
      urlPatterns: [/classroom\.google\.com/i],
      titlePatterns: [/google classroom/i]
    },
    {
      id: "google-workspace",
      name: "Google Workspace",
      category: "Teaching",
      urlPatterns: [/docs\.google\.com/i, /drive\.google\.com/i, /sheets\.google\.com/i],
      titlePatterns: [/google docs/i, /google sheets/i, /google drive/i]
    },
    {
      id: "microsoft-teams",
      name: "Microsoft Teams",
      category: "Teaching",
      urlPatterns: [/teams\.microsoft\.com/i],
      titlePatterns: [/microsoft teams/i]
    },
    {
      id: "canva",
      name: "Canva",
      category: "Teaching",
      urlPatterns: [/canva\.com/i],
      titlePatterns: [/canva/i]
    },
    {
      id: "twinkl",
      name: "Twinkl",
      category: "Teaching",
      urlPatterns: [/twinkl\.co\.uk/i, /twinkl\.com/i],
      titlePatterns: [/twinkl/i]
    },
    // Data & Analytics
    {
      id: "asp",
      name: "Analyse School Performance",
      category: "Data",
      urlPatterns: [/analyse-school-performance/i, /asp\.education\.gov\.uk/i],
      titlePatterns: [/analyse school performance/i]
    },
    {
      id: "fft",
      name: "FFT Education",
      category: "Data",
      urlPatterns: [/fft\.org\.uk/i, /fftaspire/i],
      titlePatterns: [/fft/i]
    },
    {
      id: "sisra",
      name: "SISRA Analytics",
      category: "Data",
      urlPatterns: [/sisra\.com/i],
      titlePatterns: [/sisra/i]
    },
    // Admin & Compliance
    {
      id: "schoolbus",
      name: "SchoolBus",
      category: "Admin",
      urlPatterns: [/schoolbus\.co\.uk/i],
      titlePatterns: [/schoolbus/i]
    },
    {
      id: "smartsurvey",
      name: "SmartSurvey",
      category: "Admin",
      urlPatterns: [/smartsurvey\.co\.uk/i],
      titlePatterns: [/smartsurvey/i]
    },
    {
      id: "hse-risk",
      name: "HSE Risk Assessment",
      category: "Admin",
      urlPatterns: [/hse\.gov\.uk/i],
      titlePatterns: [/risk assessment/i, /health and safety/i]
    },
    // SEND
    {
      id: "provision-map",
      name: "Provision Map",
      category: "Admin",
      urlPatterns: [/provisionmap\.co\.uk/i],
      titlePatterns: [/provision map/i]
    },
    {
      id: "edukey",
      name: "Edukey",
      category: "Admin",
      urlPatterns: [/edukey\.co\.uk/i],
      titlePatterns: [/edukey/i]
    }
  ];
  function detectTool(location, doc) {
    const url = location.href;
    const title = doc.title;
    for (const fingerprint of TOOL_FINGERPRINTS) {
      for (const pattern of fingerprint.urlPatterns) {
        if (pattern.test(url)) {
          return {
            id: fingerprint.id,
            name: fingerprint.name,
            category: fingerprint.category,
            confidence: 0.95,
            matchedOn: "url"
          };
        }
      }
      if (fingerprint.titlePatterns) {
        for (const pattern of fingerprint.titlePatterns) {
          if (pattern.test(title)) {
            return {
              id: fingerprint.id,
              name: fingerprint.name,
              category: fingerprint.category,
              confidence: 0.7,
              matchedOn: "title"
            };
          }
        }
      }
      if (fingerprint.domSelectors) {
        for (const selector of fingerprint.domSelectors) {
          if (doc.querySelector(selector)) {
            return {
              id: fingerprint.id,
              name: fingerprint.name,
              category: fingerprint.category,
              confidence: 0.8,
              matchedOn: "dom"
            };
          }
        }
      }
    }
    return null;
  }

  // src/content/page-reader.ts
  function extractPageContext(location, doc) {
    return {
      url: location.href,
      hostname: location.hostname,
      pathname: location.pathname,
      title: doc.title,
      headings: extractHeadings(doc),
      visibleText: extractVisibleText(doc),
      forms: extractForms(doc),
      selectedText: getSelectedText(),
      detectedTool: detectTool(location, doc),
      timestamp: Date.now()
    };
  }
  function extractHeadings(doc) {
    const headings = [];
    const selectors = ["h1", "h2", "h3", "h4"];
    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 0 && text.length < 200) {
          headings.push({
            level: parseInt(selector.charAt(1)),
            text
          });
        }
      });
    }
    return headings.slice(0, 30);
  }
  function extractVisibleText(doc) {
    const textParts = [];
    const mainSelectors = ["main", "article", '[role="main"]', ".content", "#content"];
    let mainContent = null;
    for (const selector of mainSelectors) {
      mainContent = doc.querySelector(selector);
      if (mainContent)
        break;
    }
    const root = mainContent || doc.body;
    const walker = doc.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node2) => {
          const parent = node2.parentElement;
          if (!parent)
            return NodeFilter.FILTER_REJECT;
          const style = window.getComputedStyle(parent);
          if (style.display === "none" || style.visibility === "hidden") {
            return NodeFilter.FILTER_REJECT;
          }
          const tagName = parent.tagName.toLowerCase();
          if (["script", "style", "noscript", "svg", "path"].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          const text = node2.textContent?.trim() || "";
          if (text.length < 2) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text) {
        textParts.push(text);
      }
    }
    const fullText = textParts.join(" ");
    return fullText.slice(0, 5e3);
  }
  function extractForms(doc) {
    const forms = [];
    const formElements = doc.querySelectorAll("form");
    formElements.forEach((form, index) => {
      const fields = [];
      const inputs = form.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        const el = input;
        const type = el.type || el.tagName.toLowerCase();
        if (type === "hidden" || type === "submit" || type === "button") {
          return;
        }
        const isPassword = type === "password";
        let label = "";
        if (el.id) {
          const labelEl = doc.querySelector(`label[for="${el.id}"]`);
          label = labelEl?.textContent?.trim() || "";
        }
        if (!label) {
          const parentLabel = el.closest("label");
          if (parentLabel) {
            label = parentLabel.textContent?.trim() || "";
          }
        }
        fields.push({
          type,
          name: el.name || "",
          id: el.id || "",
          label,
          placeholder: el.placeholder || "",
          value: isPassword ? "" : el.value || "",
          // Never read password values
          isPassword
        });
      });
      if (fields.length > 0) {
        forms.push({
          id: form.id || `form-${index}`,
          name: form.name || "",
          action: form.action || "",
          fields
        });
      }
    });
    return forms.slice(0, 10);
  }
  function getSelectedText() {
    const selection = window.getSelection();
    return selection?.toString().trim() || "";
  }

  // src/content/ed-widget.ts
  var EdWidget = class {
    container = null;
    shadowRoot = null;
    isVisible;
    isMinimized;
    isExpanded = false;
    currentTool = null;
    messages = [];
    isLoading = false;
    onAskQuestion;
    onClose;
    constructor(options) {
      this.isVisible = options.isVisible;
      this.isMinimized = options.isMinimized;
      this.onAskQuestion = options.onAskQuestion;
      this.onClose = options.onClose;
    }
    /**
     * Mount the widget to the page
     */
    mount() {
      if (this.container)
        return;
      this.container = document.createElement("div");
      this.container.id = "ed-extension-widget";
      this.container.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
      this.shadowRoot = this.container.attachShadow({ mode: "closed" });
      this.injectStyles();
      this.render();
      document.body.appendChild(this.container);
      console.log("[Ed Widget] Mounted");
    }
    /**
     * Unmount the widget
     */
    unmount() {
      if (this.container) {
        this.container.remove();
        this.container = null;
        this.shadowRoot = null;
      }
    }
    /**
     * Toggle visibility
     */
    toggle() {
      this.isVisible = !this.isVisible;
      this.render();
    }
    /**
     * Set visibility
     */
    setVisible(visible) {
      this.isVisible = visible;
      this.render();
    }
    /**
     * Set detected tool
     */
    setTool(tool) {
      this.currentTool = tool;
      if (tool && this.messages.length === 0) {
        this.messages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Hi! I see you're using ${tool.name}. I can help you with anything here - just ask!`,
          timestamp: /* @__PURE__ */ new Date()
        });
      }
      this.render();
    }
    /**
     * Inject styles into shadow DOM
     */
    injectStyles() {
      if (!this.shadowRoot)
        return;
      const style = document.createElement("style");
      style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      .ed-container {
        position: relative;
      }
      
      /* Ed Particle Orb - CSS recreation of Three.js particle sphere */
      .ed-orb {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, 
          rgba(45, 212, 191, 0.9) 0%, 
          rgba(16, 185, 129, 0.95) 40%, 
          rgba(5, 150, 105, 1) 70%,
          rgba(4, 120, 87, 1) 100%);
        cursor: pointer;
        position: relative;
        border: none;
        outline: none;
        animation: ed-orb-rotate 8s linear infinite;
        transform-style: preserve-3d;
      }
      
      /* Outer glow */
      .ed-orb::before {
        content: '';
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background: radial-gradient(circle, 
          rgba(16, 185, 129, 0.4) 0%, 
          rgba(16, 185, 129, 0.2) 40%,
          transparent 70%);
        animation: ed-glow-pulse 2s ease-in-out infinite;
        z-index: -1;
      }
      
      /* Particle dots layer */
      .ed-orb::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background-image: 
          radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.8) 50%, transparent 50%),
          radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.6) 50%, transparent 50%),
          radial-gradient(2px 2px at 60% 20%, rgba(255,255,255,0.7) 50%, transparent 50%),
          radial-gradient(2px 2px at 80% 50%, rgba(255,255,255,0.5) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 15% 60%, rgba(45,212,191,0.9) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 35% 15%, rgba(45,212,191,0.8) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 55% 85%, rgba(45,212,191,0.7) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 75% 35%, rgba(45,212,191,0.9) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 25% 45%, rgba(16,185,129,0.8) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 45% 55%, rgba(16,185,129,0.7) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 65% 40%, rgba(16,185,129,0.9) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 85% 75%, rgba(16,185,129,0.6) 50%, transparent 50%),
          radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.4) 50%, transparent 50%),
          radial-gradient(1px 1px at 30% 90%, rgba(255,255,255,0.3) 50%, transparent 50%),
          radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.5) 50%, transparent 50%),
          radial-gradient(1px 1px at 70% 65%, rgba(255,255,255,0.4) 50%, transparent 50%),
          radial-gradient(1px 1px at 90% 25%, rgba(255,255,255,0.3) 50%, transparent 50%);
        animation: ed-particles-shimmer 3s ease-in-out infinite;
      }
      
      /* Inner shine */
      .ed-orb-inner {
        position: absolute;
        top: 6px;
        left: 10px;
        width: 20px;
        height: 12px;
        background: rgba(255, 255, 255, 0.35);
        border-radius: 50%;
        filter: blur(3px);
      }
      
      @keyframes ed-orb-rotate {
        from { transform: rotate3d(0, 1, 0.1, 0deg); }
        to { transform: rotate3d(0, 1, 0.1, 360deg); }
      }
      
      @keyframes ed-glow-pulse {
        0%, 100% { 
          opacity: 0.8;
          transform: scale(1);
        }
        50% { 
          opacity: 1;
          transform: scale(1.1);
        }
      }
      
      @keyframes ed-particles-shimmer {
        0%, 100% { opacity: 0.9; }
        50% { opacity: 0.6; }
      }
      
      .ed-orb:hover {
        animation-play-state: paused;
        transform: scale(1.1);
      }
      
      .ed-orb:hover::before {
        background: radial-gradient(circle, 
          rgba(16, 185, 129, 0.6) 0%, 
          rgba(16, 185, 129, 0.3) 40%,
          transparent 70%);
      }
      
      .ed-orb:active {
        transform: scale(0.95);
      }
      
      .ed-orb-icon {
        display: none; /* Hide emoji, use particle effect instead */
      }
      
      .ed-orb.hidden {
        display: none;
      }
      
      /* Pulse animation for new messages */
      .ed-orb.has-notification {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4); }
        50% { box-shadow: 0 4px 30px rgba(5, 150, 105, 0.7); }
        100% { box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4); }
      }
      
      /* Chat Panel */
      .ed-panel {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 380px;
        max-height: 500px;
        background: #0f172a;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(10px) scale(0.95);
        transition: all 0.2s ease;
        pointer-events: none;
      }
      
      .ed-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      
      /* Panel Header */
      .ed-header {
        padding: 16px;
        background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .ed-header-icon {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      
      .ed-header-text {
        flex: 1;
      }
      
      .ed-header-title {
        font-size: 15px;
        font-weight: 600;
        color: white;
      }
      
      .ed-header-subtitle {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .ed-close-btn {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: background 0.15s;
      }
      
      .ed-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      /* Tool Badge */
      .ed-tool-badge {
        padding: 8px 16px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .ed-tool-badge-icon {
        font-size: 14px;
      }
      
      .ed-tool-badge-text {
        font-size: 12px;
        color: #10b981;
        font-weight: 500;
      }
      
      /* Messages */
      .ed-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 200px;
        max-height: 300px;
      }
      
      .ed-message {
        display: flex;
        gap: 8px;
        max-width: 85%;
      }
      
      .ed-message.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      
      .ed-message-avatar {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }
      
      .ed-message.assistant .ed-message-avatar {
        background: #059669;
      }
      
      .ed-message.user .ed-message-avatar {
        background: #3b82f6;
      }
      
      .ed-message-content {
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .ed-message.assistant .ed-message-content {
        background: #1e293b;
        color: #e2e8f0;
        border-bottom-left-radius: 4px;
      }
      
      .ed-message.user .ed-message-content {
        background: #3b82f6;
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      /* Loading indicator */
      .ed-loading {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
        background: #1e293b;
        border-radius: 12px;
        border-bottom-left-radius: 4px;
      }
      
      .ed-loading-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #64748b;
        animation: loadingDot 1.4s infinite ease-in-out both;
      }
      
      .ed-loading-dot:nth-child(1) { animation-delay: -0.32s; }
      .ed-loading-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes loadingDot {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      
      /* Input */
      .ed-input-container {
        padding: 12px 16px;
        background: #1e293b;
        border-top: 1px solid #334155;
      }
      
      .ed-input-wrapper {
        display: flex;
        gap: 8px;
        align-items: center;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 4px;
      }
      
      .ed-input {
        flex: 1;
        padding: 8px 12px;
        background: transparent;
        border: none;
        outline: none;
        color: #e2e8f0;
        font-size: 14px;
        font-family: inherit;
      }
      
      .ed-input::placeholder {
        color: #64748b;
      }
      
      .ed-send-btn {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #059669;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.15s;
      }
      
      .ed-send-btn:hover {
        background: #047857;
      }
      
      .ed-send-btn:disabled {
        background: #334155;
        cursor: not-allowed;
      }
      
      /* Empty state */
      .ed-empty {
        text-align: center;
        padding: 20px;
        color: #64748b;
      }
      
      .ed-empty-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      
      .ed-empty-text {
        font-size: 13px;
        line-height: 1.5;
      }
    `;
      this.shadowRoot.appendChild(style);
    }
    /**
     * Render the widget
     */
    render() {
      if (!this.shadowRoot)
        return;
      const existingUI = this.shadowRoot.querySelector(".ed-container");
      if (existingUI) {
        existingUI.remove();
      }
      const container = document.createElement("div");
      container.className = "ed-container";
      if (!this.isVisible) {
        container.innerHTML = "";
        this.shadowRoot.appendChild(container);
        return;
      }
      const orb = document.createElement("button");
      orb.className = `ed-orb ${this.isExpanded ? "hidden" : ""}`;
      orb.innerHTML = '<div class="ed-orb-inner"></div>';
      orb.onclick = () => {
        this.isExpanded = true;
        this.render();
      };
      const panel = document.createElement("div");
      panel.className = `ed-panel ${this.isExpanded ? "open" : ""}`;
      panel.innerHTML = this.renderPanel();
      container.appendChild(orb);
      container.appendChild(panel);
      this.shadowRoot.appendChild(container);
      this.attachEventListeners();
    }
    /**
     * Render the chat panel HTML
     */
    renderPanel() {
      const toolBadge = this.currentTool ? `<div class="ed-tool-badge">
           <span class="ed-tool-badge-icon">\u{1F527}</span>
           <span class="ed-tool-badge-text">${this.currentTool.name}</span>
         </div>` : "";
      const messagesHtml = this.messages.length > 0 ? this.messages.map((msg) => `
          <div class="ed-message ${msg.role}">
            <div class="ed-message-avatar">${msg.role === "assistant" ? "\u{1F393}" : "\u{1F464}"}</div>
            <div class="ed-message-content">${this.escapeHtml(msg.content)}</div>
          </div>
        `).join("") : `<div class="ed-empty">
           <div class="ed-empty-icon">\u{1F4AC}</div>
           <div class="ed-empty-text">
             Ask me anything about<br/>what you're working on!
           </div>
         </div>`;
      const loadingHtml = this.isLoading ? `<div class="ed-message assistant">
           <div class="ed-message-avatar">\u{1F393}</div>
           <div class="ed-loading">
             <div class="ed-loading-dot"></div>
             <div class="ed-loading-dot"></div>
             <div class="ed-loading-dot"></div>
           </div>
         </div>` : "";
      return `
      <div class="ed-header">
        <div class="ed-header-icon">\u{1F393}</div>
        <div class="ed-header-text">
          <div class="ed-header-title">Ed</div>
          <div class="ed-header-subtitle">School Tools Assistant</div>
        </div>
        <button class="ed-close-btn" id="ed-close">\u2715</button>
      </div>
      ${toolBadge}
      <div class="ed-messages" id="ed-messages">
        ${messagesHtml}
        ${loadingHtml}
      </div>
      <div class="ed-input-container">
        <div class="ed-input-wrapper">
          <input 
            type="text" 
            class="ed-input" 
            id="ed-input"
            placeholder="Ask Ed anything..."
            ${this.isLoading ? "disabled" : ""}
          />
          <button class="ed-send-btn" id="ed-send" ${this.isLoading ? "disabled" : ""}>
            \u27A4
          </button>
        </div>
      </div>
    `;
    }
    /**
     * Attach event listeners to the panel
     */
    attachEventListeners() {
      if (!this.shadowRoot)
        return;
      const closeBtn = this.shadowRoot.getElementById("ed-close");
      if (closeBtn) {
        closeBtn.onclick = () => {
          this.isExpanded = false;
          this.render();
        };
      }
      const input = this.shadowRoot.getElementById("ed-input");
      const sendBtn = this.shadowRoot.getElementById("ed-send");
      if (input && sendBtn) {
        sendBtn.onclick = () => this.handleSend(input);
        input.onkeydown = (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            this.handleSend(input);
          }
        };
        setTimeout(() => input.focus(), 100);
      }
      const messages = this.shadowRoot.getElementById("ed-messages");
      if (messages) {
        messages.scrollTop = messages.scrollHeight;
      }
    }
    /**
     * Handle sending a message
     */
    async handleSend(input) {
      const text = input.value.trim();
      if (!text || this.isLoading)
        return;
      this.messages.push({
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: /* @__PURE__ */ new Date()
      });
      input.value = "";
      this.isLoading = true;
      this.render();
      try {
        const response = await this.onAskQuestion(text);
        this.messages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: /* @__PURE__ */ new Date()
        });
      } catch (error) {
        console.error("[Ed Widget] Error:", error);
        this.messages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I had trouble with that. Please try again.",
          timestamp: /* @__PURE__ */ new Date()
        });
      }
      this.isLoading = false;
      this.render();
    }
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // src/shared/tool-expertise.ts
  var TOOL_EXPERTISE = {
    "canva-edu": ["design templates", "brand kit setup", "student collaboration", "classroom folders"],
    "google-workspace-edu": ["Google Classroom", "Drive organization", "admin console", "student permissions"],
    "every-budget": ["budget forecasting", "staffing costs", "scenario planning", "CFR codes"],
    "schoolbus": ["safeguarding", "KCSIE", "model policies", "statutory compliance"],
    "widgit-online": ["symbol communication", "visual timetables", "social stories", "SEND resources"],
    "immersive-reader": ["text-to-speech", "line focus", "syllable highlighting", "translation"],
    "teachers-pet": ["curriculum resources", "differentiated materials", "display materials", "planning"],
    "smartsurvey": ["survey design", "GDPR compliance", "data export", "parent voice"],
    "tlp-templates": ["HR policies", "employment contracts", "absence management", "grievance procedures"],
    "condition-survey": ["building conditions", "DfE programmes", "estates planning", "maintenance"],
    "risk-assessment-tool": ["risk assessment", "health and safety", "school trips", "event planning"],
    "analyse-school-performance": ["attainment data", "progress measures", "absence analysis", "SEF writing"],
    // MIS systems
    "sims": ["pupil data", "attendance", "behaviour", "assessment", "reports"],
    "arbor": ["pupil management", "attendance tracking", "assessment", "parent communication"],
    "bromcom": ["MIS", "attendance", "assessment", "parent portal"],
    // Finance
    "ps-financials": ["budget management", "purchase orders", "invoicing", "financial reporting"],
    "fms": ["financial management", "budgeting", "accounting"],
    // Safeguarding
    "cpoms": ["safeguarding", "incident logging", "welfare concerns", "case management"],
    "myconcern": ["safeguarding", "welfare tracking", "early help"],
    // HR
    "every-hr": ["HR management", "payroll", "absence tracking", "recruitment"],
    "key-hr": ["HR policies", "employment contracts", "procedures"],
    // Parents
    "parentpay": ["payment processing", "parent accounts", "meal bookings"],
    "parentmail": ["parent communication", "messaging", "notifications"],
    // Teaching
    "google-classroom": ["assignments", "grading", "student collaboration", "classroom management"],
    "microsoft-teams": ["video calls", "assignments", "collaboration", "meetings"]
  };
  function getToolExpertise(toolId) {
    return TOOL_EXPERTISE[toolId.toLowerCase()] || ["general guidance", "best practices"];
  }

  // src/content/ed-real-widget.ts
  function hasWebGL() {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch {
      return false;
    }
  }
  async function checkAccess() {
    try {
      const result = await chrome.storage.local.get("ed_auth_token");
      const token = result.ed_auth_token;
      const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || chrome.runtime.getManifest().version.includes("dev");
      if (!token) {
        const isDevSite = window.location.hostname !== "schoolgle.co.uk" && window.location.hostname !== "www.schoolgle.co.uk";
        if (isDev || isDevSite) {
          console.log("[Ed Real Widget] \u26A0\uFE0F Development mode: Loading without auth");
          return { hasAccess: true, userId: "dev-user", isDev: true };
        }
        return { hasAccess: false, error: "Not authenticated" };
      }
      const apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:3000/api" : "https://schoolgle.co.uk/api";
      const response = await fetch(`${apiBase}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (isDev) {
          console.log("[Ed Real Widget] \u26A0\uFE0F Development mode: Auth check failed, but allowing");
          return { hasAccess: true, userId: "dev-user", isDev: true };
        }
        return { hasAccess: false, error: "Invalid token" };
      }
      const userData = await response.json();
      const subResponse = await fetch(
        `${apiBase}/subscription/check?userId=${userData.userId}&product=ed_pro`
      );
      if (!subResponse.ok) {
        if (isDev) {
          console.log("[Ed Real Widget] \u26A0\uFE0F Development mode: Subscription check failed, but allowing");
          return { hasAccess: true, userId: userData.userId || "dev-user", isDev: true };
        }
        return { hasAccess: false, error: "Subscription check failed" };
      }
      const subData = await subResponse.json();
      if (!subData.hasAccess) {
        if (isDev) {
          console.log("[Ed Real Widget] \u26A0\uFE0F Development mode: No subscription, but allowing");
          return { hasAccess: true, userId: userData.userId || "dev-user", isDev: true };
        }
        return { hasAccess: false, error: "No active subscription" };
      }
      return { hasAccess: true, userId: userData.userId };
    } catch (error) {
      console.error("[Ed Real Widget] Access check failed:", error);
      const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isDev) {
        console.log("[Ed Real Widget] \u26A0\uFE0F Development mode: Error in access check, but allowing");
        return { hasAccess: true, userId: "dev-user", isDev: true };
      }
      return { hasAccess: false, error: "Access check failed" };
    }
  }
  async function injectPageScript() {
    try {
      if (window.__ED_PAGE_SCRIPT_LOADED__) {
        console.log("[Ed Real Widget] Page script already injected");
        return true;
      }
      const pageScriptUrl = chrome.runtime.getURL("content/inject-page.js");
      console.log("[Ed Real Widget] Injecting page script from:", pageScriptUrl);
      const script = document.createElement("script");
      script.id = "ed-page-script";
      script.src = pageScriptUrl;
      script.setAttribute("data-extension-id", chrome.runtime.id);
      script.type = "text/javascript";
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("[Ed Real Widget] \u2705 Page script loaded via src");
          resolve();
        };
        script.onerror = (error) => {
          console.error("[Ed Real Widget] \u274C Page script load error:", error);
          reject(new Error(`Failed to load page script from ${pageScriptUrl}`));
        };
        (document.head || document.documentElement).appendChild(script);
      });
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("[Ed Real Widget] Timeout waiting for page script ready");
          resolve(false);
        }, 5e3);
        const listener = (event) => {
          if (event.data?.source === "ed-page-script" && event.data?.type === "PAGE_SCRIPT_READY" && event.data?.extensionId === chrome.runtime.id) {
            clearTimeout(timeout);
            window.removeEventListener("message", listener);
            console.log("[Ed Real Widget] \u2705 Page script confirmed ready");
            resolve(true);
          }
        };
        window.addEventListener("message", listener);
      });
    } catch (error) {
      console.error("[Ed Real Widget] \u274C Failed to inject page script:", error);
      return false;
    }
  }
  async function sendInitToPageScript(config) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.error("[Ed Real Widget] \u23F1\uFE0F Timeout (15s) waiting for widget initialization");
        console.error("[Ed Real Widget] This might indicate:");
        console.error("[Ed Real Widget] 1. Bundle failed to load (check network tab)");
        console.error("[Ed Real Widget] 2. CSP blocking script execution");
        console.error("[Ed Real Widget] 3. Widget initialization error (check console)");
        window.removeEventListener("message", listener);
        resolve(false);
      }, 15e3);
      const listener = (event) => {
        if (event.data?.source === "ed-page-script" && event.data?.extensionId === chrome.runtime.id) {
          console.log("[Ed Real Widget] Received message from page script:", event.data.type);
          if (event.data?.type === "WIDGET_READY") {
            clearTimeout(timeout);
            window.removeEventListener("message", listener);
            console.log("[Ed Real Widget] \u2705 Widget initialized in page context");
            resolve(true);
          } else if (event.data?.type === "WIDGET_ERROR") {
            clearTimeout(timeout);
            window.removeEventListener("message", listener);
            console.error("[Ed Real Widget] \u274C Widget error:", event.data.payload?.error);
            resolve(false);
          } else if (event.data?.type === "PAGE_SCRIPT_READY") {
            console.log("[Ed Real Widget] \u2705 Page script is ready, sending init command...");
            window.postMessage({
              source: "ed-content-script",
              extensionId: chrome.runtime.id,
              type: "INIT_WIDGET",
              payload: config
            }, "*");
          }
        }
      };
      window.addEventListener("message", listener);
      console.log("[Ed Real Widget] Sending INIT_WIDGET command...");
      window.postMessage({
        source: "ed-content-script",
        extensionId: chrome.runtime.id,
        type: "INIT_WIDGET",
        payload: config
      }, "*");
    });
  }
  async function initializeRealEd() {
    if (window.__ED_REAL_WIDGET_INITIALIZING__) {
      console.debug("[Ed Real Widget] Already initializing, skipping duplicate");
      return false;
    }
    if (window.__ED_REAL_WIDGET_INITIALIZED__) {
      console.debug("[Ed Real Widget] Already initialized, skipping");
      return true;
    }
    window.__ED_REAL_WIDGET_INITIALIZING__ = true;
    try {
      console.log("[Ed Real Widget] ========================================");
      console.log("[Ed Real Widget] Starting initialization...");
      console.log("[Ed Real Widget] URL:", window.location.href);
      console.log("[Ed Real Widget] Hostname:", window.location.hostname);
      const webglAvailable = hasWebGL();
      console.log("[Ed Real Widget] WebGL check:", webglAvailable);
      if (!webglAvailable) {
        console.warn("[Ed Real Widget] \u274C WebGL not available, falling back to CSS widget");
        return false;
      }
      console.log("[Ed Real Widget] \u2705 WebGL available");
      console.log("[Ed Real Widget] Checking access...");
      const access = await checkAccess();
      const isDevMode = access.isDev || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.includes("schoolgle.co.uk") || // Allow on schoolgle domains
      true;
      if (!access.hasAccess && !isDevMode) {
        console.log("[Ed Real Widget] \u274C No access:", access.error);
        showAccessPrompt(access.error);
        return false;
      }
      if (isDevMode) {
        console.log("[Ed Real Widget] \u2705 Development/testing mode: Loading widget without auth");
      } else {
        console.log("[Ed Real Widget] \u2705 Access granted");
      }
      console.log("[Ed Real Widget] Injecting page context script...");
      const pageScriptInjected = await injectPageScript();
      if (!pageScriptInjected) {
        console.error("[Ed Real Widget] \u274C Failed to inject page script");
        return false;
      }
      console.log("[Ed Real Widget] \u2705 Page script injected");
      const { buildWidgetConfig: buildWidgetConfig2 } = await Promise.resolve().then(() => (init_config(), config_exports));
      const edConfig = await buildWidgetConfig2();
      let prefs = {};
      if (typeof chrome !== "undefined" && chrome?.storage?.local) {
        try {
          prefs = await chrome.storage.local.get("ed_user_prefs");
        } catch (error) {
          console.warn("[Ed Real Widget] Failed to load user prefs:", error);
        }
      }
      const widgetConfig = {
        schoolId: access.userId || "extension",
        theme: "standard",
        position: "bottom-right",
        language: prefs.language || edConfig.language || "en-GB",
        persona: prefs.persona || edConfig.persona || "ed",
        features: {
          admissions: false,
          policies: false,
          calendar: false,
          staffDirectory: false,
          formFill: true,
          voice: edConfig.enableTTS && (edConfig.ttsProvider === "browser" || !!edConfig.fishAudioApiKey)
        },
        // Provider selection
        provider: edConfig.provider,
        enableAI: edConfig.enableAI,
        enableTTS: edConfig.enableTTS,
        ttsProvider: edConfig.ttsProvider || "browser"
      };
      if (edConfig.provider === "openrouter") {
        widgetConfig.openRouterApiKey = edConfig.openRouterApiKey;
      } else if (edConfig.provider === "gemini") {
        widgetConfig.geminiApiKey = edConfig.geminiApiKey;
      }
      if (edConfig.enableTTS && edConfig.ttsProvider === "fish") {
        widgetConfig.fishAudioApiKey = edConfig.fishAudioApiKey;
        if (edConfig.fishAudioVoiceIds) {
          widgetConfig.fishAudioVoiceIds = edConfig.fishAudioVoiceIds;
        }
      }
      console.log("[Ed Real Widget] Sending init command to page script with config:", {
        provider: widgetConfig.provider,
        enableAI: widgetConfig.enableAI,
        enableTTS: widgetConfig.enableTTS,
        ttsProvider: widgetConfig.ttsProvider,
        hasKeys: {
          openrouter: !!widgetConfig.openRouterApiKey,
          gemini: !!widgetConfig.geminiApiKey,
          fish: !!widgetConfig.fishAudioApiKey
        }
      });
      const widgetInitialized2 = await sendInitToPageScript(widgetConfig);
      if (!widgetInitialized2) {
        console.error("[Ed Real Widget] \u274C Failed to initialize widget in page context");
        return false;
      }
      const tool = detectTool(window.location, document);
      if (tool) {
        const expertise = getToolExpertise(tool.id);
        window.postMessage({
          source: "ed-content-script",
          extensionId: chrome.runtime.id,
          type: "SET_TOOL_CONTEXT",
          payload: {
            name: tool.name,
            category: tool.category,
            url: window.location.href,
            expertise
          }
        }, "*");
      }
      let lastUrl2 = window.location.href;
      const urlObserver2 = new MutationObserver(() => {
        if (window.location.href !== lastUrl2) {
          lastUrl2 = window.location.href;
          const newTool = detectTool(window.location, document);
          if (newTool) {
            const expertise = getToolExpertise(newTool.id);
            window.postMessage({
              source: "ed-content-script",
              extensionId: chrome.runtime.id,
              type: "SET_TOOL_CONTEXT",
              payload: {
                name: newTool.name,
                category: newTool.category,
                url: window.location.href,
                expertise
              }
            }, "*");
          }
        }
      });
      urlObserver2.observe(document.body, { childList: true, subtree: true });
      console.log("[Ed Real Widget] \u2705\u2705\u2705 Initialized successfully \u2705\u2705\u2705");
      console.log("[Ed Real Widget] ========================================");
      window.__ED_REAL_WIDGET_INITIALIZED__ = true;
      window.__ED_REAL_WIDGET_INITIALIZING__ = false;
      return true;
    } catch (error) {
      console.error("[Ed Real Widget] \u274C\u274C\u274C CRITICAL ERROR during initialization \u274C\u274C\u274C");
      console.error("[Ed Real Widget] Error:", error);
      console.error("[Ed Real Widget] Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("[Ed Real Widget] Error message:", error instanceof Error ? error.message : String(error));
      console.error("[Ed Real Widget] Stack:", error instanceof Error ? error.stack : "No stack");
      console.error("[Ed Real Widget] ========================================");
      window.__ED_REAL_WIDGET_INITIALIZING__ = false;
      return false;
    }
  }
  function showAccessPrompt(error) {
    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || !window.location.hostname.includes("schoolgle.co.uk");
    if (isDev) {
      console.log("[Ed Real Widget] Skipping access prompt in dev mode");
      return;
    }
    const existingPrompt = document.getElementById("ed-access-prompt");
    if (existingPrompt) {
      existingPrompt.remove();
    }
    const prompt = document.createElement("div");
    prompt.id = "ed-access-prompt";
    prompt.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 24px;
    background: #1e293b;
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 2147483646;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 320px;
    border: 1px solid #334155;
  `;
    prompt.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px;">Ed Access Required</div>
    <div style="color: #94a3b8; font-size: 13px; margin-bottom: 12px;">
      ${error === "Not authenticated" ? "Please log in to Schoolgle to use Ed." : error === "No active subscription" ? "You need an active subscription to use Ed." : "Unable to verify access. Please check your connection."}
    </div>
    <a href="https://schoolgle.co.uk/dashboard/account/trial" 
       target="_blank"
       style="display: inline-block; background: #059669; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 13px;">
      Get Started
    </a>
    <button id="ed-prompt-close" style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">\xD7</button>
  `;
    document.body.appendChild(prompt);
    const closeBtn = prompt.querySelector("#ed-prompt-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => prompt.remove());
    }
    setTimeout(() => prompt.remove(), 1e4);
  }

  // src/content/inject.ts
  var edWidget = null;
  var pageScriptReady = false;
  var widgetInitialized = false;
  async function initialize() {
    if (window.__ED_ALREADY_INIT__) {
      console.debug("[Ed Content] Skipping \u2013 already initialized");
      return;
    }
    if (shouldSkipPage()) {
      console.log("[Ed Content] Skipping page:", window.location.href);
      return;
    }
    if (window.top !== window.self) {
      console.debug("[Ed Content] Skipping \u2013 not top frame");
      return;
    }
    window.__ED_ALREADY_INIT__ = true;
    console.log("[Ed Content] Initializing on:", window.location.href);
    try {
      console.log("[Ed Content] Attempting to load real Ed widget via page context...");
      const realEdLoaded = await initializeRealEd();
      if (realEdLoaded) {
        console.log("[Ed Content] \u2705 Real Ed widget loaded successfully - CSS widget will NOT load");
        return;
      }
      console.warn("[Ed Content] \u26A0\uFE0F Real Ed widget failed to load, reason logged above");
    } catch (error) {
      console.error("[Ed Content] \u274C Error during real Ed widget initialization:", error);
      console.error("[Ed Content] Stack:", error instanceof Error ? error.stack : "No stack");
    }
    console.log("[Ed Content] Falling back to CSS widget");
    const state = await getEdState();
    edWidget = new EdWidget({
      isVisible: state.isVisible,
      isMinimized: state.isMinimized,
      onAskQuestion: handleAskQuestion,
      onClose: handleClose
    });
    const tool = detectTool(window.location, document);
    if (tool) {
      console.log("[Ed Content] Detected tool:", tool.name);
      edWidget.setTool(tool);
    }
    edWidget.mount();
  }
  function shouldSkipPage() {
    const url = window.location.href;
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
      return true;
    }
    if (url.startsWith("about:")) {
      return true;
    }
    if (url.startsWith("file://")) {
      return true;
    }
    const skipDomains = [
      "accounts.google.com",
      "login.microsoftonline.com",
      "auth0.com"
    ];
    if (skipDomains.some((domain) => url.includes(domain))) {
      return true;
    }
    return false;
  }
  async function getEdState() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.ED_STATE);
      return result[STORAGE_KEYS.ED_STATE] || {
        isVisible: true,
        isMinimized: false,
        currentTool: null,
        automationActive: false,
        automationPaused: false
      };
    } catch {
      return {
        isVisible: true,
        isMinimized: false,
        currentTool: null,
        automationActive: false,
        automationPaused: false
      };
    }
  }
  async function capturePageState() {
    try {
      const domSnapshot = document.documentElement.outerHTML;
      let screenshot = null;
      try {
        if (typeof chrome !== "undefined" && chrome?.tabs?.captureVisibleTab) {
          try {
            screenshot = await new Promise((resolve, reject) => {
              chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(dataUrl);
                }
              });
            });
            console.log("[Ed Content] Screenshot captured via chrome.tabs API");
          } catch (error) {
            console.warn("[Ed Content] chrome.tabs.captureVisibleTab failed:", error);
          }
        }
        if (!screenshot && window.html2canvas) {
          const canvas = await window.html2canvas(document.body, {
            useCORS: true,
            logging: false,
            scale: 0.5
            // Reduce size for performance
          });
          screenshot = canvas.toDataURL("image/png");
          console.log("[Ed Content] Screenshot captured via html2canvas");
        }
        if (!screenshot && typeof chrome !== "undefined" && chrome?.runtime?.sendMessage) {
          try {
            const response = await chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" });
            if (response?.screenshot) {
              screenshot = response.screenshot;
              console.log("[Ed Content] Screenshot captured via background script");
            }
          } catch (error) {
            console.warn("[Ed Content] Background screenshot capture failed:", error);
          }
        }
        if (!screenshot) {
          console.warn("[Ed Content] No screenshot capture method available");
        }
      } catch (error) {
        console.error("[Ed Content] Screenshot capture error:", error);
      }
      return {
        screenshot: screenshot || "",
        domSnapshot
      };
    } catch (error) {
      console.error("[Ed Content] Error capturing page state:", error);
      return null;
    }
  }
  async function handleAskQuestion(question) {
    const context = extractPageContext(window.location, document);
    const needsAutomation = detectAutomationRequest(question);
    let pageState = null;
    if (needsAutomation) {
      console.log("[Ed Content] Detected automation request, capturing page state...");
      pageState = await capturePageState();
    }
    try {
      const message = {
        type: "ASK_ED",
        question,
        context
      };
      if (pageState) {
        message.pageState = pageState;
      }
      const response = await chrome.runtime.sendMessage(message);
      return response.answer || "Sorry, I couldn't understand that. Could you try rephrasing?";
    } catch (error) {
      console.error("[Ed Content] Error asking question:", error);
      return "I'm having trouble connecting. Please try again in a moment.";
    }
  }
  function detectAutomationRequest(question) {
    const lowerQuestion = question.toLowerCase();
    const automationKeywords = [
      "fill",
      "click",
      "type",
      "select",
      "navigate",
      "go to",
      "open",
      "submit",
      "enter",
      "do this",
      "perform",
      "execute",
      "automate",
      "complete this",
      "fill in",
      "fill out"
    ];
    return automationKeywords.some((keyword) => lowerQuestion.includes(keyword));
  }
  function handleClose() {
    chrome.runtime.sendMessage({ type: "TOGGLE_ED", visible: false });
  }
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case "GET_PAGE_CONTEXT": {
        const context = extractPageContext(window.location, document);
        sendResponse(context);
        break;
      }
      case "TOGGLE_ED": {
        if (edWidget) {
          if (message.visible !== void 0) {
            edWidget.setVisible(message.visible);
          } else {
            edWidget.toggle();
          }
        }
        sendResponse({ success: true });
        break;
      }
      case "START_WATCH_MODE": {
        console.log("[Ed Content] Watch mode requested:", message.steps);
        sendResponse({ success: true });
        break;
      }
      case "START_ACT_MODE": {
        console.log("[Ed Content] Act mode requested:", message.actions);
        sendResponse({ success: true });
        break;
      }
      case "STOP_AUTOMATION": {
        console.log("[Ed Content] Stopping automation");
        sendResponse({ success: true });
        break;
      }
    }
    return true;
  });
  var lastUrl = window.location.href;
  var urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log("[Ed Content] URL changed:", lastUrl);
      const tool = detectTool(window.location, document);
      if (edWidget) {
        edWidget.setTool(tool);
      }
    }
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("message", (event) => {
    if (event.data?.source !== "ed-page-script" || event.data?.extensionId !== chrome.runtime.id) {
      return;
    }
    const { type, payload } = event.data;
    switch (type) {
      case "PAGE_SCRIPT_READY": {
        console.log("[Ed Content] Page script is ready");
        pageScriptReady = true;
        break;
      }
      case "WIDGET_READY": {
        console.log("[Ed Content] Widget initialized in page context");
        widgetInitialized = true;
        const tool = detectTool(window.location, document);
        if (tool) {
          sendToPageScript({
            type: "SET_TOOL_CONTEXT",
            payload: {
              name: tool.name,
              category: tool.category,
              url: window.location.href,
              expertise: getToolExpertise(tool.id)
            }
          });
        }
        break;
      }
      case "WIDGET_ERROR": {
        console.error("[Ed Content] Widget error from page context:", payload.error);
        widgetInitialized = false;
        initialize();
        break;
      }
    }
  });
  function sendToPageScript(message) {
    window.postMessage({
      source: "ed-content-script",
      extensionId: chrome.runtime.id,
      ...message
    }, "*");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
  console.log("[Ed Content] Content script loaded");
})();
