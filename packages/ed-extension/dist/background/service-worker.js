// src/shared/types.ts
var STORAGE_KEYS = {
  ED_STATE: "ed_state",
  USER_PREFERENCES: "ed_user_prefs",
  RESPONSE_CACHE: "ed_response_cache",
  TOOL_HISTORY: "ed_tool_history",
  AUTH_TOKEN: "ed_auth_token",
  SUBSCRIPTION: "ed_subscription"
};
var DEFAULT_PREFERENCES = {
  enabled: true,
  showOnStartup: true,
  language: "en-GB",
  voiceEnabled: false,
  automationConsent: false,
  disabledSites: []
};

// src/shared/api.ts
var API_BASE_URL = "https://schoolgle.co.uk/api";
var DEV_API_BASE_URL = "http://localhost:3000/api";
async function getApiUrl() {
  try {
    const result = await chrome.storage.local.get(["ed_dev_mode", "ed_api_url"]);
    if (result.ed_api_url) {
      return result.ed_api_url;
    }
    if (result.ed_dev_mode === true) {
      return DEV_API_BASE_URL;
    }
    if (result.ed_dev_mode === false) {
      return API_BASE_URL;
    }
  } catch (e) {
  }
  return DEV_API_BASE_URL;
}
async function checkSubscription(userId) {
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}/subscription/check?userId=${encodeURIComponent(userId)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Subscription check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    const isExpectedError = error instanceof TypeError && error.message.includes("Failed to fetch") || error instanceof Error && (error.message.includes("404") || error.message.includes("Network"));
    if (!isExpectedError) {
      console.warn("[Ed API] Subscription check error:", error);
    }
    return {
      hasAccess: false,
      status: "none",
      plan: null,
      daysRemaining: null,
      trialEnds: null,
      periodEnds: null,
      school: null
    };
  }
}
async function askEd(question, context, pageState) {
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}/ed/chat`;
  try {
    const config = await chrome.storage.local.get("ed_config");
    const geminiApiKey = config.ed_config?.geminiApiKey;
    const body = {
      question,
      context: {
        url: context.url,
        hostname: context.hostname,
        title: context.title,
        tool: context.detectedTool,
        visibleText: context.visibleText.slice(0, 3e3),
        // Limit for API
        headings: context.headings.slice(0, 20),
        selectedText: context.selectedText
      }
    };
    if (geminiApiKey) {
      body.geminiApiKey = geminiApiKey;
    }
    if (pageState) {
      body.pageState = pageState;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    const isExpectedError = error instanceof TypeError && error.message.includes("Failed to fetch") || error instanceof Error && (error.message.includes("404") || error.message.includes("Network"));
    if (!isExpectedError) {
      console.warn("[Ed API] Unexpected error:", error);
    }
    return {
      id: crypto.randomUUID(),
      answer: "I'm having trouble connecting right now. Try asking again in a moment, or check your internet connection.",
      confidence: 0,
      source: "fallback"
    };
  }
}
async function reportAnalytics(event) {
  const apiUrl = await getApiUrl();
  if (apiUrl.includes("localhost"))
    return;
  const url = `${apiUrl}/ed/analytics`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...event,
        timestamp: Date.now(),
        version: chrome.runtime.getManifest().version
      })
    });
  } catch {
  }
}

// src/background/service-worker.ts
var API_BASE = "https://schoolgle.co.uk";
var responseCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 5 * 60 * 1e3;
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[Ed Background] Extension installed/updated:", details.reason);
  if (details.reason === "install") {
    await chrome.storage.local.set({
      [STORAGE_KEYS.USER_PREFERENCES]: DEFAULT_PREFERENCES,
      [STORAGE_KEYS.ED_STATE]: {
        isVisible: true,
        isMinimized: false,
        currentTool: null,
        automationActive: false,
        automationPaused: false
      }
    });
    chrome.tabs.create({
      url: "https://schoolgle.co.uk/ed/welcome"
    });
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((error) => {
    console.error("[Ed Background] Message handler error:", error);
    sendResponse({ error: error.message });
  });
  return true;
});
async function handleMessage(message, sender) {
  switch (message.type) {
    case "ASK_ED": {
      const { question, context, pageState } = message;
      if (!pageState) {
        const cacheKey2 = `${context.detectedTool?.id || "general"}:${question.toLowerCase().trim()}`;
        const cached = responseCache.get(cacheKey2);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log("[Ed Background] Cache hit for:", cacheKey2);
          return {
            id: crypto.randomUUID(),
            answer: cached.response,
            confidence: 0.9,
            source: "cache"
          };
        }
      }
      try {
        const response = await askEd(question, context, pageState);
        if (response.source === "ai" && response.confidence > 0.7) {
          responseCache.set(cacheKey, {
            response: response.answer,
            timestamp: Date.now()
          });
        }
        reportAnalytics({
          type: "question_asked",
          toolId: context.detectedTool?.id
        }).catch(() => {
        });
        return response;
      } catch (error) {
        const isExpectedError = error instanceof TypeError && error.message?.includes("Failed to fetch") || error instanceof Error && (error.message?.includes("404") || error.message?.includes("Network"));
        if (!isExpectedError) {
          console.warn("[Ed Background] API call failed, using fallback:", error);
        }
        return {
          id: crypto.randomUUID(),
          answer: "I'm having trouble connecting right now. Try asking again in a moment, or check your internet connection.",
          confidence: 0,
          source: "fallback"
        };
      }
    }
    case "TOGGLE_ED": {
      const state = await getEdState();
      const newVisible = message.visible ?? !state.isVisible;
      await chrome.storage.local.set({
        [STORAGE_KEYS.ED_STATE]: {
          ...state,
          isVisible: newVisible
        }
      });
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "TOGGLE_ED",
            visible: newVisible
          }).catch(() => {
          });
        }
      }
      return { success: true, visible: newVisible };
    }
    case "GET_PAGE_CONTEXT": {
      const tabId = message.tabId || sender.tab?.id;
      if (!tabId) {
        throw new Error("No tab ID available");
      }
      return chrome.tabs.sendMessage(tabId, { type: "GET_PAGE_CONTEXT" });
    }
    case "STOP_AUTOMATION": {
      const state = await getEdState();
      await chrome.storage.local.set({
        [STORAGE_KEYS.ED_STATE]: {
          ...state,
          automationActive: false,
          automationPaused: false
        }
      });
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: "STOP_AUTOMATION" });
      }
      return { success: true };
    }
    case "CHECK_AUTH": {
      const authState = await getAuthState();
      let subscription = null;
      if (authState.isAuthenticated && authState.userId) {
        subscription = await checkAndCacheSubscription(authState.userId);
      }
      return {
        type: "AUTH_STATUS",
        status: authState,
        subscription
      };
    }
    case "LOGIN": {
      const { token } = message;
      const response = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        const authState = {
          userId: userData.userId,
          email: userData.email,
          organizationId: userData.organizationId,
          isAuthenticated: true,
          lastChecked: Date.now()
        };
        await chrome.storage.local.set({
          [STORAGE_KEYS.AUTH_TOKEN]: token,
          [STORAGE_KEYS.SUBSCRIPTION]: null
          // Clear cache
        });
        const subscription = await checkAndCacheSubscription(userData.userId);
        return { success: true, authState, subscription };
      }
      return { success: false, error: "Invalid token" };
    }
    case "LOGOUT": {
      await chrome.storage.local.remove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.SUBSCRIPTION
      ]);
      return { success: true };
    }
    case "GET_API_KEYS": {
      try {
        const authState = await getAuthState();
        if (!authState.isAuthenticated || !authState.userId) {
          return { error: "Not authenticated" };
        }
        const tokenResult = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
        const token = tokenResult[STORAGE_KEYS.AUTH_TOKEN];
        if (!token) {
          return { error: "No auth token" };
        }
        const response = await fetch(`${API_BASE}/api/ed/keys`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
          const data = await response.json();
          return {
            geminiApiKey: data.geminiApiKey,
            fishAudioApiKey: data.fishAudioApiKey
          };
        }
        return { error: "Failed to get API keys" };
      } catch (error) {
        console.error("[Ed Background] Error getting API keys:", error);
        return { error: "API key fetch failed" };
      }
    }
    case "CAPTURE_SCREENSHOT": {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) {
          return { error: "No active tab" };
        }
        const dataUrl = await chrome.tabs.captureVisibleTab(void 0, {
          format: "png"
        });
        return { screenshot: dataUrl };
      } catch (error) {
        console.error("[Ed Background] Error capturing screenshot:", error);
        return { error: "Screenshot capture failed" };
      }
    }
    default:
      console.warn("[Ed Background] Unknown message type:", message.type);
      return { error: "Unknown message type" };
  }
}
async function getAuthState() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
  const token = result[STORAGE_KEYS.AUTH_TOKEN];
  if (!token) {
    return {
      userId: null,
      email: null,
      organizationId: null,
      isAuthenticated: false,
      lastChecked: Date.now()
    };
  }
  try {
    const response = await fetch(`${API_BASE}/api/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    if (response.ok) {
      const userData = await response.json();
      return {
        userId: userData.userId,
        email: userData.email,
        organizationId: userData.organizationId,
        isAuthenticated: true,
        lastChecked: Date.now()
      };
    }
  } catch (error) {
    const isExpectedError = error instanceof TypeError && error.message?.includes("Failed to fetch") || error instanceof Error && (error.message?.includes("404") || error.message?.includes("Network"));
    if (!isExpectedError) {
      console.warn("[Ed Background] Auth check failed (non-critical):", error);
    }
  }
  await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
  return {
    userId: null,
    email: null,
    organizationId: null,
    isAuthenticated: false,
    lastChecked: Date.now()
  };
}
async function checkAndCacheSubscription(userId) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SUBSCRIPTION);
  const cached = result[STORAGE_KEYS.SUBSCRIPTION];
  if (cached && cached.timestamp && Date.now() - cached.timestamp < 5 * 60 * 1e3) {
    return cached.data;
  }
  try {
    const subscription = await checkSubscription(userId);
    await chrome.storage.local.set({
      [STORAGE_KEYS.SUBSCRIPTION]: {
        data: subscription,
        timestamp: Date.now()
      }
    });
    return subscription;
  } catch (error) {
    console.error("[Ed Background] Subscription check failed:", error);
    return null;
  }
}
async function getEdState() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ED_STATE);
  return result[STORAGE_KEYS.ED_STATE] || {
    isVisible: true,
    isMinimized: false,
    currentTool: null,
    automationActive: false,
    automationPaused: false
  };
}
chrome.commands?.onCommand?.addListener(async (command) => {
  console.log("[Ed Background] Command received:", command);
  if (command === "toggle-ed") {
    const state = await getEdState();
    await chrome.storage.local.set({
      [STORAGE_KEYS.ED_STATE]: {
        ...state,
        isVisible: !state.isVisible
      }
    });
  }
});
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}, CACHE_TTL);
console.log("[Ed Background] Service worker initialized");
