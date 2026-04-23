/**
 * Chat Input Component
 *
 * Text input with send button and integrated voice chat using Gemini Live.
 */

'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Ask Ed anything...',
  className = '',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSendMessage(trimmed);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  const handleVoiceToggle = () => {
    // Dispatch custom event for voice chat
    if (isVoiceActive) {
      window.dispatchEvent(new CustomEvent('ed-voice-stop'));
      setIsVoiceActive(false);
    } else {
      window.dispatchEvent(new CustomEvent('ed-voice-start'));
      setIsVoiceActive(true);
    }
  };

  // Listen for voice state changes
  React.useEffect(() => {
    const handleVoiceStart = () => setIsVoiceActive(true);
    const handleVoiceStop = () => setIsVoiceActive(false);

    window.addEventListener('ed-voice-start', handleVoiceStart);
    window.addEventListener('ed-voice-stop', handleVoiceStop);

    return () => {
      window.removeEventListener('ed-voice-start', handleVoiceStart);
      window.removeEventListener('ed-voice-stop', handleVoiceStop);
    };
  }, []);

  return (
    <div className={`p-4 border-t border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-end gap-2">
        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isVoiceActive ? "Listening..." : placeholder}
            disabled={disabled || isVoiceActive}
            rows={1}
            className={`
              w-full px-4 py-2.5 pr-12
              bg-slate-100 dark:bg-slate-800
              border-0 rounded-2xl
              text-sm text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              resize-none overflow-hidden
              focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              ${isVoiceActive ? 'ring-2 ring-blue-500 animate-pulse' : ''}
            `}
            style={{ minHeight: 42, maxHeight: 120 }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim() || isVoiceActive}
          className={`
            flex-shrink-0 w-10 h-10 rounded-full
            flex items-center justify-center
            transition-all duration-200
            ${disabled || !input.trim() || isVoiceActive
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95'
            }
          `}
          title="Send message"
          aria-label="Send message"
        >
          <Send width={18} height={18} />
        </button>

        {/* Voice button */}
        <button
          onClick={handleVoiceToggle}
          disabled={disabled}
          className={`
            flex-shrink-0 w-10 h-10 rounded-full
            flex items-center justify-center
            transition-all duration-200
            ${isVoiceActive
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
          `}
          title={isVoiceActive ? "Stop voice chat" : "Start voice chat"}
          aria-label={isVoiceActive ? "Stop voice chat" : "Start voice chat"}
        >
          {isVoiceActive ? <MicOff width={18} height={18} /> : <Mic width={18} height={18} />}
        </button>
      </div>

      {/* Helper text */}
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 px-1">
        {isVoiceActive ? (
          <span className="text-blue-600 dark:text-blue-400 font-medium">🎤 Listening... Tap the red button to stop</span>
        ) : (
          "Press Enter to send, Shift+Enter for new line • Or tap the microphone to talk"
        )}
      </p>
    </div>
  );
}
