console.log("Ed Popup: Loaded");

const statusEl = document.getElementById("status");
const urlInput = document.getElementById("ws-url");
let connected = false;

document.getElementById("connect-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "connect", url: urlInput.value }, (resp) => {
    console.log("Connect response", resp);
  });
});

document.getElementById("disconnect-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "disconnect" });
});

document.getElementById("read-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "execute", command: { action: "read_dom" } }, (resp) => {
    console.log("Read page response", resp);
    alert(JSON.stringify(resp, null, 2));
  });
});

document.getElementById("screenshot-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "screenshot" }, (resp) => {
    console.log("Screenshot response", resp);
    if (resp && resp.data && resp.data.screenshot) {
      // Open screenshot in new tab
      const tab = window.open();
      tab.document.write("<img src='" + resp.data.screenshot + "' style='max-width:100%' />");
    } else {
      alert("Screenshot failed: " + JSON.stringify(resp));
    }
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "connected") {
    connected = true;
    statusEl.className = "status connected";
    statusEl.textContent = "Connected";
  }
});
