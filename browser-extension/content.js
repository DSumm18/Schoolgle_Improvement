/**
 * Content Script - Runs in the context of web pages
 * Ed's "hands" — can see and interact with the page DOM
 */

console.log("[Ed Content] Script loaded");

// Message handler from background/script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Ed Content] Received:", message);

  const { action, selector, value, waitForSelector } = message;

  switch (action) {
    case "read_dom":
      sendResponse(readPage());
      break;

    case "click":
      clickElement(selector, waitForSelector)
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Async response

    case "type":
      typeInField(selector, value, waitForSelector)
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Async response

    case "select":
      selectDropdown(selector, value, waitForSelector)
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Async response

    case "check":
      toggleCheckbox(selector, true, waitForSelector)
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Async response

    case "uncheck":
      toggleCheckbox(selector, false, waitForSelector)
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Async response

    case "screenshot":
      takeScreenshot()
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Async response

    default:
      sendResponse({ success: false, error: `Unknown action: ${action}` });
  }
});

/**
 * Read the current page DOM structure
 */
function readPage() {
  return {
    success: true,
    data: {
      url: window.location.href,
      title: document.title,
      // Get all form inputs with their selectors
      inputs: Array.from(document.querySelectorAll("input, textarea, select")).map(
        (el) => {
          const id = el.id;
          const name = el.name;
          const type = el.type || el.tagName.toLowerCase();
          const placeholder = el.placeholder || "";
          const label = getLabelForElement(el);
          const value = el.type === "password" ? "***" : el.value;

          // Build a prioritized selector
          const selector = buildSelector(el);

          return {
            selector,
            id,
            name,
            type,
            placeholder,
            label,
            value,
            // For selects, get options
            options: el.tagName === "SELECT"
              ? Array.from(el.options).map((opt) => ({
                  value: opt.value,
                  text: opt.text,
                }))
              : undefined,
          };
        }
      ),
      // Get all buttons and clickable links
      clickables: Array.from(
        document.querySelectorAll("button, a[href], [role='button'], input[type='submit'], input[type='button']")
      ).map((el) => ({
        selector: buildSelector(el),
        text: el.textContent?.trim().slice(0, 100) || el.value || "",
        type: el.tagName.toLowerCase(),
      })),
    },
  };
}

/**
 * Find the label associated with a form element
 */
function getLabelForElement(element) {
  // Check for explicit label association
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent?.trim();
  }

  // Check for parent label
  const parentLabel = element.closest("label");
  if (parentLabel) {
    // Exclude the element's own text
    const clone = parentLabel.cloneNode(true);
    const elementInClone = clone.querySelector(
      element.id ? `#${element.id}` : element.name ? `[name="${element.name}"]` : element.tagName
    );
    if (elementInClone) elementInClone.remove();
    return clone.textContent?.trim();
  }

  // Check for aria-label
  if (element.getAttribute("aria-label")) {
    return element.getAttribute("aria-label");
  }

  return "";
}

/**
 * Build a reliable CSS selector for an element
 */
function buildSelector(element) {
  // Prefer ID
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Prefer name attribute for form inputs
  if (element.name) {
    return `[name="${CSS.escape(element.name)}"]`;
  }

  // Use data attributes if present
  for (const attr of ["data-testid", "data-test", "data-cy"]) {
    const value = element.getAttribute(attr);
    if (value) {
      return `[${attr}="${CSS.escape(value)}"]`;
    }
  }

  // Build path from nearest stable ancestor
  const path = [];
  let current = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    // Add class if unique enough
    if (current.className && typeof current.className === "string") {
      const classes = current.className.split(" ").filter((c) => c.length > 0);
      if (classes.length > 0 && classes.length < 4) {
        selector += "." + classes.map((c) => CSS.escape(c)).join(".");
      }
    }

    // Add nth-child if needed
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        (e) => e.tagName === current.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;

    // Stop if we have a stable ancestor (ID or name)
    if (current && (current.id || current.name)) {
      path.unshift(current.id ? `#${CSS.escape(current.id)}` : `[name="${CSS.escape(current.name)}"]`);
      break;
    }
  }

  return path.join(" > ");
}

/**
 * Click an element by selector
 */
async function clickElement(selector, waitForSelector = false) {
  try {
    let element = document.querySelector(selector);

    if (!element && waitForSelector) {
      // Wait up to 5 seconds
      element = await waitForElement(selector, 5000);
    }

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`,
      };
    }

    // Scroll into view
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Small delay after scroll
    await sleep(100);

    // Click using both methods for compatibility
    element.click();
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    return {
      success: true,
      data: { clicked: selector },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Type text into an input field
 */
async function typeInField(selector, value, waitForSelector = false) {
  try {
    let element = document.querySelector(selector);

    if (!element && waitForSelector) {
      element = await waitForElement(selector, 5000);
    }

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`,
      };
    }

    // Focus the element
    element.focus();
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(100);

    // Clear existing value
    element.value = "";

    // Dispatch input events for realism
    for (const char of value) {
      element.value += char;
      element.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
      await sleep(10); // Small delay between keystrokes
    }

    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));

    return {
      success: true,
      data: { typed: value, into: selector },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Select an option from a dropdown
 */
async function selectDropdown(selector, value, waitForSelector = false) {
  try {
    let element = document.querySelector(selector);

    if (!element && waitForSelector) {
      element = await waitForElement(selector, 5000);
    }

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`,
      };
    }

    if (element.tagName !== "SELECT") {
      return {
        success: false,
        error: `Element is not a select: ${selector}`,
      };
    }

    element.focus();
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));

    return {
      success: true,
      data: { selected: value, from: selector },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Toggle a checkbox
 */
async function toggleCheckbox(selector, checked, waitForSelector = false) {
  try {
    let element = document.querySelector(selector);

    if (!element && waitForSelector) {
      element = await waitForElement(selector, 5000);
    }

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`,
      };
    }

    if (element.type !== "checkbox" && element.type !== "radio") {
      return {
        success: false,
        error: `Element is not a checkbox/radio: ${selector}`,
      };
    }

    if (element.checked !== checked) {
      element.click();
      element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    }

    return {
      success: true,
      data: { checked: element.checked, selector },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Take a screenshot of the current viewport
 */
async function takeScreenshot() {
  try {
    // Notify background to capture visible tab
    const response = await chrome.runtime.sendMessage({
      action: "capture_visible_tab",
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
