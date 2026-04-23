/**
 * Background Service Worker
 * Manages WebSocket connection to Ed's backend
 */

const DEFAULT_WS_URL = "ws://localhost:8080";
let ws = null;
let reconnectTimer = null;
let isManualDisconnect = false;

// Connection state
const state = {
  connected: false,
  url: null,
  lastCommand: null,
  commandCount: 0,
};

console.log("[Ed Background] Service worker starting");

// =====================================================
// WebSocket Management
// =====================================================

/**
 * Connect to WebSocket server
 */
function connect(url = DEFAULT_WS_URL) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("[Ed Background] Already connected");
    return;
  }

  console.log(`[Ed Background] Connecting to ${url}`);
  state.url = url;

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("[Ed Background] WebSocket connected");
      state.connected = true;
      notifyPopup({ type: "connected", url });
    };

    ws.onmessage = async (event) => {
      console.log("[Ed Background] Received:", event.data);
      const message = JSON.parse(event.data);
      await handleCommand(message);
    };

    ws.onclose = () => {
      console.log("[Ed Background] WebSocket disconnected");
      state.connected = false;
      notifyPopup({ type: "disconnected" });

      // Auto-reconnect if not manual
      if (!isManualDisconnect) {
        scheduleReconnect();
      }
    };

    ws.onerror = (error) => {
      console.error("[Ed Background] WebSocket error:", error);
    };
  } catch (error) {
    console.error("[Ed Background] Connection failed:", error);
    scheduleReconnect();
  }
}

/**
 * Disconnect from WebSocket
 */
function disconnect() {
  isManualDisconnect = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  state.connected = false;
}

/**
 * Schedule reconnection attempt
 */
function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    console.log("[Ed Background] Attempting to reconnect...");
    reconnectTimer = null;
    isManualDisconnect = false;
    connect(state.url || DEFAULT_WS_URL);
  }, 3000);
}

/**
 * Send message to WebSocket server
 */
function send(message) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error("[Ed Background] Cannot send: not connected");
    return false;
  }

  try {
    ws.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error("[Ed Background] Send failed:", error);
    return false;
  }
}

// =====================================================
// Command Handler
// =====================================================

/**
 * Handle incoming command from WebSocket
 */
async function handleCommand(message) {
  const { id, command, params } = message;
  state.lastCommand = command;
  state.commandCount++;

  let result;

  try {
    switch (command) {
      case "ping":
        result = { pong: true, timestamp: Date.now() };
        break;

      case "navigate":
        result = await navigateTo(params.url);
        break;

      case "read_page":
        result = await executeInActiveTab({ action: "read_dom" });
        break;

      case "click":
        result = await executeInActiveTab({
          action: "click",
          selector: params.selector,
          waitForSelector: params.wait || false,
        });
        break;

      case "type":
        result = await executeInActiveTab({
          action: "type",
          selector: params.selector,
          value: params.value,
          waitForSelector: params.wait || false,
        });
        break;

      case "select":
        result = await executeInActiveTab({
          action: "select",
          selector: params.selector,
          value: params.value,
          waitForSelector: params.wait || false,
        });
        break;

      case "check":
        result = await executeInActiveTab({
          action: "check",
          selector: params.selector,
          waitForSelector: params.wait || false,
        });
        break;

      case "uncheck":
        result = await executeInActiveTab({
          action: "uncheck",
          selector: params.selector,
          waitForSelector: params.wait || false,
        });
        break;

      case "screenshot":
        result = await captureScreenshot();
        break;

      case "get_url":
        result = await getCurrentUrl();
        break;

      default:
        result = { success: false, error: `Unknown command: ${command}` };
    }
  } catch (error) {
    result = { success: false, error: error.message };
  }

  // Send response back
  send({
    type: "response",
    id,
    command,
    result,
  });
}

/**
 * Navigate to a URL
 */
async function navigateTo(url) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      return { success: false, error: "No active tab" };
    }

    await chrome.tabs.update(tab.id, { url });
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Execute a command in the active tab's content script
 */
async function executeInActiveTab(message) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      return { success: false, error: "No active tab" };
    }

    // Check if we can access the tab (some pages restrict content scripts)
    if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("edge://"))) {
      return { success: false, error: "Cannot access special browser pages" };
    }

    const response = await chrome.tabs.sendMessage(tab.id, message);
    return response;
  } catch (error) {
    // Content script might not be loaded yet - try injecting
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      // Retry after injection
      const response = await chrome.tabs.sendMessage(tab.id, message);
      return response;
    } catch (retryError) {
      return { success: false, error: retryError.message };
    }
  }
}

/**
 * Capture a screenshot of the active tab
 */
async function captureScreenshot() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      return { success: false, error: "No active tab" };
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });
    return { success: true, data: { screenshot: dataUrl } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get the current tab's URL
 */
async function getCurrentUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      return { success: false, error: "No active tab" };
    }
    return { success: true, data: { url: tab.url, title: tab.title } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// Popup Communication
// =====================================================

/**
 * Send state update to popup
 */
function notifyPopup(message) {
  chrome.runtime.sendMessage({
    type: "state_update",
    ...message,
    state,
  }).catch(() => {
    // Popup might not be open, that's fine
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Ed Background] Received from popup:", message);

  switch (message.action) {
    case "connect":
      connect(message.url);
      sendResponse({ success: true });
      break;

    case "disconnect":
      disconnect();
      sendResponse({ success: true });
      break;

    case "get_state":
      sendResponse({ success: true, state });
      break;

    case "send_command":
      const sent = send(message.command);
      sendResponse({ success: sent });
      break;

    default:
      sendResponse({ success: false, error: "Unknown action" });
  }

  return true;
});

// =====================================================
// Startup
// =====================================================

// Auto-connect on startup (can be disabled by user preference)
chrome.storage.local.get(["autoConnect", "wsUrl"], (result) => {
  if (result.autoConnect !== false) {
    connect(result.wsUrl || DEFAULT_WS_URL);
  }
});
