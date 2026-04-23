/**
 * Ed Context — State management for Ed chatbot
 *
 * Manages Ed's state, expression, mode, and chat messages.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
export type EdMode = 'normal' | 'inspection';
export type EdState = 'idle' | 'thinking' | 'speaking' | 'success' | 'error';
export type EdExpression = 'neutral' | 'blink' | 'happy' | 'concerned' | 'proud' | 'blush';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface EdContextValue {
  // State
  isOpen: boolean;
  mode: EdMode;
  state: EdState;
  expression: EdExpression;
  messages: ChatMessage[];
  currentModule: string | null;

  // Actions
  setOpen: (open: boolean) => void;
  toggleChat: () => void;
  setMode: (mode: EdMode) => void;
  setState: (state: EdState) => void;
  setExpression: (expression: EdExpression) => void;
  setCurrentModule: (module: string | null) => void;

  // Message actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

const EdContext = createContext<EdContextValue | undefined>(undefined);

// Module detection from pathname
function detectModuleFromPath(pathname: string): string | null {
  const modulePatterns: Record<string, RegExp> = {
    improvement: /\/improvement|\/show-me/i,
    governance: /\/governance/i,
    estates: /\/estates/i,
    compliance: /\/compliance|\/safeguarding/i,
    communications: /\/communications|\/comms/i,
    intelligence: /\/intelligence/i,
    teaching: /\/teaching/i,
    hr: /\/hr/i,
    risk: /\/risk/i,
    finance: /\/finance/i,
  };

  for (const [module, pattern] of Object.entries(modulePatterns)) {
    if (pattern.test(pathname)) {
      return module;
    }
  }

  return null;
}

interface EdProviderProps {
  children: ReactNode;
  initialModule?: string | null;
}

export function EdProvider({ children, initialModule = null }: EdProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<EdMode>('normal');
  const [state, setState] = useState<EdState>('idle');
  const [expression, setExpression] = useState<EdExpression>('neutral');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(initialModule);

  // Toggle chat open/closed
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Add a message to the chat
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value: EdContextValue = {
    // State
    isOpen,
    mode,
    state,
    expression,
    messages,
    currentModule,

    // Actions
    setOpen: setIsOpen,
    toggleChat,
    setMode,
    setState,
    setExpression,
    setCurrentModule,

    // Message actions
    addMessage,
    clearMessages,
  };

  return <EdContext.Provider value={value}>{children}</EdContext.Provider>;
}

/**
 * Hook to access Ed context
 */
export function useEd(): EdContextValue {
  const context = useContext(EdContext);
  if (!context) {
    throw new Error('useEd must be used within an EdProvider');
  }
  return context;
}

/**
 * Hook to detect current module from pathname
 */
export function useEdModule(pathname: string) {
  const { setCurrentModule } = useEd();

  React.useEffect(() => {
    const module = detectModuleFromPath(pathname);
    setCurrentModule(module);
  }, [pathname, setCurrentModule]);
}

/**
 * Helper to get the appropriate Ed SVG path based on state and expression
 */
export function getEdAvatarPath(state: EdState, mode: EdMode): string {
  // Inspection mode overrides everything
  if (mode === 'inspection') {
    return '/ed/seasonal/inspection/ed-inspection.svg';
  }

  // State-based SVGs
  switch (state) {
    case 'thinking':
      return '/ed/states/ed-thinking.svg';
    case 'speaking':
      return '/ed/states/ed-speaking.svg';
    case 'success':
      return '/ed/states/ed-success.svg';
    case 'error':
      return '/ed/states/ed-error.svg';
    case 'idle':
    default:
      return '/ed/states/ed-idle.svg';
  }
}

/**
 * Get module colour for the context dot
 */
export function getModuleColour(module: string | null): string {
  const colours: Record<string, string> = {
    improvement: '#8B5CF6', // purple
    governance: '#3B82F6', // blue
    estates: '#F59E0B', // amber
    compliance: '#EF4444', // red
    communications: '#10B981', // emerald
    intelligence: '#06B6D4', // cyan
    teaching: '#EC4899', // pink
    hr: '#F97316', // orange
    risk: '#6366F1', // indigo
    finance: '#22C55E', // green
  };

  return module ? colours[module] || '#6B7280' : '#6B7280';
}

/**
 * Get quick suggestion pills based on module
 */
export function getQuickSuggestions(module: string | null): string[] {
  const suggestions: Record<string, string[]> = {
    improvement: [
      "How's my Ofsted readiness?",
      "Show improvement priorities",
      "Generate SEF summary",
    ],
    governance: [
      "Upcoming governor deadlines",
      "Generate board report",
      "Governor training status",
    ],
    estates: [
      "Compliance checklist",
      "Contractor approvals pending",
      "Asset maintenance due",
    ],
    compliance: [
      "Compliance gaps",
      "DBS expiry alerts",
      "Policy update reminders",
    ],
    communications: [
      "Draft parent letter",
      "Newsletter template",
      "Stakeholder announcements",
    ],
    intelligence: [
      "Attendance trends",
      "Assessment overview",
      "Benchmarking insights",
    ],
    teaching: [
      "Lesson plan helper",
      "CPD suggestions",
      "Curriculum resources",
    ],
    hr: [
      "Staff absence summary",
      "Recruitment pipeline",
      "Training records",
    ],
    safeguarding: [
      "Safeguarding status",
      "DSL handover notes",
      "Concern log summary",
    ],
    risk: [
      "Risk register review",
      "Health & safety checklist",
      "ICFP analysis",
    ],
    finance: [
      "Budget health check",
      "Financial benchmarking",
      "Procurement guidance",
    ],
  };

  if (module && suggestions[module]) {
    return suggestions[module];
  }

  // Default suggestions
  return [
    "What can you help with?",
    "Show me around",
    "How does Schoolgle work?",
  ];
}

/**
 * Get inspection mode suggestions
 */
export function getInspectionSuggestions(): string[] {
  return [
    "Ofsted readiness summary",
    "Key data for inspectors",
    "Evidence portfolio",
    "Staff briefing checklist",
    "SEF summary",
    "Safeguarding status",
  ];
}
