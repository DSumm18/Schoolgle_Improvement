/**
 * Chat Message Components
 *
 * Message bubbles for user and Ed messages.
 */

'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from './EdContext';
import { EdMicroAvatar } from './EdAvatar';

export interface ChatMessageProps {
  message: ChatMessageType;
  isDarkMode?: boolean;
}

export function ChatMessage({ message, isDarkMode = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`
        flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300
        ${isUser ? 'flex-row-reverse' : 'flex-row'}
      `}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <EdMicroAvatar className="rounded-full" />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-2.5
          ${isUser
            ? 'bg-blue-500 text-white rounded-br-sm'
            : isDarkMode
              ? 'bg-slate-700 text-slate-100 rounded-bl-sm'
              : 'bg-slate-100 text-slate-800 rounded-bl-sm'
          }
        `}
      >
        {/* Message content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Timestamp */}
        <span
          className={`
            text-[10px] mt-1 block opacity-60
            ${isUser ? 'text-blue-100' : 'text-muted-foreground'}
          `}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

/**
 * Typing indicator for when Ed is thinking
 */
export function TypingIndicator({ isDarkMode = false }: { isDarkMode?: boolean }) {
  return (
    <div className="flex gap-3 mb-4 animate-in fade-in duration-300">
      <div className="flex-shrink-0 mt-1">
        <img
          src="/ed/states/ed-thinking.svg"
          alt="Ed thinking"
          width={24}
          height={24}
          className="rounded-full"
        />
      </div>
      <div
        className={`
          rounded-2xl rounded-bl-sm px-4 py-3
          ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}
        `}
      >
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}

/**
 * Message list container
 */
export function MessageList({
  messages,
  isThinking = false,
  isDarkMode = false,
  className = '',
}: {
  messages: ChatMessageType[];
  isThinking?: boolean;
  isDarkMode?: boolean;
  className?: string;
}) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className={`flex-1 overflow-y-auto px-4 py-4 ${className}`}>
      {messages.length === 0 ? (
        // Empty state
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
          <img
            src="/ed/core/ed-primary.svg"
            alt="Ed"
            width={80}
            height={80}
            className="mb-4 opacity-80"
          />
          <h3 className="font-semibold text-lg mb-2">Hello! I'm Ed</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your school improvement assistant. How can I help you today?
          </p>
        </div>
      ) : (
        // Messages
        <>
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} isDarkMode={isDarkMode} />
          ))}
          {isThinking && <TypingIndicator isDarkMode={isDarkMode} />}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
