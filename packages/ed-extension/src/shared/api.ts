// API client for Schoolgle Ed backend

import type { PageContext, EdResponse, SubscriptionStatus } from './types';

const API_BASE_URL = 'https://schoolgle.co.uk/api';
const DEV_API_BASE_URL = 'http://localhost:3000/api';

async function getApiUrl(): Promise<string> {
  // Check for dev mode flag in chrome storage
  try {
    const result = await chrome.storage.local.get(['ed_dev_mode', 'ed_api_url']);

    // If custom API URL is set, use it
    if (result.ed_api_url) {
      return result.ed_api_url;
    }

    // If dev mode is explicitly set, use localhost
    if (result.ed_dev_mode === true) {
      return DEV_API_BASE_URL;
    }

    // If dev mode is explicitly false, use production
    if (result.ed_dev_mode === false) {
      return API_BASE_URL;
    }
  } catch (e) {
    // Ignore storage errors
  }

  // Default to production domain
  return API_BASE_URL;
}

/**
 * Check subscription status for a user
 */
export async function checkSubscription(userId: string): Promise<SubscriptionStatus> {
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}/subscription/check?userId=${encodeURIComponent(userId)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Subscription check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // Suppress expected errors (404, network failures)
    const isExpectedError =
      error instanceof TypeError && error.message.includes('Failed to fetch') ||
      (error instanceof Error && (error.message.includes('404') || error.message.includes('Network')));

    if (!isExpectedError) {
      console.warn('[Ed API] Subscription check error:', error);
    }

    return {
      hasAccess: false,
      status: 'none',
      plan: null,
      daysRemaining: null,
      trialEnds: null,
      periodEnds: null,
      school: null,
    };
  }
}

/**
 * Ask Ed a question with page context
 */
export async function askEd(
  question: string,
  context: PageContext,
  pageState?: { screenshot: string; domSnapshot: string }
): Promise<EdResponse> {
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}/ed/chat`;

  try {
    // Get Gemini API key from config for automation
    const config = await chrome.storage.local.get('ed_config');
    const geminiApiKey = config.ed_config?.geminiApiKey;

    const body: any = {
      question,
      context: {
        url: context.url,
        hostname: context.hostname,
        title: context.title,
        tool: context.detectedTool,
        visibleText: context.visibleText.slice(0, 3000), // Limit for API
        headings: context.headings.slice(0, 20),
        selectedText: context.selectedText,
      },
    };

    // Add Gemini API key if available (for automation features)
    if (geminiApiKey) {
      body.geminiApiKey = geminiApiKey;
    }

    // Add pageState if provided (for automation)
    if (pageState) {
      body.pageState = pageState;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Suppress expected errors (404, network failures) - these are normal when API isn't available
    const isExpectedError =
      error instanceof TypeError && error.message.includes('Failed to fetch') ||
      (error instanceof Error && (error.message.includes('404') || error.message.includes('Network')));

    if (!isExpectedError) {
      // Only log unexpected errors
      console.warn('[Ed API] Unexpected error:', error);
    }
    // Expected errors (404, network failures) are silently handled

    // Return fallback response
    return {
      id: crypto.randomUUID(),
      answer: "I'm having trouble connecting right now. Try asking again in a moment, or check your internet connection.",
      confidence: 0,
      source: 'fallback',
    };
  }
}

/**
 * Get cached responses for common questions
 */
export async function getCachedResponses(toolId: string): Promise<Map<string, EdResponse>> {
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}/ed/cache/${toolId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return new Map();

    const data = await response.json();
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

/**
 * Report analytics (privacy-friendly, no PII)
 */
export async function reportAnalytics(event: {
  type: string;
  toolId?: string;
  duration?: number;
}): Promise<void> {
  const apiUrl = await getApiUrl();
  // Skip analytics in development (localhost)
  if (apiUrl.includes('localhost')) return;

  const url = `${apiUrl}/ed/analytics`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: Date.now(),
        version: chrome.runtime.getManifest().version,
      }),
    });
  } catch {
    // Silently fail - analytics are non-critical
  }
}

