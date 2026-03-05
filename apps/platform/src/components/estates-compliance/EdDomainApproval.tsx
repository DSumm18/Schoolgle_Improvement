"use client";

/**
 * EdDomainApproval Component
 *
 * Dialog that prompts user when Ed wants to access a new domain.
 * Shows domain name, safety info, and options for:
 * - Allow once
 * - Allow permanently
 * - Decline
 *
 * Integrates with the browser domain approval system.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Globe, CheckCircle2, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type DomainApprovalChoice = 'allow_once' | 'allow_permanent' | 'decline';

export interface DomainApprovalRequest {
  domain: string;
  url: string;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  category?: 'government' | 'internal' | 'vendor' | 'other';
}

export interface DomainApprovalResponse {
  choice: DomainApprovalChoice;
  domain: string;
}

export interface EdDomainApprovalProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when user makes a choice */
  onApprove: (response: DomainApprovalResponse) => void;
  /** Callback when dialog is closed without choice */
  onDismiss?: () => void;
  /** The domain approval request details */
  request?: DomainApprovalRequest;
  /** Whether the request is currently being processed */
  processing?: boolean;
}

// ============================================================================
// DOMAIN CATEGORY CONFIGS
// ============================================================================

const CATEGORY_CONFIGS = {
  government: {
    label: 'Government',
    icon: 'Building',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
    description: 'Official government website',
  },
  internal: {
    label: 'Internal',
    icon: 'Building2',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    badgeClass: 'bg-green-100 text-green-700 border-green-300',
    description: 'Internal school system',
  },
  vendor: {
    label: 'Vendor',
    icon: 'Store',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-300',
    description: 'Third-party service provider',
  },
  other: {
    label: 'Other',
    icon: 'Globe',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
    description: 'External website',
  },
};

const RISK_CONFIGS = {
  low: {
    label: 'Low Risk',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: CheckCircle2,
    message: 'This is a trusted domain commonly used by schools.',
  },
  medium: {
    label: 'Medium Risk',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: AlertTriangle,
    message: 'Please review before granting access.',
  },
  high: {
    label: 'High Risk',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: XCircle,
    message: 'This domain requires careful consideration.',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EdDomainApproval({
  open,
  onApprove,
  onDismiss,
  request,
  processing = false,
}: EdDomainApprovalProps) {
  const [selectedChoice, setSelectedChoice] = useState<DomainApprovalChoice | null>(null);

  // Reset selection when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedChoice(null);
    }
  }, [open]);

  const handleChoice = async (choice: DomainApprovalChoice) => {
    if (processing || !request) return;

    setSelectedChoice(choice);

    // If declining, close immediately
    if (choice === 'decline') {
      onApprove({ choice, domain: request.domain });
      if (onDismiss) onDismiss();
      return;
    }

    // Show feedback for approval choices
    const message = choice === 'allow_permanent'
      ? `${request.domain} has been permanently approved for your organization.`
      : `Allowing one-time access to ${request.domain}.`;

    toast.success(message, {
      duration: 3000,
    });

    onApprove({ choice, domain: request.domain });
  };

  if (!request) {
    return null;
  }

  const categoryConfig = CATEGORY_CONFIGS[request.category || 'other'];
  const riskConfig = RISK_CONFIGS[request.riskLevel];
  const RiskIcon = riskConfig.icon;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDismiss?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
              <Globe className={`w-5 h-5 ${categoryConfig.color}`} />
            </div>
            <div className="flex-1">
              <DialogTitle>Domain Access Request</DialogTitle>
              <DialogDescription>
                Ed needs access to a new domain to complete your request
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Domain Display */}
          <div className={`p-4 rounded-lg border-2 ${categoryConfig.bgColor} ${categoryConfig.color} border-opacity-20`}>
            <div className="flex items-start gap-3">
              <Globe className={`w-5 h-5 mt-0.5 ${categoryConfig.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg break-all">{request.domain}</p>
                {request.url !== request.domain && (
                  <p className="text-sm opacity-70 truncate mt-1">{request.url}</p>
                )}
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className={`p-3 rounded-lg ${riskConfig.bgColor}`}>
            <div className="flex items-start gap-3">
              <RiskIcon className={`w-5 h-5 mt-0.5 ${riskConfig.color} flex-shrink-0`} />
              <div className="flex-1">
                <p className={`font-medium ${riskConfig.color}`}>
                  {riskConfig.label}
                </p>
                <p className="text-sm mt-1 opacity-80">{riskConfig.message}</p>
              </div>
            </div>
          </div>

          {/* Category Badge */}
          <div className="flex items-center justify-between">
            <Badge className={categoryConfig.badgeClass}>
              {categoryConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {categoryConfig.description}
            </span>
          </div>

          {/* Reason */}
          {request.reason && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Why Ed needs this:</span> {request.reason}
                </p>
              </div>
            </div>
          )}

          {/* Safety Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Protected by guardrails</p>
              <p className="text-blue-700 mt-1">
                Ed will never enter passwords, payment details, or sensitive personal information.
                You can stop the session at any time.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => handleChoice('allow_permanent')}
              disabled={processing}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Allow Permanently
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleChoice('allow_once')}
              disabled={processing}
            >
              Allow Once
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => handleChoice('decline')}
            disabled={processing}
          >
            Decline Access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// DOMAIN APPROVAL HOOK
// ============================================================================

/**
 * Hook to manage domain approval state
 */
export function useDomainApproval() {
  const [approvalRequest, setApprovalRequest] = useState<DomainApprovalRequest | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Request approval for a domain
   * Returns a promise that resolves with the user's choice
   */
  const requestApproval = (request: DomainApprovalRequest): Promise<DomainApprovalResponse> => {
    return new Promise((resolve) => {
      setApprovalRequest(request);
      setIsDialogOpen(true);

      // Store resolver for later
      (window as any).__domainApprovalResolver = resolve;
    });
  };

  /**
   * Handle user's approval choice
   */
  const handleApprove = (response: DomainApprovalResponse) => {
    setIsApproving(true);
    setIsDialogOpen(false);

    // Call the resolver if it exists
    const resolver = (window as any).__domainApprovalResolver;
    if (resolver) {
      resolver(response);
      delete (window as any).__domainApprovalResolver;
    }

    setTimeout(() => {
      setIsApproving(false);
      setApprovalRequest(null);
    }, 500);
  };

  /**
   * Handle dialog dismissal
   */
  const handleDismiss = () => {
    setIsDialogOpen(false);

    // Treat dismissal as decline
    if (approvalRequest) {
      const resolver = (window as any).__domainApprovalResolver;
      if (resolver) {
        resolver({ choice: 'decline', domain: approvalRequest.domain });
        delete (window as any).__domainApprovalResolver;
      }
    }

    setApprovalRequest(null);
  };

  return {
    approvalRequest,
    isApproving,
    isDialogOpen,
    requestApproval,
    handleApprove,
    handleDismiss,
  };
}

export default EdDomainApproval;
