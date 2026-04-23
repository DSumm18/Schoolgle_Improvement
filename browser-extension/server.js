/**
 * Ed WebSocket Server - Development/Test Server
 *
 * Run with: node server.js
 *
 * This is a standalone test server for the browser extension.
 * In production, this will be integrated into Ed's backend.
 */

const WebSocket = require("ws");

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`[Ed Server] WebSocket server listening on ws://localhost:${PORT}`);

wss.on("connection", (ws) => {
  console.log("[Ed Server] Client connected");

  // Send welcome message
  ws.send(JSON.stringify({
    type: "connected",
    message: "Ed's hands are ready",
  }));

  // Handle incoming messages
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log("[Ed Server] Received:", message);

      // Handle different message types
      if (message.type === "response") {
        console.log("[Ed Server] Response to command:", message.command);
        console.log("[Ed Server] Result:", message.result);
      }
    } catch (error) {
      console.error("[Ed Server] Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("[Ed Server] Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("[Ed Server] WebSocket error:", error);
  });

  // Example: Send a ping after 5 seconds
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        id: Date.now(),
        command: "ping",
        params: {},
      }));
    }
  }, 5000);
});

// =====================================================
// Command Examples (uncomment to test)
// =====================================================

// Example: Read the current page
/*
setTimeout(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        id: Date.now(),
        command: "read_page",
        params: {},
      }));
    }
  });
}, 10000);
*/

// Example: Click an element
/*
setTimeout(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        id: Date.now(),
        command: "click",
        params: {
          selector: "#submit-button",
          wait: true,
        },
      }));
    }
  });
}, 15000);
*/

// Example: Type into a field
/*
setTimeout(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        id: Date.now(),
        command: "type",
        params: {
          selector: "#name-input",
          value: "Ed",
          wait: true,
        },
      }));
    }
  });
}, 20000);
*/

console.log("[Ed Server] Ready. Load the extension in Chrome to connect.");
