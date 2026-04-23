/**
 * Ed Chat Window
 *
 * Main chat window component with header, messages, suggestions, and input.
 * Now with Gemini Live API for both voice input and voice output.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEd, ChatMessage as ChatMessageType } from './EdContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './ChatMessage';
import { QuickSuggestions } from './QuickSuggestions';
import { ChatInput } from './ChatInput';
import EdVoiceOverlay from './EdVoiceOverlay';

export interface EdChatWindowProps {
  className?: string;
}

export function EdChatWindow({ className = '' }: EdChatWindowProps) {
  const {
    isOpen,
    toggleChat,
    messages,
    addMessage,
    state,
    setState,
    mode,
    currentModule,
  } = useEd();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Add greeting when chat opens and there are no messages
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = mode === 'inspection'
        ? 'Inspection mode active. How can I help you prepare for your inspection?'
        : 'Hello! I\'m Ed, your school improvement assistant. How can I help you today?';

      addMessage({
        role: 'assistant',
        content: greeting,
      });
    }
  }, [isOpen, messages.length, mode, addMessage]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    addMessage({ role: 'user', content });

    // Set thinking state
    setState('thinking');
    setIsSending(true);

    try {
      // Send to new chat API
      const response = await fetch('/api/ed/chat/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          mode,
          module: currentModule,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let assistantMessage = '';

      setState('speaking');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Add assistant's response
      addMessage({
        role: 'assistant',
        content: assistantMessage || 'How can I help you further?',
      });

      setState('idle');

      // Play voice using Gemini Live TTS
      if (assistantMessage) {
        await playVoiceWithGemini(assistantMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'system',
        content: 'Sorry, I had trouble connecting. Please try again.',
      });
      setState('error');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Play voice using Gemini Live TTS
   * This uses the same API as voice input but for text-to-speech only
   */
  const playVoiceWithGemini = async (text: string) => {
    try {
      // Don't play in inspection mode (serious mode = no voice)
      if (mode === 'inspection') {
        return;
      }

      // Don't play very short messages
      if (text.length < 10) {
        return;
      }

      // Call Gemini Live TTS endpoint
      const response = await fetch('/api/ed/tts/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          module: currentModule,
        }),
      });

      if (!response.ok) {
        console.warn('[Ed Chat] Gemini TTS generation failed:', response.status);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.warn('[Ed Chat] Audio playback failed');
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.warn('[Ed Chat] Voice playback error:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleClose = () => {
    toggleChat();
  };

  // Handle voice overlay events
  useEffect(() => {
    const handleVoiceStart = () => setShowVoiceOverlay(true);
    const handleVoiceStop = () => setShowVoiceOverlay(false);

    window.addEventListener('ed-voice-start', handleVoiceStart);
    window.addEventListener('ed-voice-stop', handleVoiceStop);

    return () => {
      window.removeEventListener('ed-voice-start', handleVoiceStart);
      window.removeEventListener('ed-voice-stop', handleVoiceStop);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className={`
          fixed bottom-24 right-6 z-40
          w-[380px] h-[520px]
          rounded-2xl shadow-2xl
          flex flex-col
          overflow-hidden
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-700
          animate-in slide-in-from-bottom-2 fade-in duration-300
          ${className}
        `}
      >
        {/* Header */}
        <ChatHeader onClose={handleClose} />

        {/* Messages */}
        <MessageList
          messages={messages}
          isThinking={isSending}
          isDarkMode={isDarkMode}
          className="flex-1"
        />

        {/* Quick suggestions */}
        <QuickSuggestions onSuggestionClick={handleSuggestionClick} />

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isSending}
          placeholder="Ask Ed anything..."
        />
      </div>

      {/* Voice Overlay */}
      {showVoiceOverlay && (
        <EdVoiceOverlay
          onClose={() => {
            setShowVoiceOverlay(false);
            window.dispatchEvent(new CustomEvent('ed-voice-stop'));
          }}
          onTranscript={(text) => {
            // Add voice transcript as user message
            if (text.trim()) {
              addMessage({ role: 'user', content: text });
              handleSendMessage(text);
            }
          }}
        />
      )}
    </>
  );
}

/**
 * Mobile-fullscreen variant
 */
export function EdChatWindowMobile({ className = '' }: EdChatWindowProps) {
  const {
    isOpen,
    toggleChat,
    messages,
    addMessage,
    state,
    setState,
    mode,
    currentModule,
  } = useEd();

  const [isSending, setIsSending] = useState(false);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);

  const handleSendMessage = async (content: string) => {
    addMessage({ role: 'user', content });
    setState('thinking');
    setIsSending(true);

    try {
      const response = await fetch('/api/ed/chat/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          mode,
          module: currentModule,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      setState('speaking');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      addMessage({
        role: 'assistant',
        content: assistantMessage || 'How can I help you further?',
      });

      setState('idle');

      if (assistantMessage && mode !== 'inspection') {
        // Play voice using Gemini Live TTS (same as desktop)
        try {
          const response = await fetch('/api/ed/tts/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: assistantMessage, mode }),
          });

          if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.onended = () => URL.revokeObjectURL(audioUrl);
            await audio.play();
          }
        } catch (error) {
          console.warn('Voice playback error:', error);
        }
      }
    } catch (error) {
      addMessage({
        role: 'system',
        content: 'Sorry, something went wrong. Please try again.',
      });
      setState('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Handle voice overlay events
  useEffect(() => {
    const handleVoiceStart = () => setShowVoiceOverlay(true);
    const handleVoiceStop = () => setShowVoiceOverlay(false);

    window.addEventListener('ed-voice-start', handleVoiceStart);
    window.addEventListener('ed-voice-stop', handleVoiceStop);

    return () => {
      window.removeEventListener('ed-voice-start', handleVoiceStart);
      window.removeEventListener('ed-voice-stop', handleVoiceStop);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`
          fixed inset-0 z-50
          flex flex-col
          bg-white dark:bg-slate-900
          animate-in slide-in-from-right duration-300
          ${className}
        `}
      >
        {/* Header */}
        <ChatHeader onClose={toggleChat} />

        {/* Messages */}
        <MessageList
          messages={messages}
          isThinking={isSending}
          isDarkMode={false}
          className="flex-1"
        />

        {/* Quick suggestions */}
        <QuickSuggestions onSuggestionClick={handleSuggestionClick} />

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isSending}
          placeholder="Ask Ed anything..."
        />
      </div>

      {/* Voice Overlay */}
      {showVoiceOverlay && (
        <EdVoiceOverlay
          onClose={() => {
            setShowVoiceOverlay(false);
            window.dispatchEvent(new CustomEvent('ed-voice-stop'));
          }}
          onTranscript={(text) => {
            if (text.trim()) {
              addMessage({ role: 'user', content: text });
              handleSendMessage(text);
            }
          }}
        />
      )}
    </>
  );
}
