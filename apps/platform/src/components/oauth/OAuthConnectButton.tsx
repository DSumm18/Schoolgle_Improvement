/**
 * OAuth Connect Button Component
 *
 * "Connect Google Drive" and "Connect OneDrive" buttons
 * Opens OAuth popup for user authorization
 */

'use client';

import React, { useState } from 'react';
import { Cloud, Lock } from 'lucide-react';

interface OAuthConnectButtonProps {
  provider: 'google' | 'microsoft';
  organizationId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function OAuthConnectButton({
  provider,
  organizationId,
  onSuccess,
  onError,
}: OAuthConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerConfig = {
    google: {
      name: 'Google Drive',
      icon: '🔵',
      color: 'bg-blue-600 hover:bg-blue-700',
      borderColor: 'border-blue-500',
    },
    microsoft: {
      name: 'OneDrive',
      icon: '🔷',
      color: 'bg-sky-600 hover:bg-sky-700',
      borderColor: 'border-sky-500',
    },
  }[provider];

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get authorization URL
      const authRes = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, organizationId }),
      });

      if (!authRes.ok) {
        const data = await authRes.json();
        throw new Error(data.error || 'Failed to initiate OAuth');
      }

      const { authorizationUrl, state } = await authRes.json();

      // Step 2: Open OAuth popup
      const popup = window.open(
        authorizationUrl,
        `oauth_${provider}`,
        {
          width: 600,
          height: 700,
          left: window.screen.width / 2 - 300,
          top: window.screen.height / 2 - 350,
        }
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Step 3: Poll for popup closure (OAuth callback handles success)
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setLoading(false);

          // Check if OAuth succeeded by checking URL parameters
          // The callback will redirect back to the app with success/error params
          setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const oauthSuccess = urlParams.get('oauth_success');
            const oauthError = urlParams.get('oauth_error');

            if (oauthSuccess === provider) {
              onSuccess?.();
            } else if (oauthError) {
              setError(getErrorMessage(oauthError));
              onError?.(oauthError);
            }

            // Clean up URL params
            window.history.replaceState({}, '', '/settings/data-connections');
          }, 500);
        }
      }, 500);
    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    const errors: Record<string, string> = {
      access_denied: 'You denied access to your ' + providerConfig.name,
      invalid_state: 'Security validation failed. Please try again.',
      missing_params: 'Invalid OAuth response. Please try again.',
      server_error: 'Server error. Please try again.',
    };
    return errors[errorCode] || `Failed to connect: ${errorCode}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleConnect}
        disabled={loading}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg border-2
          transition-all duration-200
          ${providerConfig.color}
          ${providerConfig.borderColor}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          text-white font-medium
          shadow-sm hover:shadow-md
        `}
      >
        <span className="text-2xl">{providerConfig.icon}</span>
        <span className="flex-1 text-left">
          {loading ? 'Connecting...' : `Connect ${providerConfig.name}`}
        </span>
        {!loading && <Cloud size={20} />}
      </button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
        <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 dark:text-blue-200">
          <strong>Privacy First:</strong> Schoolgle will only access your &quot;Schoolgle Drive&quot; folder — nothing else in your {providerConfig.name}.
        </p>
      </div>
    </div>
  );
}
