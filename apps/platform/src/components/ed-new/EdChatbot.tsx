/**
 * Ed Chatbot Component
 *
 * Main entry point for the Ed chatbot system.
 * Combines the launcher, chat window, and all necessary providers.
 *
 * Usage:
 *   1. Wrap your app with EdProvider (usually in layout.tsx)
 *   2. Include <EdChatbot /> component where you want the launcher to appear
 */

'use client';

import React from 'react';
import { useEd } from './EdContext';
import { EdLauncher } from './EdLauncher';
import { EdChatWindow, EdChatWindowMobile } from './EdChatWindow';

export interface EdChatbotProps {
  /**
   * Whether to use mobile fullscreen mode
   * Automatically detected on small screens if not specified
   */
  forceMobile?: boolean;

  /**
   * Additional CSS classes for the launcher
   */
  launcherClassName?: string;

  /**
   * Additional CSS classes for the chat window
   */
  windowClassName?: string;
}

/**
 * Main Ed chatbot component with launcher and chat window
 */
export function EdChatbot({
  forceMobile,
  launcherClassName = '',
  windowClassName = '',
}: EdChatbotProps) {
  const { isOpen } = useEd();

  // Detect mobile breakpoint
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640 || forceMobile === true);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [forceMobile]);

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && <EdLauncher className={launcherClassName} />}

      {/* Chat window - mobile or desktop variant */}
      {isMobile ? (
        <EdChatWindowMobile className={windowClassName} />
      ) : (
        <EdChatWindow className={windowClassName} />
      )}
    </>
  );
}

/**
 * Standalone launcher button (for custom placement)
 */
export { EdLauncher } from './EdLauncher';

/**
 * Standalone chat window (for custom layouts)
 */
export { EdChatWindow, EdChatWindowMobile } from './EdChatWindow';

/**
 * Context and hooks
 */
export { EdProvider, useEd, useEdModule } from './EdContext';
export type { EdMode, EdState, EdExpression, ChatMessage, EdContextValue } from './EdContext';

/**
 * Avatar components
 */
export { EdAvatar, EdMicroAvatar, EdBadge } from './EdAvatar';

/**
 * Message components
 */
export { ChatMessage, TypingIndicator, MessageList } from './ChatMessage';

/**
 * Other components
 */
export { ChatHeader } from './ChatHeader';
export { ChatInput } from './ChatInput';
export { QuickSuggestions } from './QuickSuggestions';
export { PlanetOrbit, ModuleDot } from './PlanetOrbit';

// Re-export helper functions
export { getModuleColour, getQuickSuggestions, getInspectionSuggestions } from './EdContext';
