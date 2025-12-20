// Ed Extension Content Script
// Injected into every page to provide Ed's functionality

import type { PageContext, ExtensionMessage, EdState, ToolMatch } from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/types';
import { extractPageContext } from './page-reader';
import { detectTool } from './tool-detector';
import { EdWidget } from './ed-widget';
import { initializeRealEd, hasWebGL } from './ed-real-widget';

// Singleton Ed widget instance
let edWidget: EdWidget | null = null;
let pageScriptReady = false;
let widgetInitialized = false;

/**
 * Initialize Ed on the page
 */
async function initialize() {
  // Prevent double initialization
  if ((window as any).__ED_ALREADY_INIT__) {
    console.debug('[Ed Content] Skipping – already initialized');
    return;
  }
  
  // Check if we should run on this page
  if (shouldSkipPage()) {
    console.log('[Ed Content] Skipping page:', window.location.href);
    return;
  }
  
  // Only initialize in top frame (not in iframes)
  if (window.top !== window.self) {
    console.debug('[Ed Content] Skipping – not top frame');
    return;
  }
  
  // Mark as initializing
  (window as any).__ED_ALREADY_INIT__ = true;
  
  console.log('[Ed Content] Initializing on:', window.location.href);
  
  // Try to initialize the real Ed widget first (via page context injection)
  try {
    console.log('[Ed Content] Attempting to load real Ed widget via page context...');
    const realEdLoaded = await initializeRealEd();
    
    if (realEdLoaded) {
      console.log('[Ed Content] ✅ Real Ed widget loaded successfully - CSS widget will NOT load');
      return; // Real widget is active, don't load CSS fallback
    }
    
    console.warn('[Ed Content] ⚠️ Real Ed widget failed to load, reason logged above');
  } catch (error) {
    console.error('[Ed Content] ❌ Error during real Ed widget initialization:', error);
    console.error('[Ed Content] Stack:', error instanceof Error ? error.stack : 'No stack');
  }
  
  // Fallback to CSS widget if real widget failed
  console.log('[Ed Content] Falling back to CSS widget');
  
  // Load user preferences
  const state = await getEdState();
  
  // Create Ed widget (CSS fallback)
  edWidget = new EdWidget({
    isVisible: state.isVisible,
    isMinimized: state.isMinimized,
    onAskQuestion: handleAskQuestion,
    onClose: handleClose,
  });
  
  // Detect the current tool
  const tool = detectTool(window.location, document);
  if (tool) {
    console.log('[Ed Content] Detected tool:', tool.name);
    edWidget.setTool(tool);
  }
  
  // Mount Ed to the page
  edWidget.mount();
}

/**
 * Check if we should skip this page
 */
function shouldSkipPage(): boolean {
  const url = window.location.href;
  
  // Skip extension pages
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return true;
  }
  
  // Skip about: pages
  if (url.startsWith('about:')) {
    return true;
  }
  
  // Skip file:// pages
  if (url.startsWith('file://')) {
    return true;
  }
  
  // Skip common login/auth pages where Ed shouldn't interfere
  const skipDomains = [
    'accounts.google.com',
    'login.microsoftonline.com',
    'auth0.com',
  ];
  
  if (skipDomains.some(domain => url.includes(domain))) {
    return true;
  }
  
  return false;
}

/**
 * Get Ed state from storage
 */
async function getEdState(): Promise<EdState> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ED_STATE);
    return result[STORAGE_KEYS.ED_STATE] || {
      isVisible: true,
      isMinimized: false,
      currentTool: null,
      automationActive: false,
      automationPaused: false,
    };
  } catch {
    return {
      isVisible: true,
      isMinimized: false,
      currentTool: null,
      automationActive: false,
      automationPaused: false,
    };
  }
}

/**
 * Capture screenshot and DOM snapshot for automation
 */
async function capturePageState(): Promise<{ screenshot: string; domSnapshot: string } | null> {
  try {
    // Capture DOM snapshot
    const domSnapshot = document.documentElement.outerHTML;

    // Capture screenshot using multiple methods
    let screenshot: string | null = null;
    
    try {
      // Method 1: Try chrome.tabs.captureVisibleTab (extension context)
      if (typeof chrome !== 'undefined' && chrome?.tabs?.captureVisibleTab) {
        try {
          screenshot = await new Promise<string>((resolve, reject) => {
            chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(dataUrl);
              }
            });
          });
          console.log('[Ed Content] Screenshot captured via chrome.tabs API');
        } catch (error) {
          console.warn('[Ed Content] chrome.tabs.captureVisibleTab failed:', error);
        }
      }
      
      // Method 2: Try html2canvas if available and Method 1 failed
      if (!screenshot && (window as any).html2canvas) {
        const canvas = await (window as any).html2canvas(document.body, {
          useCORS: true,
          logging: false,
          scale: 0.5, // Reduce size for performance
        });
        screenshot = canvas.toDataURL('image/png');
        console.log('[Ed Content] Screenshot captured via html2canvas');
      }
      
      // Method 3: Request screenshot from background script
      if (!screenshot && typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
        try {
          const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' });
          if (response?.screenshot) {
            screenshot = response.screenshot;
            console.log('[Ed Content] Screenshot captured via background script');
          }
        } catch (error) {
          console.warn('[Ed Content] Background screenshot capture failed:', error);
        }
      }
      
      if (!screenshot) {
        console.warn('[Ed Content] No screenshot capture method available');
      }
    } catch (error) {
      console.error('[Ed Content] Screenshot capture error:', error);
    }

    return {
      screenshot: screenshot || '',
      domSnapshot,
    };
  } catch (error) {
    console.error('[Ed Content] Error capturing page state:', error);
    return null;
  }
}

/**
 * Handle when user asks Ed a question
 */
async function handleAskQuestion(question: string): Promise<string> {
  const context = extractPageContext(window.location, document);
  
  // Check if this might be an automation request
  const needsAutomation = detectAutomationRequest(question);
  let pageState = null;
  
  if (needsAutomation) {
    console.log('[Ed Content] Detected automation request, capturing page state...');
    pageState = await capturePageState();
  }
  
  try {
    const message: any = {
      type: 'ASK_ED',
      question,
      context,
    };
    
    // Add page state if captured
    if (pageState) {
      message.pageState = pageState;
    }
    
    const response = await chrome.runtime.sendMessage(message);
    
    return response.answer || "Sorry, I couldn't understand that. Could you try rephrasing?";
  } catch (error) {
    console.error('[Ed Content] Error asking question:', error);
    return "I'm having trouble connecting. Please try again in a moment.";
  }
}

/**
 * Detect if a question needs automation
 */
function detectAutomationRequest(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  const automationKeywords = [
    'fill',
    'click',
    'type',
    'select',
    'navigate',
    'go to',
    'open',
    'submit',
    'enter',
    'do this',
    'perform',
    'execute',
    'automate',
    'complete this',
    'fill in',
    'fill out',
  ];
  
  return automationKeywords.some(keyword => lowerQuestion.includes(keyword));
}

/**
 * Handle Ed close
 */
function handleClose() {
  chrome.runtime.sendMessage({ type: 'TOGGLE_ED', visible: false });
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PAGE_CONTEXT': {
      const context = extractPageContext(window.location, document);
      sendResponse(context);
      break;
    }
    
    case 'TOGGLE_ED': {
      if (edWidget) {
        if (message.visible !== undefined) {
          edWidget.setVisible(message.visible);
        } else {
          edWidget.toggle();
        }
      }
      sendResponse({ success: true });
      break;
    }
    
    case 'START_WATCH_MODE': {
      // TODO: Implement watch mode highlighting
      console.log('[Ed Content] Watch mode requested:', message.steps);
      sendResponse({ success: true });
      break;
    }
    
    case 'START_ACT_MODE': {
      // TODO: Implement act mode automation
      console.log('[Ed Content] Act mode requested:', message.actions);
      sendResponse({ success: true });
      break;
    }
    
    case 'STOP_AUTOMATION': {
      // TODO: Stop any running automation
      console.log('[Ed Content] Stopping automation');
      sendResponse({ success: true });
      break;
    }
  }
  
  return true;
});

/**
 * Watch for URL changes (SPA navigation)
 */
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    console.log('[Ed Content] URL changed:', lastUrl);
    
    // Re-detect tool on navigation
    const tool = detectTool(window.location, document);
    if (edWidget) {
      edWidget.setTool(tool);
    }
  }
});

// Start observing for URL changes
urlObserver.observe(document.body, { childList: true, subtree: true });

// Listen for messages from page context script
window.addEventListener('message', (event) => {
  // Security: Only accept messages from our page script
  if (event.data?.source !== 'ed-page-script' || event.data?.extensionId !== chrome.runtime.id) {
    return;
  }
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'PAGE_SCRIPT_READY': {
      console.log('[Ed Content] Page script is ready');
      pageScriptReady = true;
      // Don't auto-initialize here - let the main initialize() function handle it
      // This prevents duplicate initialization
      break;
    }
    case 'WIDGET_READY': {
      console.log('[Ed Content] Widget initialized in page context');
      widgetInitialized = true;
      // Update tool context if needed
      const tool = detectTool(window.location, document);
      if (tool) {
        sendToPageScript({
          type: 'SET_TOOL_CONTEXT',
          payload: {
            name: tool.name,
            category: tool.category,
            url: window.location.href,
            expertise: getToolExpertise(tool.id),
          }
        });
      }
      break;
    }
    case 'WIDGET_ERROR': {
      console.error('[Ed Content] Widget error from page context:', payload.error);
      widgetInitialized = false;
      // Fall back to CSS widget
      initialize();
      break;
    }
  }
});

// Helper to send messages to page context
function sendToPageScript(message: any) {
  window.postMessage({
    source: 'ed-content-script',
    extensionId: chrome.runtime.id,
    ...message
  }, '*');
}

// Import tool expertise
import { getToolExpertise } from '@/shared/tool-expertise';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('[Ed Content] Content script loaded');

