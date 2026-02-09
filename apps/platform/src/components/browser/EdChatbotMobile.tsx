"use client";

/**
 * Ed Chatbot - Mobile-friendly conversational interface for browser automation
 *
 * Features:
 * - Native language conversations with automatic translation
 * - Side-by-side form preview
 * - Language toggle in header
 * - Voice input support
 * - Image upload for facilities tickets
 * - Approval cards with swipe gestures
 * - Bottom sheet design for mobile
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Mic,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Globe,
  Robot,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEdwinaVoice, TTSMessage } from '@/lib/edwina-voice';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormPreview } from './FormPreview';
import type {
  LanguageCode,
  TranslationResult,
} from '@/lib/translation-service';
import type { FormFieldData } from './FormPreview';
import { SUPPORTED_LANGUAGES } from '@/lib/translation-service';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  translatedContent?: string; // For system messages - shown in English
  timestamp: Date;
  metadata?: {
    action?: string;
    formData?: FormFieldData[];
    sessionId?: string;
    requiresApproval?: boolean;
    imageUrl?: string;
  };
}

export interface ApprovalCard {
  id: string;
  type: 'form_submit' | 'navigate' | 'fill' | 'click';
  title: string;
  description: string;
  details: Record<string, any>;
  onApprove: () => void | Promise<void>;
  onDeny: () => void;
  onEdit?: () => void;
}

export interface EdChatbotProps {
  /** Initial user language preference */
  initialLanguage?: LanguageCode;
  /** Session ID for browser automation */
  sessionId?: string;
  /** Current URL being navigated */
  currentUrl?: string;
  /** Callback when message is sent */
  onSendMessage?: (message: string, language: LanguageCode) => Promise<void>;
  /** Callback when voice is toggled */
  onVoiceToggle?: (enabled: boolean) => void;
  /** Callback when image is uploaded */
  onImageUpload?: (file: File) => Promise<void>;
  /** Show/hide language selector */
  showLanguageSelector?: boolean;
  /** Show/hide voice input */
  showVoiceInput?: boolean;
  /** Show/hide image upload */
  showImageUpload?: boolean;
  /** Custom welcome message */
  welcomeMessage?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EdChatbotMobile({
  initialLanguage = 'en',
  sessionId,
  currentUrl,
  onSendMessage,
  onVoiceToggle,
  onImageUpload,
  showLanguageSelector = true,
  showVoiceInput = true,
  showImageUpload = true,
  welcomeMessage = "Hi! I'm Ed, your AI assistant. How can I help you today?",
}: EdChatbotProps) {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(initialLanguage);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showFormPreview, setShowFormPreview] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<ApprovalCard | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentPlayingMessageId, setCurrentPlayingMessageId] = useState<string | null>(null);

  // Edwina Voice Hook
  const { isPlaying, isLoading: isVoiceLoading, speak, stop, isConfigured: voiceConfigured } = useEdwinaVoice({
    autoPlay: true, // Auto-play messages
    onEnd: () => {
      setCurrentPlayingMessageId(null);
    },
    onError: (error) => console.error('Voice error:', error),
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingApproval]);

  // Add welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      addMessage('assistant', welcomeMessage);
    }
  }, []);

  // ==========================================================================
  // MESSAGE HANDLING
  // ==========================================================================

  function addMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: ChatMessage['metadata']
  ) {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      metadata,
    };
    setMessages((prev) => [...prev, message]);

    // Auto-speak if it's an assistant message and voice is enabled
    if (role === 'assistant' && voiceEnabled && voiceConfigured) {
      setTimeout(() => {
        speak(content);
      }, 500); // Small delay to ensure message is rendered
    }

    return message;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Add user message
    addMessage('user', text);

    try {
      // Call parent handler if provided
      if (onSendMessage) {
        await onSendMessage(text, selectedLanguage);
      } else {
        // Mock response for standalone use
        await mockAIResponse(text);
      }
    } catch (error) {
      addMessage('system', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function mockAIResponse(userMessage: string) {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simple pattern matching for demo
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('form') || lowerMessage.includes('fill')) {
      addMessage('assistant', 'I can help you fill out a form. What form would you like to complete?');
    } else if (lowerMessage.includes('pupil premium') || lowerMessage.includes('free school meals')) {
      // Show form preview for Pupil Premium
      setPendingApproval({
        id: crypto.randomUUID(),
        type: 'form_submit',
        title: 'Pupil Premium Application',
        description: "I've collected the information for the Pupil Premium application. Please review before I submit it.",
        details: {
          domain: 'gov.uk',
          fields: [
            { ref: 'e1', name: 'Full Name', value: 'Jan Kowalski', required: true },
            { ref: 'e2', name: 'Email', value: 'jan.kowalski@example.com', required: true },
            { ref: 'e3', name: 'Postcode', value: 'B1 1AA', required: true },
            { ref: 'e4', name: 'Number of Children', value: '2', required: true },
          ],
        },
        onApprove: handleApproveForm,
        onDeny: () => setPendingApproval(null),
        onEdit: () => setShowFormPreview(true),
      });
    } else {
      addMessage('assistant', 'I understand. Let me help you with that. Could you provide more details?');
    }
  }

  // ==========================================================================
  // APPROVAL HANDLING
  // ==========================================================================

  async function handleApproveForm() {
    setIsSubmitting(true);
    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPendingApproval(null);
      addMessage('assistant', '✅ Form submitted successfully! You should receive a confirmation soon.');
    } catch (error) {
      addMessage('system', '❌ Form submission failed. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEditField(fieldRef: string) {
    // Focus the field for editing
    addMessage('assistant', `What would you like to change about the ${fieldRef} field?`);
    setPendingApproval(null);
    setShowFormPreview(false);
    inputRef.current?.focus();
  }

  // ==========================================================================
  // INPUT HANDLING
  // ==========================================================================

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleVoiceToggle() {
    if (onVoiceToggle) {
      await onVoiceToggle(!isListening);
    }
    setIsListening(!isListening);
  }

  function handleImageClick() {
    fileInputRef.current?.click();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      setIsLoading(true);
      try {
        await onImageUpload(file);
        addMessage('user', '[Image uploaded]', {
          imageUrl: URL.createObjectURL(file),
        });
        addMessage('assistant', "I can see the image. Let me analyze it for you...");
      } catch (error) {
        addMessage('system', 'Failed to upload image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const currentLanguage = SUPPORTED_LANGUAGES[selectedLanguage];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Bot info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Robot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Ed Assistant</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Voice Toggle */}
            {voiceConfigured && (
              <button
                onClick={() => {
                  if (isPlaying) {
                    stop();
                  }
                  setVoiceEnabled(!voiceEnabled);
                }}
                disabled={isVoiceLoading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  voiceEnabled
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                } disabled:opacity-50`}
                title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
              >
                {isVoiceLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Volume2 className="w-4 h-4 animate-pulse" />
                ) : voiceEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Language selector */}
            {showLanguageSelector && (
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {currentLanguage?.nativeName}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Language Dropdown */}
              {showLanguageMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Select Language
                  </div>
                  {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                        lang.code === selectedLanguage ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <span className="text-lg">{lang.name === 'English' ? '🇬🇧' : '🌐'}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {lang.nativeName}
                        </div>
                        <div className="text-xs text-gray-500">{lang.name}</div>
                      </div>
                      {lang.code === selectedLanguage && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Session info */}
        {currentUrl && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>Navigating to:</span>
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
              {currentUrl.replace(/^https?:\/\//, '').split('/')[0]}
            </span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : message.role === 'system'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              {/* Message header */}
              {message.role !== 'user' && (
                <div className={`flex items-center gap-2 px-4 py-2 border-b ${
                  message.role === 'system' ? 'border-amber-200' : 'border-gray-100'
                }`}>
                  {message.role === 'assistant' ? (
                    <Robot className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="text-xs font-semibold">
                    {message.role === 'assistant' ? 'Ed' : 'System'}
                  </span>
                  <span className="text-xs opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {/* Message content */}
              <div className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <p className="text-sm whitespace-pre-wrap flex-1">{message.content}</p>

                  {/* Voice control for assistant messages */}
                  {message.role === 'assistant' && voiceConfigured && (
                    <button
                      onClick={() => {
                        if (isPlaying && currentPlayingMessageId === message.id) {
                          stop();
                        } else {
                          speak(message.content);
                          setCurrentPlayingMessageId(message.id);
                        }
                      }}
                      disabled={isVoiceLoading}
                      className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                        isPlaying && currentPlayingMessageId === message.id
                          ? 'bg-purple-100 text-purple-600'
                          : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                      } disabled:opacity-50`}
                      title={isPlaying && currentPlayingMessageId === message.id ? 'Stop speaking' : 'Listen to this message'}
                    >
                      {isVoiceLoading && isPlaying && currentPlayingMessageId === message.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isPlaying && currentPlayingMessageId === message.id ? (
                        <Volume2 className="w-4 h-4 animate-pulse" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Translated content for system messages */}
                {message.translatedContent && message.translatedContent !== message.content && (
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="text-xs text-amber-700 italic">
                      "{message.translatedContent}"
                    </p>
                  </div>
                )}

                {/* Image attachment */}
                {message.metadata?.imageUrl && (
                  <img
                    src={message.metadata.imageUrl}
                    alt="Uploaded"
                    className="mt-2 rounded-lg max-w-full"
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Approval Card */}
        {pendingApproval && (
          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-indigo-900">{pendingApproval.title}</h4>
                  <p className="text-sm text-indigo-700 mt-1">{pendingApproval.description}</p>
                </div>
              </div>

              {/* Details */}
              {pendingApproval.details.fields && (
                <div className="mb-3 space-y-2">
                  {pendingApproval.details.fields.map((field: FormFieldData) => (
                    <div key={field.ref} className="text-sm">
                      <span className="font-medium text-gray-700">{field.name}:</span>
                      <span className="ml-2 text-gray-900">{field.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={pendingApproval.onDeny}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                {pendingApproval.onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={pendingApproval.onEdit}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={pendingApproval.onApprove}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
                <span className="text-sm text-gray-500">Ed is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Form Preview Modal */}
      {showFormPreview && pendingApproval?.details.fields && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Edit Form Details</h3>
              <button
                onClick={() => setShowFormPreview(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FormPreview
                formUrl={currentUrl || 'https://example.com'}
                domain={new URL(currentUrl || 'https://example.com').hostname}
                fields={pendingApproval.details.fields}
                userLanguage={selectedLanguage}
                nativeLanguageName={currentLanguage?.nativeName || 'English'}
                conversationHistory={messages.filter(m => m.role !== 'system').map(m => ({
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp,
                }))}
                onConfirm={handleApproveForm}
                onCancel={() => {
                  setShowFormPreview(false);
                  setPendingApproval(null);
                }}
                onEdit={handleEditField}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2">
          {/* Image upload button */}
          {showImageUpload && (
            <button
              onClick={handleImageClick}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Upload image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message in ${currentLanguage?.nativeName || 'English'}...`}
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          {/* Voice input button */}
          {showVoiceInput && (
            <button
              onClick={handleVoiceToggle}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } disabled:opacity-50`}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-400 mt-2 text-center">
          Ed can help fill forms in your language. All data is translated to English for submission.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default EdChatbotMobile;
