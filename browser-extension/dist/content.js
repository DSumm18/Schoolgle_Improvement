console.log("Ed Content: Script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Ed Content: Got message", message);
  
  if (message.action === "read_dom") {
    sendResponse(readPage());
  } else if (message.action === "click") {
    clickElement(message.selector).then(sendResponse);
    return true;
  } else if (message.action === "type") {
    typeInField(message.selector, message.value).then(sendResponse);
    return true;
  }
  
  return true;
});

function readPage() {
  const inputs = Array.from(document.querySelectorAll("input, textarea, select")).map(el => {
    return {
      selector: el.id ? "#" + el.id : "[name=\"" + el.name + "\"]",
      type: el.type || el.tagName.toLowerCase(),
      placeholder: el.placeholder || "",
      value: el.type === "password" ? "***" : el.value
    };
  });
  
  return {
    success: true,
    data: { url: window.location.href, title: document.title, inputs }
  };
}

async function clickElement(selector) {
  const el = document.querySelector(selector);
  if (!el) return { success: false, error: "Not found" };
  
  el.scrollIntoView({ block: "center" });
  await sleep(100);
  el.click();
  
  return { success: true };
}

async function typeInField(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return { success: false, error: "Not found" };
  
  el.focus();
  el.scrollIntoView({ block: "center" });
  await sleep(100);
  
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  
  return { success: true };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
