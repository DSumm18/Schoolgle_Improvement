console.log("Ed Background: Service worker starting");

let ws = null;
let connected = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Ed Background: Received message", message);

  if (message.action === "connect") {
    connect(message.url);
    sendResponse({ success: true });
  } else if (message.action === "disconnect") {
    disconnect();
    sendResponse({ success: true });
  } else if (message.action === "send") {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message.data));
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "Not connected" });
    }
  } else if (message.action === "execute") {
    executeInTab(message.command).then(sendResponse);
    return true;
  } else if (message.action === "screenshot") {
    takeScreenshot().then(sendResponse);
    return true;
  }

  return true;
});

function connect(url) {
  console.log("Ed Background: Connecting to", url);
  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("Ed Background: Connected");
    connected = true;
    chrome.runtime.sendMessage({ type: "connected" });
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Ed Background: Got command", data);
    handleCommand(data);
  };

  ws.onclose = () => {
    console.log("Ed Background: Disconnected");
    connected = false;
  };

  ws.onerror = (error) => {
    console.error("Ed Background: Error", error);
  };
}

function disconnect() {
  if (ws) ws.close();
  connected = false;
}

async function takeScreenshot() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab();
    return { success: true, data: { screenshot: dataUrl } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleCommand(data) {
  const { id, command, params } = data;
  let result;

  if (command === "read_page") {
    result = await executeInTab({ action: "read_dom" });
  } else if (command === "click") {
    result = await executeInTab({ action: "click", selector: params.selector });
  } else if (command === "type") {
    result = await executeInTab({ action: "type", selector: params.selector, value: params.value });
  } else if (command === "screenshot") {
    result = await takeScreenshot();
  } else {
    result = { success: false, error: "Unknown command" };
  }

  ws.send(JSON.stringify({ type: "response", id, result }));
}

async function executeInTab(message) {
  // Handle screenshot directly
  if (message.action === "screenshot") {
    return await takeScreenshot();
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    // Content script not loaded - inject it
    console.log("Ed Background: Injecting content script...");
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    // Wait a bit for the script to load, then retry
    await new Promise(r => setTimeout(r, 100));
    return await chrome.tabs.sendMessage(tab.id, message);
  }
}
