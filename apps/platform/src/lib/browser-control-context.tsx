"use client";

/**
 * Browser Control Context
 *
 * Manages the state for browser automation sessions including:
 * - Session lifecycle
 * - Domain approvals
 * - Control indicator display
 * - Integration with Ed chatbot
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { BrowserControlStatus, type BrowserControlState } from '@/components/browser/BrowserControlIndicator';
import type { DomainApprovalRequest, DomainApprovalResponse } from '@/components/estates-compliance/EdDomainApproval';

// ============================================================================
// TYPES
// ============================================================================

export interface BrowserSession {
  sessionId: string;
  url: string;
  status: BrowserControlStatus;
  startedAt: Date;
  expiresAt: Date;
}

export interface BrowserControlContextValue {
  // State
  isSessionActive: boolean;
  currentSession: BrowserSession | null;
  browserState: BrowserControlState;
  approvalRequest: DomainApprovalRequest | null;
  permanentlyApprovedDomains: Set<string>;

  // Actions
  startSession: (url: string, reason?: string) => Promise<string | null>;
  stopSession: () => Promise<void>;
  updateBrowserState: (state: Partial<BrowserControlState>) => void;
  requestDomainApproval: (request: DomainApprovalRequest) => Promise<DomainApprovalResponse>;
  approveDomain: (response: DomainApprovalResponse) => void;
  dismissApproval: () => void;
  addPermanentApproval: (domain: string) => void;
  removePermanentApproval: (domain: string) => void;
}

const BrowserControlContext = createContext<BrowserControlContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface BrowserControlProviderProps {
  children: ReactNode;
  organizationId?: string;
}

export function BrowserControlProvider({ children, organizationId }: BrowserControlProviderProps) {
  const [currentSession, setCurrentSession] = useState<BrowserSession | null>(null);
  const [browserState, setBrowserState] = useState<BrowserControlState>({
    status: 'idle',
  });
  const [approvalRequest, setApprovalRequest] = useState<DomainApprovalRequest | null>(null);
  const [permanentlyApprovedDomains, setPermanentlyApprovedDomains] = useState<Set<string>>(new Set());
  const [pendingApprovalResolver, setPendingApprovalResolver] = useState<
    ((response: DomainApprovalResponse) => void) | null
  >(null);

  // Load permanently approved domains from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('ed_approved_domains');
      if (stored) {
        const domains = JSON.parse(stored) as string[];
        setPermanentlyApprovedDomains(new Set(domains));
      }
    } catch (error) {
      console.error('[BrowserControl] Failed to load approved domains:', error);
    }
  }, []);

  // Save permanently approved domains to localStorage when they change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'ed_approved_domains',
        JSON.stringify(Array.from(permanentlyApprovedDomains))
      );
    } catch (error) {
      console.error('[BrowserControl] Failed to save approved domains:', error);
    }
  }, [permanentlyApprovedDomains]);

  // Update browser state
  const updateBrowserState = useCallback((newState: Partial<BrowserControlState>) => {
    setBrowserState((prev) => ({ ...prev, ...newState }));
  }, []);

  // Check if a domain is approved
  const isDomainApproved = useCallback(
    (domain: string): boolean => {
      return permanentlyApprovedDomains.has(domain);
    },
    [permanentlyApprovedDomains]
  );

  // Request domain approval
  const requestDomainApproval = useCallback(
    (request: DomainApprovalRequest): Promise<DomainApprovalResponse> => {
      return new Promise((resolve) => {
        setApprovalRequest(request);
        setPendingApprovalResolver(() => resolve);
      });
    },
    []
  );

  // Handle approval response
  const approveDomain = useCallback((response: DomainApprovalResponse) => {
    if (response.choice === 'allow_permanent') {
      setPermanentlyApprovedDomains((prev) => new Set(prev).add(response.domain));
    }

    // Resolve pending promise
    if (pendingApprovalResolver) {
      pendingApprovalResolver(response);
      setPendingApprovalResolver(null);
    }

    setApprovalRequest(null);
  }, [pendingApprovalResolver]);

  // Dismiss approval dialog
  const dismissApproval = useCallback(() => {
    if (pendingApprovalResolver && approvalRequest) {
      // Treat dismissal as decline
      pendingApprovalResolver({ choice: 'decline', domain: approvalRequest.domain });
      setPendingApprovalResolver(null);
    }

    setApprovalRequest(null);
  }, [pendingApprovalResolver, approvalRequest]);

  // Start a browser session
  const startSession = useCallback(
    async (url: string, reason?: string): Promise<string | null> => {
      try {
        // Extract domain from URL
        const domain = extractDomain(url);

        // Check if domain is approved
        if (!isDomainApproved(domain)) {
          // Request approval
          const response = await requestDomainApproval({
            domain,
            url,
            reason: reason || 'Ed needs to access this site to help with your request.',
            riskLevel: assessRisk(domain),
            category: categorizeDomain(domain),
          });

          if (response.choice === 'decline') {
            return null;
          }
        }

        // Create session via API
        const createResponse = await fetch('/api/browser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createSession',
            url,
            durationSeconds: 1800, // 30 minutes
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          console.error('[BrowserControl] Failed to create session:', error);
          return null;
        }

        const { sessionId, expiresAt } = await createResponse.json();

        // Set up session state
        const session: BrowserSession = {
          sessionId,
          url,
          status: 'starting',
          startedAt: new Date(),
          expiresAt: new Date(expiresAt),
        };

        setCurrentSession(session);
        updateBrowserState({
          status: 'starting',
          targetUrl: url,
          canInteract: false,
        });

        // Navigate to the URL
        const navigateResponse = await fetch('/api/browser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'navigate',
            sessionId,
            url,
          }),
        });

        if (navigateResponse.ok) {
          updateBrowserState({
            status: 'navigating',
            currentAction: 'Navigating to ' + domain,
          });
        }

        return sessionId;
      } catch (error) {
        console.error('[BrowserControl] Error starting session:', error);
        updateBrowserState({ status: 'error', interruptReason: 'Failed to start session' });
        return null;
      }
    },
    [isDomainApproved, requestDomainApproval, updateBrowserState]
  );

  // Stop the current session
  const stopSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      await fetch('/api/browser', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession.sessionId }),
      });

      setCurrentSession(null);
      updateBrowserState({ status: 'idle' });
    } catch (error) {
      console.error('[BrowserControl] Error stopping session:', error);
    }
  }, [currentSession, updateBrowserState]);

  // Add a permanent domain approval
  const addPermanentApproval = useCallback((domain: string) => {
    setPermanentlyApprovedDomains((prev) => new Set(prev).add(domain));
  }, []);

  // Remove a permanent domain approval
  const removePermanentApproval = useCallback((domain: string) => {
    setPermanentlyApprovedDomains((prev) => {
      const newSet = new Set(prev);
      newSet.delete(domain);
      return newSet;
    });
  }, []);

  const value: BrowserControlContextValue = {
    isSessionActive: currentSession !== null,
    currentSession,
    browserState,
    approvalRequest,
    permanentlyApprovedDomains,
    startSession,
    stopSession,
    updateBrowserState,
    requestDomainApproval,
    approveDomain,
    dismissApproval,
    addPermanentApproval,
    removePermanentApproval,
  };

  return (
    <BrowserControlContext.Provider value={value}>
      {children}
    </BrowserControlContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useBrowserControl(): BrowserControlContextValue {
  const context = useContext(BrowserControlContext);
  if (!context) {
    throw new Error('useBrowserControl must be used within BrowserControlProvider');
  }
  return context;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Assess risk level of a domain
 */
function assessRisk(domain: string): 'low' | 'medium' | 'high' {
  const lowerDomain = domain.toLowerCase();

  // Government domains - low risk
  if (
    lowerDomain.endsWith('.gov.uk') ||
    lowerDomain.endsWith('.gov') ||
    lowerDomain.endsWith('.nhs.uk')
  ) {
    return 'low';
  }

  // Well-known educational platforms - low to medium
  const safeDomains = [
    'schoolgle.co.uk',
    'schoolgle.com',
    'google.com',
    'microsoft.com',
    'office.com',
  ];

  if (safeDomains.some((d) => lowerDomain.includes(d))) {
    return 'low';
  }

  // Internal/private domains - medium
  if (lowerDomain.includes('school') || lowerDomain.includes('academy')) {
    return 'medium';
  }

  // Unknown domains - high
  return 'high';
}

/**
 * Categorize a domain
 */
function categorizeDomain(domain: string): 'government' | 'internal' | 'vendor' | 'other' {
  const lowerDomain = domain.toLowerCase();

  if (lowerDomain.endsWith('.gov.uk') || lowerDomain.endsWith('.gov') || lowerDomain.endsWith('.nhs.uk')) {
    return 'government';
  }

  if (lowerDomain.includes('school') || lowerDomain.includes('academy') || lowerDomain.includes('mat')) {
    return 'internal';
  }

  // Known vendors would be checked against a database
  return 'vendor';
}

export default BrowserControlProvider;
