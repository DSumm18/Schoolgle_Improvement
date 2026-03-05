"use client";

/**
 * useEdBrowserIntegration Hook
 *
 * Integrates Ed chatbot with browser automation capabilities.
 * Listens for browser automation requests from Ed and handles the
 * domain approval flow and browser control state.
 *
 * Usage:
 * 1. Add BrowserControlProvider to your app layout
 * 2. Use this hook in components that need to trigger browser automation
 * 3. Listen for 'ed-browser-request' events from the Ed widget
 */

import { useEffect, useCallback, useState } from 'react';
import { useBrowserControl } from '@/lib/browser-control-context';
import { toast } from 'sonner';
import type { BrowserControlState } from '@/components/browser/BrowserControlIndicator';

// ============================================================================
// TYPES
// ============================================================================

export interface EdBrowserRequest {
  url: string;
  reason?: string;
  action?: 'navigate' | 'fill_form' | 'screenshot' | 'extract';
  context?: {
    checkId?: string;
    domain?: string;
    taskName?: string;
  };
}

export interface EdBrowserResponse {
  success: boolean;
  sessionId?: string;
  screenshot?: string;
  data?: any;
  error?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useEdBrowserIntegration() {
  const {
    isSessionActive,
    currentSession,
    browserState,
    startSession,
    stopSession,
    updateBrowserState,
    addPermanentApproval,
  } = useBrowserControl();

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<EdBrowserResponse | null>(null);

  // Handle browser automation request from Ed
  const handleBrowserRequest = useCallback(
    async (request: EdBrowserRequest): Promise<EdBrowserResponse> => {
      setIsProcessing(true);
      setLastResponse(null);

      try {
        // Check if we already have an active session for this URL
        const sessionUrl = currentSession?.url;
        const needsNewSession =
          !currentSession ||
          !request.url.startsWith(extractDomain(sessionUrl)) ||
          currentSession.status === 'completed' ||
          currentSession.status === 'error';

        let sessionId = currentSession?.sessionId;

        if (needsNewSession) {
          // Close existing session if needed
          if (currentSession) {
            await stopSession();
          }

          // Start new session (will trigger domain approval if needed)
          updateBrowserState({
            status: 'starting',
            currentAction: 'Initializing browser session...',
          });

          sessionId = await startSession(
            request.url,
            request.reason || 'Ed needs to access this site to help with your request.'
          );

          if (!sessionId) {
            return {
              success: false,
              error: 'Session could not be started. Domain may have been declined.',
            };
          }
        }

        // Perform the requested action
        if (request.action === 'screenshot') {
          updateBrowserState({
            status: 'analyzing',
            currentAction: 'Capturing screenshot...',
          });

          const screenshotResponse = await fetch('/api/browser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'screenshot',
              sessionId,
              options: { full: true },
            }),
          });

          if (screenshotResponse.ok) {
            const { screenshotPath } = await screenshotResponse.json();
            updateBrowserState({ status: 'completed' });

            return {
              success: true,
              sessionId,
              screenshot: screenshotPath,
            };
          }
        }

        // For navigation, the session setup already handled it
        if (request.action === 'navigate' || !request.action) {
          updateBrowserState({
            status: 'analyzing',
            currentAction: 'Analyzing page content...',
          });

          // Get snapshot of page
          const snapshotResponse = await fetch('/api/browser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'snapshot',
              sessionId,
              options: { interactive: true },
            }),
          });

          if (snapshotResponse.ok) {
            const { snapshot } = await snapshotResponse.json();
            updateBrowserState({ status: 'completed' });

            return {
              success: true,
              sessionId,
              data: snapshot,
            };
          }
        }

        // Default response for successful session
        updateBrowserState({ status: 'completed' });
        return {
          success: true,
          sessionId,
        };
      } catch (error) {
        console.error('[EdBrowserIntegration] Error handling request:', error);
        updateBrowserState({
          status: 'error',
          interruptReason: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [currentSession, startSession, stopSession, updateBrowserState]
  );

  // Send response back to Ed
  const sendResponseToEd = useCallback((response: EdBrowserResponse) => {
    setLastResponse(response);

    // Dispatch event that Ed widget can listen to
    const event = new CustomEvent('ed-browser-response', { detail: response });
    window.dispatchEvent(event);

    // Also try to call Ed directly if available
    const ed = (window as any).__ED_INSTANCE__;
    if (ed && ed.onBrowserResponse) {
      ed.onBrowserResponse(response);
    }
  }, []);

  // Handle manual stop
  const handleStopSession = useCallback(async () => {
    await stopSession();
    toast.info('Browser session stopped', {
      description: 'You can start a new session anytime.',
    });
  }, [stopSession]);

  // Set up event listener for browser requests from Ed
  useEffect(() => {
    const handleBrowserRequestEvent = async (event: Event) => {
      const customEvent = event as CustomEvent<EdBrowserRequest>;
      const request = customEvent.detail;

      console.log('[EdBrowserIntegration] Received browser request from Ed:', request);

      const response = await handleBrowserRequest(request);
      sendResponseToEd(response);

      // Show toast notification
      if (response.success) {
        toast.success('Ed completed the browser action', {
          description: `Successfully accessed ${extractDomain(request.url)}`,
        });
      } else if (response.error?.includes('declined')) {
        toast.info('Browser access declined', {
          description: 'You can approve the domain when ready.',
        });
      } else {
        toast.error('Browser action failed', {
          description: response.error || 'Unknown error occurred',
        });
      }
    };

    window.addEventListener('ed-browser-request', handleBrowserRequestEvent as EventListener);

    return () => {
      window.removeEventListener('ed-browser-request', handleBrowserRequestEvent as EventListener);
    };
  }, [handleBrowserRequest, sendResponseToEd]);

  return {
    // State
    isSessionActive,
    isProcessing,
    currentSession,
    browserState,
    lastResponse,

    // Actions
    handleBrowserRequest,
    handleStopSession,
    sendResponseToEd,
    addPermanentApproval,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

// ============================================================================
// ED WIDGET INTEGRATION HELPERS
// ============================================================================

/**
 * Trigger a browser automation request from outside Ed
 * (e.g., from a button click)
 */
export function triggerEdBrowserRequest(request: EdBrowserRequest): void {
  const event = new CustomEvent('ed-browser-request', { detail: request });
  window.dispatchEvent(event);
}

/**
 * Request Ed to navigate to a URL and extract information
 */
export function requestEdNavigateAndExtract(
  url: string,
  reason?: string,
  context?: EdBrowserRequest['context']
): void {
  triggerEdBrowserRequest({
    url,
    reason,
    action: 'navigate',
    context,
  });
}

/**
 * Request Ed to capture a screenshot of a URL
 */
export function requestEdScreenshot(
  url: string,
  reason?: string,
  context?: EdBrowserRequest['context']
): void {
  triggerEdBrowserRequest({
    url,
    reason,
    action: 'screenshot',
    context,
  });
}

export default useEdBrowserIntegration;
