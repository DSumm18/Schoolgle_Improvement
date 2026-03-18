"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import EdWidgetWrapper from "@/components/EdWidgetWrapper";

interface EdChatbotContextType {
  isOpen: boolean;
  isMinimized: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  toggleMinimize: () => void;
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
  const { user, organization } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const toggleChat = () => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsOpen(true);
    } else {
      setIsMinimized(true);
    }
  };

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
        openChat,
        closeChat,
        toggleChat,
        toggleMinimize,
      }}
    >
      {children}
      {/* Initialize Ed Widget for all users - mode depends on login state */}
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
      />
    </EdChatbotContext.Provider>
  );
}

// useEdChatbot is already exported above, EdChatbotProvider is exported via the function declaration
