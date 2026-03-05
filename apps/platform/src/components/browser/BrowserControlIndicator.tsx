"use client";

/**
 * Browser Control Indicator - Perplexity Comet-inspired UI
 *
 * Shows when Ed is controlling the browser with:
 * - Subtle indicator on right side of screen
 * - Screen glow effect when active
 * - User warning not to interfere
 * - Current action display
 * - Guardrails that stop on user interference
 *
 * Inspired by Perplexity's browser automation feature
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  X,
  MousePointer2,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type BrowserControlStatus =
  | 'idle'           // Not controlling
  | 'starting'       // Initializing browser session
  | 'navigating'     // Navigating to URL
  | 'analyzing'      // Analyzing page structure
  | 'filling'        // Filling form fields
  | 'submitting'     // Submitting form
  | 'completed'      // Successfully completed
  | 'interrupted'    // User interrupted
  | 'error';         // Error occurred

export interface BrowserControlState {
  status: BrowserControlStatus;
  currentAction?: string;
  targetUrl?: string;
  progress?: number; // 0-100
  canInteract?: boolean; // Whether user can safely interact
  interruptReason?: string;
}

interface BrowserControlIndicatorProps {
  state: BrowserControlState;
  onInterrupt?: () => void;
  onDismiss?: () => void;
}

// ============================================================================
// STATUS CONFIGS
// ============================================================================

const STATUS_CONFIGS: Record<BrowserControlStatus, {
  icon: typeof Sparkles;
  color: string;
  bgColor: string;
  glowColor: string;
  message: string;
  warning?: string;
  showWarning?: boolean;
}> = {
  idle: {
    icon: Sparkles,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    glowColor: 'rgba(0, 0, 0, 0)',
    message: 'Ed is ready to help',
  },
  starting: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    glowColor: 'rgba(59, 130, 246, 0.1)',
    message: 'Starting browser session...',
    showWarning: true,
  },
  navigating: {
    icon: Sparkles,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    glowColor: 'rgba(99, 102, 241, 0.15)',
    message: 'Navigating to page',
    showWarning: true,
  },
  analyzing: {
    icon: Loader2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    glowColor: 'rgba(168, 85, 247, 0.15)',
    message: 'Analyzing page structure',
    showWarning: true,
  },
  filling: {
    icon: Sparkles,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    message: 'Filling form fields',
    showWarning: true,
  },
  submitting: {
    icon: Sparkles,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    message: 'Submitting form',
    showWarning: true,
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    glowColor: 'rgba(34, 197, 94, 0.15)',
    message: 'Completed successfully!',
  },
  interrupted: {
    icon: XCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    glowColor: 'rgba(249, 115, 22, 0.15)',
    message: 'Session interrupted',
    warning: 'You interrupted the session',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    glowColor: 'rgba(239, 68, 68, 0.15)',
    message: 'An error occurred',
    warning: 'Please try again',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BrowserControlIndicator({
  state,
  onInterrupt,
  onDismiss,
}: BrowserControlIndicatorProps) {
  const [isPulsing, setIsPulsing] = useState(true);
  const [userInterfered, setUserInterfered] = useState(false);

  const config = STATUS_CONFIGS[state.status];
  const Icon = config.icon;
  const isActive = ['starting', 'navigating', 'analyzing', 'filling', 'submitting'].includes(state.status);
  const showWarning = isActive || config.showWarning;

  // Detect user interference (mouse movement, keyboard, clicks)
  useEffect(() => {
    if (!isActive) return;

    const handleInterference = () => {
      setUserInterfered(true);
      if (onInterrupt) {
        onInterrupt();
      }
    };

    // Detect mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      // Ignore small movements
      if (Math.abs(e.movementX) > 10 || Math.abs(e.movementY) > 10) {
        handleInterference();
      }
    };

    // Detect keyboard
    const handleKeyDown = () => {
      handleInterference();
    };

    // Detect clicks outside safe zones
    const handleClick = () => {
      handleInterference();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [isActive, onInterrupt]);

  // Auto-dismiss after completion
  useEffect(() => {
    if (state.status === 'completed' || state.status === 'error') {
      const timer = setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.status, onDismiss]);

  // Don't show if idle and no recent activity
  if (state.status === 'idle') {
    return null;
  }

  return (
    <>
      {/* Screen Glow Effect */}
      {isActive && (
        <div
          className="fixed inset-0 pointer-events-none z-[9998] transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 80% 20%, ${config.glowColor}, transparent 70%)`,
          }}
        />
      )}

      {/* Right-side Indicator (Comet-style) */}
      <div
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-[9999] transition-all duration-300 ${
          isActive ? 'scale-100' : 'scale-95'
        }`}
      >
        {/* Main Card */}
        <div
          className={`${config.bgColor} ${config.color} rounded-2xl shadow-2xl border-2 ${
            isActive ? 'border-current' : 'border-opacity-30'
          } transition-all duration-300`}
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Status Header */}
          <div className="p-4 border-b border-current border-opacity-10">
            <div className="flex items-center gap-3">
              {/* Animated Icon */}
              <div className={`relative ${isPulsing && isActive ? 'animate-pulse' : ''}`}>
                <div className={`absolute inset-0 rounded-full ${
                  isActive ? 'bg-current opacity-20 animate-ping' : ''
                }`}></div>
                <Icon className={`w-6 h-6 relative ${isActive ? 'animate-spin' : ''}`} />
              </div>

              {/* Status Text */}
              <div className="flex-1">
                <p className="font-semibold text-sm">{config.message}</p>
                {state.currentAction && (
                  <p className="text-xs opacity-70 mt-0.5">{state.currentAction}</p>
                )}
              </div>

              {/* Dismiss Button */}
              {(state.status === 'completed' || state.status === 'error') && (
                <button
                  onClick={onDismiss}
                  className="p-1 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {state.progress !== undefined && isActive && (
            <div className="px-4 py-2">
              <div className="w-full bg-current bg-opacity-10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-current transition-all duration-300 ease-out"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Warning Section */}
          {showWarning && (
            <div className="p-4 border-t border-current border-opacity-10">
              {userInterfered ? (
                <div className="flex items-start gap-2 text-orange-600">
                  <MousePointer2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Interference Detected!</p>
                    <p className="text-xs opacity-80 mt-1">
                      Session paused for your safety
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="font-medium text-sm">
                      {state.status === 'starting'
                        ? 'Please wait...'
                        : 'Ed is controlling the browser'
                      }
                    </p>
                    <p className="text-xs opacity-80 mt-1">
                      {state.status === 'starting'
                        ? 'Initializing browser session...'
                        : 'Please do not use your mouse or keyboard'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Target URL (if available) */}
          {state.targetUrl && isActive && (
            <div className="px-4 pb-3">
              <div className="text-xs opacity-70 mb-1">Navigating to:</div>
              <div className="text-sm font-mono truncate" title={state.targetUrl}>
                {state.targetUrl}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isActive && onInterrupt && (
            <div className="px-4 pb-3">
              <button
                onClick={onInterrupt}
                className="w-full py-2 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                Stop Session
              </button>
            </div>
          )}
        </div>

        {/* Connection Line (to screen edge) */}
        {isActive && (
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-8 h-0.5 bg-gradient-to-l from-current to-transparent" />
        )}
      </div>
    </>
  );
}

// ============================================================================
// MINIMAL VERSION (Less Intrusive)
// ============================================================================

interface MinimalBrowserControlProps {
  active: boolean;
  action?: string;
}

export function MinimalBrowserControl({
  active,
  action,
}: MinimalBrowserControlProps) {
  if (!active) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div
        className="bg-indigo-600 text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 animate-pulse"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">
          {action || 'Ed is working...'}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN OVERLAY (Full screen warning)
// ============================================================================

interface BrowserControlOverlayProps {
  visible: boolean;
  message: string;
  canDismiss: boolean;
  onDismiss?: () => void;
}

export function BrowserControlOverlay({
  visible,
  message,
  canDismiss,
  onDismiss,
}: BrowserControlOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Browser Automation Active
        </h3>
        <p className="text-gray-600 mb-4">{message}</p>

        {canDismiss && (
          <button
            onClick={onDismiss}
            className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            Got it, thanks
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HOOK FOR DETECTING USER INTERFERENCE
// ============================================================================

export function useUserInterferenceDetection(enabled: boolean, onInterfere: () => void) {
  useEffect(() => {
    if (!enabled) return;

    let lastActivity = Date.now();
    let activityTimeout: NodeJS.Timeout;

    const resetActivity = () => {
      lastActivity = Date.now();
    };

    const checkActivity = () => {
      const now = Date.now();
      // If user was active in the last 100ms, consider it interference
      if (now - lastActivity < 100) {
        onInterfere();
      }
      activityTimeout = setTimeout(checkActivity, 100);
    };

    // Track various user interactions
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      window.addEventListener(event, resetActivity, { passive: true });
    });

    activityTimeout = setTimeout(checkActivity, 100);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
      clearTimeout(activityTimeout);
    };
  }, [enabled, onInterfere]);
}

export default BrowserControlIndicator;
