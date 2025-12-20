// Ed Extension Background Service Worker
// Handles message routing, caching, and API calls

import type { ExtensionMessage, EdState, UserPreferences, PageContext, AuthState, SubscriptionStatus } from '@/shared/types';
import { STORAGE_KEYS, DEFAULT_PREFERENCES } from '@/shared/types';
import { askEd, reportAnalytics, checkSubscription } from '@/shared/api';

const API_BASE = 'https://schoolgle.co.uk'; // Production URL

// In-memory response cache for this session
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize extension on install/update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Ed Background] Extension installed/updated:', details.reason);
  
  // Set default preferences on first install
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      [STORAGE_KEYS.USER_PREFERENCES]: DEFAULT_PREFERENCES,
      [STORAGE_KEYS.ED_STATE]: {
        isVisible: true,
        isMinimized: false,
        currentTool: null,
        automationActive: false,
        automationPaused: false,
      } satisfies EdState,
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: 'https://schoolgle.co.uk/ed/welcome',
    });
  }
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('[Ed Background] Message handler error:', error);
      sendResponse({ error: error.message });
    });
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    case 'ASK_ED': {
      const { question, context, pageState } = message as any;
      
      // Check cache first (skip cache for automation requests with pageState)
      if (!pageState) {
        const cacheKey = `${context.detectedTool?.id || 'general'}:${question.toLowerCase().trim()}`;
        const cached = responseCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log('[Ed Background] Cache hit for:', cacheKey);
          return {
            id: crypto.randomUUID(),
            answer: cached.response,
            confidence: 0.9,
            source: 'cache',
          };
        }
      }
      
      // Call API (with graceful error handling)
      try {
        const response = await askEd(question, context, pageState);
        
        // Cache successful responses
        if (response.source === 'ai' && response.confidence > 0.7) {
          responseCache.set(cacheKey, {
            response: response.answer,
            timestamp: Date.now(),
          });
        }
        
        // Report analytics (non-blocking)
        reportAnalytics({
          type: 'question_asked',
          toolId: context.detectedTool?.id,
        }).catch(() => {
          // Silently fail - analytics are non-critical
        });
        
        return response;
      } catch (error) {
        // API call failed - return fallback response
        // Suppress expected errors (404, network failures)
        const isExpectedError = 
          error instanceof TypeError && error.message?.includes('Failed to fetch') ||
          (error instanceof Error && (error.message?.includes('404') || error.message?.includes('Network')));
        
        if (!isExpectedError) {
          console.warn('[Ed Background] API call failed, using fallback:', error);
        }
        
        return {
          id: crypto.randomUUID(),
          answer: "I'm having trouble connecting right now. Try asking again in a moment, or check your internet connection.",
          confidence: 0,
          source: 'fallback',
        };
      }
    }
    
    case 'TOGGLE_ED': {
      const state = await getEdState();
      const newVisible = message.visible ?? !state.isVisible;
      
      await chrome.storage.local.set({
        [STORAGE_KEYS.ED_STATE]: {
          ...state,
          isVisible: newVisible,
        },
      });
      
      // Notify all tabs
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_ED',
            visible: newVisible,
          }).catch(() => {
            // Tab might not have content script
          });
        }
      }
      
      return { success: true, visible: newVisible };
    }
    
    case 'GET_PAGE_CONTEXT': {
      // Forward to content script of the specified tab
      const tabId = message.tabId || sender.tab?.id;
      if (!tabId) {
        throw new Error('No tab ID available');
      }
      
      return chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_CONTEXT' });
    }
    
    case 'STOP_AUTOMATION': {
      const state = await getEdState();
      await chrome.storage.local.set({
        [STORAGE_KEYS.ED_STATE]: {
          ...state,
          automationActive: false,
          automationPaused: false,
        },
      });
      
      // Notify content script
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'STOP_AUTOMATION' });
      }
      
      return { success: true };
    }
    
    case 'CHECK_AUTH': {
      const authState = await getAuthState();
      let subscription: SubscriptionStatus | null = null;
      
      // If authenticated, check subscription
      if (authState.isAuthenticated && authState.userId) {
        subscription = await checkAndCacheSubscription(authState.userId);
      }
      
      return { 
        type: 'AUTH_STATUS',
        status: authState, 
        subscription 
      };
    }
    
    case 'LOGIN': {
      // Called when user logs in via Schoolgle website
      // The website will pass the auth token
      const { token } = message as { type: 'LOGIN'; token: string };
      
      // Verify token with server
      const response = await fetch(`${API_BASE}/api/auth/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        const authState: AuthState = {
          userId: userData.userId,
          email: userData.email,
          organizationId: userData.organizationId,
          isAuthenticated: true,
          lastChecked: Date.now(),
        };
        
        await chrome.storage.local.set({
          [STORAGE_KEYS.AUTH_TOKEN]: token,
          [STORAGE_KEYS.SUBSCRIPTION]: null, // Clear cache
        });
        
        // Check subscription
        const subscription = await checkAndCacheSubscription(userData.userId);
        
        return { success: true, authState, subscription };
      }
      
      return { success: false, error: 'Invalid token' };
    }
    
    case 'LOGOUT': {
      await chrome.storage.local.remove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.SUBSCRIPTION,
      ]);
      
      return { success: true };
    }
    
    case 'GET_API_KEYS': {
      // Get API keys from backend (if user has access)
      // This should be called after auth/subscription check
      try {
        const authState = await getAuthState();
        if (!authState.isAuthenticated || !authState.userId) {
          return { error: 'Not authenticated' };
        }
        
        // Get auth token
        const tokenResult = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
        const token = tokenResult[STORAGE_KEYS.AUTH_TOKEN];
        
        if (!token) {
          return { error: 'No auth token' };
        }
        
        // Fetch API keys from backend
        // The backend should return keys only if user has active subscription
        const response = await fetch(`${API_BASE}/api/ed/keys`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            geminiApiKey: data.geminiApiKey,
            fishAudioApiKey: data.fishAudioApiKey,
          };
        }
        
        return { error: 'Failed to get API keys' };
      } catch (error) {
        console.error('[Ed Background] Error getting API keys:', error);
        return { error: 'API key fetch failed' };
      }
    }
    
    case 'CAPTURE_SCREENSHOT': {
      try {
        // Get active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) {
          return { error: 'No active tab' };
        }
        
        // Capture visible tab
        const dataUrl = await chrome.tabs.captureVisibleTab(undefined, {
          format: 'png',
        });
        
        return { screenshot: dataUrl };
      } catch (error) {
        console.error('[Ed Background] Error capturing screenshot:', error);
        return { error: 'Screenshot capture failed' };
      }
    }
    
    default:
      console.warn('[Ed Background] Unknown message type:', (message as { type: string }).type);
      return { error: 'Unknown message type' };
  }
}

/**
 * Get auth state from storage
 */
async function getAuthState(): Promise<AuthState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
  const token = result[STORAGE_KEYS.AUTH_TOKEN];
  
  if (!token) {
    return {
      userId: null,
      email: null,
      organizationId: null,
      isAuthenticated: false,
      lastChecked: Date.now(),
    };
  }
  
  // Verify token is still valid (check periodically)
  // In development, skip auth check if API is not available
  try {
    const response = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      const userData = await response.json();
      return {
        userId: userData.userId,
        email: userData.email,
        organizationId: userData.organizationId,
        isAuthenticated: true,
        lastChecked: Date.now(),
      };
    }
  } catch (error) {
    // Suppress expected errors (404, network failures) - these are normal when API isn't available
    const isExpectedError = 
      error instanceof TypeError && error.message?.includes('Failed to fetch') ||
      (error instanceof Error && (error.message?.includes('404') || error.message?.includes('Network')));
    
    if (!isExpectedError) {
      console.warn('[Ed Background] Auth check failed (non-critical):', error);
    }
  }
  
  // Token invalid, clear it
  await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
  return {
    userId: null,
    email: null,
    organizationId: null,
    isAuthenticated: false,
    lastChecked: Date.now(),
  };
}

/**
 * Check and cache subscription status
 */
async function checkAndCacheSubscription(userId: string): Promise<SubscriptionStatus | null> {
  // Check cache first (5 min TTL)
  const result = await chrome.storage.local.get(STORAGE_KEYS.SUBSCRIPTION);
  const cached = result[STORAGE_KEYS.SUBSCRIPTION];
  
  if (cached && cached.timestamp && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }
  
  // Fetch fresh
  try {
    const subscription = await checkSubscription(userId);
    
    // Cache it
    await chrome.storage.local.set({
      [STORAGE_KEYS.SUBSCRIPTION]: {
        data: subscription,
        timestamp: Date.now(),
      },
    });
    
    return subscription;
  } catch (error) {
    console.error('[Ed Background] Subscription check failed:', error);
    return null;
  }
}

/**
 * Get current Ed state from storage
 */
async function getEdState(): Promise<EdState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ED_STATE);
  return result[STORAGE_KEYS.ED_STATE] || {
    isVisible: true,
    isMinimized: false,
    currentTool: null,
    automationActive: false,
    automationPaused: false,
  };
}

/**
 * Get user preferences from storage
 */
async function getUserPreferences(): Promise<UserPreferences> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USER_PREFERENCES);
  return result[STORAGE_KEYS.USER_PREFERENCES] || DEFAULT_PREFERENCES;
}

/**
 * Handle keyboard shortcuts
 */
chrome.commands?.onCommand?.addListener(async (command) => {
  console.log('[Ed Background] Command received:', command);
  
  if (command === 'toggle-ed') {
    const state = await getEdState();
    await chrome.storage.local.set({
      [STORAGE_KEYS.ED_STATE]: {
        ...state,
        isVisible: !state.isVisible,
      },
    });
  }
});

/**
 * Clean up old cache entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}, CACHE_TTL);

console.log('[Ed Background] Service worker initialized');

