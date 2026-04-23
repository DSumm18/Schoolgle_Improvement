/**
 * Ed Chatbot Components
 *
 * A complete AI assistant chatbot for Schoolgle.
 *
 * @example Basic usage
 * ```tsx
 * import { EdProvider, EdChatbot } from '@/components/ed-new';
 *
 * // In your root layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <EdProvider>
 *       {children}
 *       <EdChatbot />
 *     </EdProvider>
 *   );
 * }
 * ```
 *
 * @example With custom module detection
 * ```tsx
 * import { useEdModule } from '@/components/ed-new';
 * import { usePathname } from 'next/navigation';
 *
 * function MyComponent() {
 *   const pathname = usePathname();
 *   useEdModule(pathname); // Auto-detects module from path
 *   return <EdChatbot />;
 * }
 * ```
 */

// Main components
export { EdProvider, EdChatbot } from './EdChatbot';
export type { EdChatbotProps } from './EdChatbot';

// Context and hooks
export { useEd, useEdModule } from './EdContext';
export type {
  EdMode,
  EdState,
  EdExpression,
  ChatMessage,
  EdContextValue,
} from './EdContext';

// Standalone components
export { EdLauncher } from './EdLauncher';
export { EdChatWindow, EdChatWindowMobile } from './EdChatWindow';

// Avatar components
export { EdAvatar, EdMicroAvatar, EdBadge } from './EdAvatar';
export type { EdAvatarProps } from './EdAvatar';

// Message components
export { ChatMessage, TypingIndicator, MessageList } from './ChatMessage';
export type { ChatMessageProps } from './ChatMessage';

// UI components
export { ChatHeader } from './ChatHeader';
export { ChatInput } from './ChatInput';
export { QuickSuggestions } from './QuickSuggestions';
export { PlanetOrbit, ModuleDot } from './PlanetOrbit';
export { default as EdVoiceOverlay } from './EdVoiceOverlay';
export type { EdVoiceOverlayProps } from './EdVoiceOverlay';

// Helper functions
export {
  getModuleColour,
  getQuickSuggestions,
  getInspectionSuggestions,
} from './EdContext';
