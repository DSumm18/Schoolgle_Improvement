// Load and initialize the real Ed widget (3D orb, voice, etc.)
// This replaces the CSS-only widget with the full @schoolgle/ed-widget

import type { PageContext, ToolMatch } from '@/shared/types';
import { detectTool } from './tool-detector';
import { extractPageContext } from './page-reader';
import { getToolExpertise } from '@/shared/tool-expertise';

// Check if WebGL is available
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

// Check auth and subscription before loading Ed
async function checkAccess(): Promise<{ hasAccess: boolean; userId?: string; error?: string; isDev?: boolean }> {
  try {
    // Get auth token from storage
    const result = await chrome.storage.local.get('ed_auth_token');
    const token = result.ed_auth_token;
    
    // For development: allow loading without auth (with limited features)
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  chrome.runtime.getManifest().version.includes('dev');
    
    if (!token) {
      // Always allow in dev mode (any site that's not the production Schoolgle site)
      const isDevSite = window.location.hostname !== 'schoolgle.co.uk' && 
                        window.location.hostname !== 'www.schoolgle.co.uk';
      if (isDev || isDevSite) {
        console.log('[Ed Real Widget] ⚠️ Development mode: Loading without auth');
        return { hasAccess: true, userId: 'dev-user', isDev: true };
      }
      return { hasAccess: false, error: 'Not authenticated' };
    }
    
    // Determine API URL (dev vs prod)
    const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api'
      : 'https://schoolgle.co.uk/api';
    
    // Verify token and check subscription
    const response = await fetch(`${apiBase}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (isDev) {
        console.log('[Ed Real Widget] ⚠️ Development mode: Auth check failed, but allowing');
        return { hasAccess: true, userId: 'dev-user', isDev: true };
      }
      return { hasAccess: false, error: 'Invalid token' };
    }
    
    const userData = await response.json();
    
    // Check subscription
    const subResponse = await fetch(
      `${apiBase}/subscription/check?userId=${userData.userId}&product=ed_pro`
    );
    
    if (!subResponse.ok) {
      if (isDev) {
        console.log('[Ed Real Widget] ⚠️ Development mode: Subscription check failed, but allowing');
        return { hasAccess: true, userId: userData.userId || 'dev-user', isDev: true };
      }
      return { hasAccess: false, error: 'Subscription check failed' };
    }
    
    const subData = await subResponse.json();
    
    if (!subData.hasAccess) {
      if (isDev) {
        console.log('[Ed Real Widget] ⚠️ Development mode: No subscription, but allowing');
        return { hasAccess: true, userId: userData.userId || 'dev-user', isDev: true };
      }
      return { hasAccess: false, error: 'No active subscription' };
    }
    
    return { hasAccess: true, userId: userData.userId };
  } catch (error) {
    console.error('[Ed Real Widget] Access check failed:', error);
    // In development, allow even if check fails
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1';
    if (isDev) {
      console.log('[Ed Real Widget] ⚠️ Development mode: Error in access check, but allowing');
      return { hasAccess: true, userId: 'dev-user', isDev: true };
    }
    return { hasAccess: false, error: 'Access check failed' };
  }
}

// Declare global EdWidget type
declare global {
  interface Window {
    EdWidget?: {
      init: (config: any) => any;
      getInstance: () => any;
      destroy: () => void;
    };
    __ED_INSTANCE__?: any;
  }
}

// Inject page context script that will load the widget in the page's context
async function injectPageScript(): Promise<boolean> {
  try {
    // Check if already injected
    if ((window as any).__ED_PAGE_SCRIPT_LOADED__) {
      console.log('[Ed Real Widget] Page script already injected');
      return true;
    }
    
    // Get the page script URL (must be a web_accessible_resource)
    const pageScriptUrl = chrome.runtime.getURL('content/inject-page.js');
    console.log('[Ed Real Widget] Injecting page script from:', pageScriptUrl);
    
    // Inject the page script using src (not textContent) to avoid CSP issues
    // The extension ID will be passed via data attribute and extracted from the script tag
    const script = document.createElement('script');
    script.id = 'ed-page-script';
    script.src = pageScriptUrl;
    script.setAttribute('data-extension-id', chrome.runtime.id);
    script.type = 'text/javascript';
    
    // Wait for script to load
    await new Promise<void>((resolve, reject) => {
      script.onload = () => {
        console.log('[Ed Real Widget] ✅ Page script loaded via src');
        resolve();
      };
      script.onerror = (error) => {
        console.error('[Ed Real Widget] ❌ Page script load error:', error);
        reject(new Error(`Failed to load page script from ${pageScriptUrl}`));
      };
      (document.head || document.documentElement).appendChild(script);
    });
    
    // Wait for page script to be ready (it will send a message)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[Ed Real Widget] Timeout waiting for page script ready');
        resolve(false);
      }, 5000);
      
      const listener = (event: MessageEvent) => {
        if (event.data?.source === 'ed-page-script' && 
            event.data?.type === 'PAGE_SCRIPT_READY' &&
            event.data?.extensionId === chrome.runtime.id) {
          clearTimeout(timeout);
          window.removeEventListener('message', listener);
          console.log('[Ed Real Widget] ✅ Page script confirmed ready');
          resolve(true);
        }
      };
      
      window.addEventListener('message', listener);
    });
  } catch (error) {
    console.error('[Ed Real Widget] ❌ Failed to inject page script:', error);
    return false;
  }
}

// Send initialization command to page script
async function sendInitToPageScript(config: any): Promise<boolean> {
  return new Promise((resolve) => {
    // Wait longer for widget to load (bundle might be large)
    const timeout = setTimeout(() => {
      console.error('[Ed Real Widget] ⏱️ Timeout (15s) waiting for widget initialization');
      console.error('[Ed Real Widget] This might indicate:');
      console.error('[Ed Real Widget] 1. Bundle failed to load (check network tab)');
      console.error('[Ed Real Widget] 2. CSP blocking script execution');
      console.error('[Ed Real Widget] 3. Widget initialization error (check console)');
      window.removeEventListener('message', listener);
      resolve(false);
    }, 15000); // Increased to 15 seconds
    
    const listener = (event: MessageEvent) => {
      // Log all messages for debugging
      if (event.data?.source === 'ed-page-script' && 
          event.data?.extensionId === chrome.runtime.id) {
        console.log('[Ed Real Widget] Received message from page script:', event.data.type);
        
        if (event.data?.type === 'WIDGET_READY') {
          clearTimeout(timeout);
          window.removeEventListener('message', listener);
          console.log('[Ed Real Widget] ✅ Widget initialized in page context');
          resolve(true);
        } else if (event.data?.type === 'WIDGET_ERROR') {
          clearTimeout(timeout);
          window.removeEventListener('message', listener);
          console.error('[Ed Real Widget] ❌ Widget error:', event.data.payload?.error);
          resolve(false);
        } else if (event.data?.type === 'PAGE_SCRIPT_READY') {
          console.log('[Ed Real Widget] ✅ Page script is ready, sending init command...');
          // Page script is ready, send init command
          window.postMessage({
            source: 'ed-content-script',
            extensionId: chrome.runtime.id,
            type: 'INIT_WIDGET',
            payload: config
          }, '*');
        }
      }
    };
    
    window.addEventListener('message', listener);
    
    // Check if page script is already ready (might have loaded before we set up listener)
    // If not, wait for PAGE_SCRIPT_READY message before sending INIT_WIDGET
    // For now, send immediately - page script will queue it
    console.log('[Ed Real Widget] Sending INIT_WIDGET command...');
    window.postMessage({
      source: 'ed-content-script',
      extensionId: chrome.runtime.id,
      type: 'INIT_WIDGET',
      payload: config
    }, '*');
  });
}

// Initialize the real Ed widget
async function initializeRealEd() {
  // Prevent duplicate initialization
  if ((window as any).__ED_REAL_WIDGET_INITIALIZING__) {
    console.debug('[Ed Real Widget] Already initializing, skipping duplicate');
    return false;
  }
  if ((window as any).__ED_REAL_WIDGET_INITIALIZED__) {
    console.debug('[Ed Real Widget] Already initialized, skipping');
    return true;
  }
  
  (window as any).__ED_REAL_WIDGET_INITIALIZING__ = true;
  
  try {
    console.log('[Ed Real Widget] ========================================');
    console.log('[Ed Real Widget] Starting initialization...');
    console.log('[Ed Real Widget] URL:', window.location.href);
    console.log('[Ed Real Widget] Hostname:', window.location.hostname);
    
    // Check WebGL support
    const webglAvailable = hasWebGL();
    console.log('[Ed Real Widget] WebGL check:', webglAvailable);
    if (!webglAvailable) {
      console.warn('[Ed Real Widget] ❌ WebGL not available, falling back to CSS widget');
      return false; // Will fall back to CSS widget
    }
    console.log('[Ed Real Widget] ✅ WebGL available');
    
    // Check access (but always allow in dev mode for testing)
    console.log('[Ed Real Widget] Checking access...');
    const access = await checkAccess();
  
  // In development/testing, always allow the widget to load
  // The access check is informational only
  // For now, allow on all pages for testing (can be restricted later)
  const isDevMode = access.isDev || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('schoolgle.co.uk') || // Allow on schoolgle domains
                     true; // TEMP: Allow everywhere for testing
  
  if (!access.hasAccess && !isDevMode) {
    console.log('[Ed Real Widget] ❌ No access:', access.error);
    showAccessPrompt(access.error);
    return false;
  }
  
  if (isDevMode) {
    console.log('[Ed Real Widget] ✅ Development/testing mode: Loading widget without auth');
  } else {
    console.log('[Ed Real Widget] ✅ Access granted');
  }
  
  // Inject page context script
  console.log('[Ed Real Widget] Injecting page context script...');
  const pageScriptInjected = await injectPageScript();
  if (!pageScriptInjected) {
    console.error('[Ed Real Widget] ❌ Failed to inject page script');
    return false;
  }
  console.log('[Ed Real Widget] ✅ Page script injected');
  
  // Load configuration from chrome.storage (not .env.local)
  const { buildWidgetConfig } = await import('@/shared/config');
  const edConfig = await buildWidgetConfig();
  
  // Get user preferences (safe check for chrome.storage)
  let prefs: any = {};
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    try {
      prefs = await chrome.storage.local.get('ed_user_prefs');
    } catch (error) {
      console.warn('[Ed Real Widget] Failed to load user prefs:', error);
    }
  }
  
  // Build widget initialization config
  // Only include keys for the selected provider
  const widgetConfig: any = {
    schoolId: access.userId || 'extension',
    theme: 'standard' as const,
    position: 'bottom-right' as const,
    language: prefs.language || edConfig.language || 'en-GB',
    persona: prefs.persona || edConfig.persona || 'ed',
    features: {
      admissions: false,
      policies: false,
      calendar: false,
      staffDirectory: false,
      formFill: true,
      voice: edConfig.enableTTS && (edConfig.ttsProvider === 'browser' || !!edConfig.fishAudioApiKey),
    },
    // Provider selection
    provider: edConfig.provider,
    enableAI: edConfig.enableAI,
    enableTTS: edConfig.enableTTS,
    ttsProvider: edConfig.ttsProvider || 'browser',
  };
  
  // Only include API keys for the selected provider
  if (edConfig.provider === 'openrouter') {
    widgetConfig.openRouterApiKey = edConfig.openRouterApiKey;
    // Don't set Gemini key if using OpenRouter
  } else if (edConfig.provider === 'gemini') {
    widgetConfig.geminiApiKey = edConfig.geminiApiKey;
    // Don't set OpenRouter key if using Gemini
  }
  
  // Only include Fish Audio key if TTS is enabled and provider is fish
  if (edConfig.enableTTS && edConfig.ttsProvider === 'fish') {
    widgetConfig.fishAudioApiKey = edConfig.fishAudioApiKey;
    // Include voice IDs if provided
    if (edConfig.fishAudioVoiceIds) {
      widgetConfig.fishAudioVoiceIds = edConfig.fishAudioVoiceIds;
    }
  }
  
  console.log('[Ed Real Widget] Sending init command to page script with config:', {
    provider: widgetConfig.provider,
    enableAI: widgetConfig.enableAI,
    enableTTS: widgetConfig.enableTTS,
    ttsProvider: widgetConfig.ttsProvider,
    hasKeys: {
      openrouter: !!widgetConfig.openRouterApiKey,
      gemini: !!widgetConfig.geminiApiKey,
      fish: !!widgetConfig.fishAudioApiKey,
    },
  });
  
  // Send initialization command to page script
  const widgetInitialized = await sendInitToPageScript(widgetConfig);
  if (!widgetInitialized) {
    console.error('[Ed Real Widget] ❌ Failed to initialize widget in page context');
    return false;
  }
  
  // Set tool context if detected
  const tool = detectTool(window.location, document);
  if (tool) {
    const expertise = getToolExpertise(tool.id);
    // Send tool context to page script
    window.postMessage({
      source: 'ed-content-script',
      extensionId: chrome.runtime.id,
      type: 'SET_TOOL_CONTEXT',
      payload: {
        name: tool.name,
        category: tool.category,
        url: window.location.href,
        expertise,
      }
    }, '*');
  }
  
  // Watch for tool changes
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const newTool = detectTool(window.location, document);
      if (newTool) {
        const expertise = getToolExpertise(newTool.id);
        window.postMessage({
          source: 'ed-content-script',
          extensionId: chrome.runtime.id,
          type: 'SET_TOOL_CONTEXT',
          payload: {
            name: newTool.name,
            category: newTool.category,
            url: window.location.href,
            expertise,
          }
        }, '*');
      }
    }
  });
  
  urlObserver.observe(document.body, { childList: true, subtree: true });
  
  console.log('[Ed Real Widget] ✅✅✅ Initialized successfully ✅✅✅');
  console.log('[Ed Real Widget] ========================================');
  (window as any).__ED_REAL_WIDGET_INITIALIZED__ = true;
  (window as any).__ED_REAL_WIDGET_INITIALIZING__ = false;
  return true;
  } catch (error) {
    console.error('[Ed Real Widget] ❌❌❌ CRITICAL ERROR during initialization ❌❌❌');
    console.error('[Ed Real Widget] Error:', error);
    console.error('[Ed Real Widget] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[Ed Real Widget] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[Ed Real Widget] Stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[Ed Real Widget] ========================================');
    (window as any).__ED_REAL_WIDGET_INITIALIZING__ = false;
    return false;
  }
}

// Show access prompt if user doesn't have access (non-blocking)
function showAccessPrompt(error?: string) {
  // Don't show prompt in dev mode - widget will load anyway
  const isDev = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                !window.location.hostname.includes('schoolgle.co.uk');
  if (isDev) {
    console.log('[Ed Real Widget] Skipping access prompt in dev mode');
    return;
  }
  
  // Remove any existing prompt first
  const existingPrompt = document.getElementById('ed-access-prompt');
  if (existingPrompt) {
    existingPrompt.remove();
  }
  
  // Create a small notification (non-blocking, doesn't prevent widget from loading)
  const prompt = document.createElement('div');
  prompt.id = 'ed-access-prompt';
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
      ${error === 'Not authenticated' 
        ? 'Please log in to Schoolgle to use Ed.'
        : error === 'No active subscription'
        ? 'You need an active subscription to use Ed.'
        : 'Unable to verify access. Please check your connection.'}
    </div>
    <a href="https://schoolgle.co.uk/dashboard/account/trial" 
       target="_blank"
       style="display: inline-block; background: #059669; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 13px;">
      Get Started
    </a>
    <button id="ed-prompt-close" style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
  `;
  
  document.body.appendChild(prompt);
  
  // Close button
  const closeBtn = prompt.querySelector('#ed-prompt-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => prompt.remove());
  }
  
  // Auto-remove after 10 seconds
  setTimeout(() => prompt.remove(), 10000);
}

// Export for use in inject.ts
export { initializeRealEd, hasWebGL };

