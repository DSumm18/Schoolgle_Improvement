"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import EdWidgetWrapper from "@/components/EdWidgetWrapper";
import { useSubscriptionState } from "@/hooks/useSubscriptionState";
import { hasEdChatbotAccess } from "@/lib/ed/visibility";

interface EdChatbotContextType {
  isOpen: boolean;
  isMinimized: boolean;
  initialMessage: string | null;
  isEnabled: boolean;
  openChat: () => void;
  openChatWith: (message: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  toggleMinimize: () => void;
  clearInitialMessage: () => void;
}

const EdChatbotContext = createContext<EdChatbotContextType | undefined>(
  undefined,
);

export function useEdChatbot() {
  const context = useContext(EdChatbotContext);
  if (!context) {
    throw new Error("useEdChatbot must be used within EdChatbotProvider");
  }
  return context;
}

interface EdChatbotProviderProps {
  children?: ReactNode;
}

export function EdChatbotProvider({ children }: EdChatbotProviderProps) {
  const { user, session, organization } = useAuth();
  const { state: subscription } = useSubscriptionState(organization?.id);
  const isEnabled = hasEdChatbotAccess(subscription);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  const openChat = () => {
    if (!isEnabled) return;
    setIsOpen(true);
    setIsMinimized(false);
  };

  const openChatWith = (message: string) => {
    if (!isEnabled) return;
    setInitialMessage(message);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const clearInitialMessage = () => {
    setInitialMessage(null);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const toggleChat = () => {
    if (!isEnabled) return;
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  const toggleMinimize = () => {
    if (!isEnabled) return;
    if (isMinimized) {
      setIsMinimized(false);
      setIsOpen(true);
    } else {
      setIsMinimized(true);
    }
  };

  useEffect(() => {
    if (!isEnabled) {
      setIsOpen(false);
      setIsMinimized(false);
      setInitialMessage(null);
    }
  }, [isEnabled]);

  // This component provides the context and renders the Ed Widget Wrapper
  // EdWidgetWrapper handles the actual widget with all features (orb, voice, fish audio, etc.)
  //
  // Ed is available in two modes:
  // - Support mode (pre-login): Helps with login/access issues
  // - School mode (logged-in): Full school support with organization context
  return (
    <EdChatbotContext.Provider
      value={{
        isOpen,
        isMinimized,
        initialMessage,
        isEnabled,
        openChat,
        openChatWith,
        closeChat,
        toggleChat,
        toggleMinimize,
        clearInitialMessage,
      }}
    >
      {children}
      {isEnabled && (
        <EdWidgetWrapper
          isOpen={isOpen}
          onToggle={toggleChat}
          isMinimized={isMinimized}
          onToggleMinimize={toggleMinimize}
          organizationId={organization?.id}
          userName={
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.email?.split("@")[0]
          }
          schoolName={organization?.name}
          mode={user && organization ? "user" : "demo"}
          accessToken={session?.access_token}
        />
      )}
    </EdChatbotContext.Provider>
  );
}

// useEdChatbot is already exported above, EdChatbotProvider is exported via the function declaration
