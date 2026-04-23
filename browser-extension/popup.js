/**
 * Popup Script - Controls the extension popup UI
 */

// DOM Elements
const elements = {
  status: document.getElementById("status"),
  statusText: document.getElementById("status-text"),
  wsUrl: document.getElementById("ws-url"),
  connectBtn: document.getElementById("connect-btn"),
  disconnectBtn: document.getElementById("disconnect-btn"),
  commandCount: document.getElementById("command-count"),
  lastCommand: document.getElementById("last-command"),
  btnRead: document.getElementById("btn-read"),
  btnScreenshot: document.getElementById("btn-screenshot"),
  testSelector: document.getElementById("test-selector"),
  testValue: document.getElementById("test-value"),
  btnClick: document.getElementById("btn-click"),
  btnType: document.getElementById("btn-type"),
};

// State
let state = {
  connected: false,
  url: null,
  lastCommand: null,
  commandCount: 0,
};

// =====================================================
// Initialization
// =====================================================

async function init() {
  // Get initial state from background
  const response = await chrome.runtime.sendMessage({ action: "get_state" });
  if (response?.success) {
    updateState(response.state);
  }

  // Load saved WebSocket URL
  chrome.storage.local.get(["wsUrl"], (result) => {
    if (result.wsUrl) {
      elements.wsUrl.value = result.wsUrl;
    }
  });

  setupEventListeners();
}

function setupEventListeners() {
  elements.connectBtn.addEventListener("click", connect);
  elements.disconnectBtn.addEventListener("click", disconnect);
  elements.btnRead.addEventListener("click", readPage);
  elements.btnScreenshot.addEventListener("click", takeScreenshot);
  elements.btnClick.addEventListener("click", () => sendTestCommand("click"));
  elements.btnType.addEventListener("click", () => sendTestCommand("type"));

  // Listen for state updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "state_update") {
      updateState(message.state);
    }
  });
}

// =====================================================
// Connection Management
// =====================================================

function connect() {
  const url = elements.wsUrl.value.trim();
  if (!url) {
    showStatus("error", "Enter a WebSocket URL");
    return;
  }

  // Save URL
  chrome.storage.local.set({ wsUrl: url });

  chrome.runtime.sendMessage({
    action: "connect",
    url,
  }, (response) => {
    if (response?.success) {
      showStatus("connecting", "Connecting...");
    } else {
      showStatus("error", "Failed to connect");
    }
  });
}

function disconnect() {
  chrome.runtime.sendMessage({ action: "disconnect" }, (response) => {
    if (response?.success) {
      showStatus("disconnected", "Disconnected");
    }
  });
}

// =====================================================
// Commands
// =====================================================

function readPage() {
  sendCommand("read_page", {});
}

function takeScreenshot() {
  sendCommand("screenshot", {});
}

function sendTestCommand(command) {
  const selector = elements.testSelector.value.trim();
  const value = elements.testValue.value.trim();

  if (!selector) {
    showStatus("error", "Enter a CSS selector");
    return;
  }

  if (command === "type" && !value) {
    showStatus("error", "Enter a value to type");
    return;
  }

  const params = { selector, wait: true };
  if (command === "type") {
    params.value = value;
  }

  sendCommand(command, params);
}

function sendCommand(command, params) {
  chrome.runtime.sendMessage({
    action: "send_command",
    command: {
      id: Date.now(),
      command,
      params,
    },
  }, (response) => {
    if (response?.success) {
      showStatus("success", `Sent: ${command}`);
    } else {
      showStatus("error", "Failed to send command");
    }
  });
}

// =====================================================
// UI Updates
// =====================================================

function updateState(newState) {
  state = { ...state, ...newState };
  render();
}

function render() {
  // Update connection status
  if (state.connected) {
    elements.status.className = "status connected";
    elements.statusText.textContent = `Connected to ${state.url || "server"}`;
    elements.connectBtn.disabled = true;
    elements.disconnectBtn.disabled = false;
  } else {
    elements.status.className = "status disconnected";
    elements.statusText.textContent = "Disconnected";
    elements.connectBtn.disabled = false;
    elements.disconnectBtn.disabled = true;
  }

  // Update stats
  elements.commandCount.textContent = state.commandCount || 0;
  elements.lastCommand.textContent = state.lastCommand || "-";
}

function showStatus(type, message) {
  elements.statusText.textContent = message;
  setTimeout(() => {
    if (state.connected) {
      elements.statusText.textContent = `Connected to ${state.url || "server"}`;
    } else {
      elements.statusText.textContent = "Disconnected";
    }
  }, 3000);
}

// =====================================================
// Start
// =====================================================

init();
