"use client";

/**
 * EdBrowserControlWrapper Component
 *
 * Wraps the Estates Compliance page with browser automation functionality:
 * - BrowserControlProvider for state management
 * - EdDomainApproval for domain approval dialogs
 * - BrowserControlIndicator for visual feedback during automation
 *
 * Usage:
 * ```tsx
 * <EdBrowserControlWrapper organizationId={orgId}>
 *   <YourPageContent />
 * </EdBrowserControlWrapper>
 * ```
 */

import { ReactNode } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { BrowserControlProvider, useBrowserControl } from '@/lib/browser-control-context';
import { EdDomainApproval } from './EdDomainApproval';
import { BrowserControlIndicator } from '@/components/browser/BrowserControlIndicator';

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================

interface BrowserControlUIProps {
  children: ReactNode;
}

function BrowserControlUI({ children }: BrowserControlUIProps) {
  const {
    isSessionActive,
    browserState,
    approvalRequest,
    approveDomain,
    dismissApproval,
    stopSession,
  } = useBrowserControl();

  return (
    <>
      {children}

      {/* Domain Approval Dialog */}
      <EdDomainApproval
        open={approvalRequest !== null}
        onApprove={approveDomain}
        onDismiss={dismissApproval}
        request={approvalRequest ?? undefined}
        processing={false}
      />

      {/* Browser Control Indicator */}
      {isSessionActive && (
        <BrowserControlIndicator
          state={browserState}
          onInterrupt={stopSession}
          onDismiss={() => {
            // Auto-dismiss on completion handled by indicator
          }}
        />
      )}
    </>
  );
}

// ============================================================================
// MAIN WRAPPER COMPONENT
// ============================================================================

interface EdBrowserControlWrapperProps {
  children: ReactNode;
}

export function EdBrowserControlWrapper({ children }: EdBrowserControlWrapperProps) {
  const { organizationId } = useAuth();

  return (
    <BrowserControlProvider organizationId={organizationId}>
      <BrowserControlUI>{children}</BrowserControlUI>
    </BrowserControlProvider>
  );
}

export default EdBrowserControlWrapper;
