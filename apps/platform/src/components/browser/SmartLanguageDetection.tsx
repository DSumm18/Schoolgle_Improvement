"use client";

/**
 * Smart Language Detection with Proactive UX
 *
 * Features:
 * - Auto-detects user's language from their message
 * - Proactively asks if they want to switch language
 * - Educates users about Ed's capabilities
 * - "Reads between the lines" to understand intent
 * - Suggests relevant features based on context
 *
 * This makes Ed more accessible and user-friendly for non-native English speakers.
 */

import { useState, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LANGUAGES } from '@/lib/translation-service';
import type { LanguageCode } from '@/lib/translation-service';

// ============================================================================
// TYPES
// ============================================================================

export interface DetectionResult {
  detected: LanguageCode;
  confidence: number;
  reason: string;
}

export interface LanguageSuggestion {
  /** Whether to switch to detected language */
  shouldSwitch: boolean;
  /** Message to show the user */
  message: string;
  /** Suggested actions Ed can take */
  suggestedActions: string[];
}

// ============================================================================
// INTENT PATTERNS (For "reading between the lines")
// ============================================================================

interface IntentPattern {
  keywords: string[];
  language?: LanguageCode;
  intent: 'form_fill' | 'riddor' | 'photo_upload' | 'voice_input' | 'general_help';
  response: string;
  suggestedActions: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    keywords: ['form', 'fill', 'apply', 'application', 'pupil premium', 'free school meals', 'dziecko'],
    intent: 'form_fill',
    response: "I can help you fill out forms in your native language. I'll translate everything to English before submitting.",
    suggestedActions: [
      'Fill form together',
      'Explain form questions',
      'Translate form responses',
    ],
  },
  {
    keywords: ['injury', 'accident', 'incident', 'riddor', 'hse', 'report', 'work related', 'uraz', 'wypadek'],
    intent: 'riddor',
    response: "I can help you complete RIDDOR reports for workplace incidents. I'll guide you through each section.",
    suggestedActions: [
      'Start RIDDOR report',
      'Explain what information is needed',
      'Translate technical terms',
    ],
  },
  {
    keywords: ['photo', 'picture', 'broken', 'leaking', 'damage', 'leak', 'zepsute', 'uszkodzone'],
    intent: 'photo_upload',
    response: "I can analyze photos of maintenance issues and automatically create help desk tickets with severity assessment.",
    suggestedActions: [
      'Upload a photo',
      'Describe the issue',
      'Create facilities ticket',
    ],
  },
  {
    keywords: ['voice', 'speak', 'talk', 'listen', 'glos', 'mowic'],
    intent: 'voice_input',
    response: "You can use voice input with me! I'm configured with Edwina's voice for text-to-speech.",
    suggestedActions: [
      'Enable voice input',
      'Switch to Edwina voice',
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect user intent from their message
 */
function detectIntent(message: string): IntentPattern | null {
  const lowerMessage = message.toLowerCase();

  for (const pattern of INTENT_PATTERNS) {
    if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return pattern;
    }
  }

  return null;
}

/**
 * Check if user seems to be struggling with English
 */
function seemsToBeStrugglingWithEnglish(message: string): boolean {
  const indicators = [
    // Very short messages
    message.length < 10 && message.split(' ').length === 1,
    // All caps (could indicate unfamiliarity with typing)
    message === message.toUpperCase() && message.length > 5,
    // No spaces (common in some languages)
    !message.includes(' ') && message.length > 15,
    // Mixed scripts
    /[\u0000-\u007F]+[\u0080-\uFFFF]+/.test(message),
  ];

  return indicators.some(Boolean);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SmartLanguageDetectionProps {
  /** User's current message being processed */
  message: string;
  /** User's current preferred language */
  currentLanguage: LanguageCode;
  /** Callback when user wants to switch language */
  onLanguageSwitch: (language: LanguageCode) => void;
  /** Callback when user wants help with a specific task */
  onActionRequest?: (action: string) => void;
  /** Whether to show suggestions */
  showSuggestions?: boolean;
}

export function SmartLanguageDetection({
  message,
  currentLanguage,
  onLanguageSwitch,
  onActionRequest,
  showSuggestions = true,
}: SmartLanguageDetectionProps) {
  const [detectedLanguage, setDetectedLanguage] = useState<LanguageCode | null>(null);
  const [showLanguagePrompt, setShowLanguagePrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Detect language and intent when message changes
  useEffect(() => {
    if (!message || message.length < 3) return;

    // Simple language detection based on character patterns
    let detected: LanguageCode = 'en';

    // Check for specific scripts
    if (/[\u0600-\u06FF]/.test(message)) {
      detected = 'ur'; // Arabic script
    } else if (/[\u0980-\u09FF]/.test(message)) {
      detected = 'bn'; // Bengali
    } else if (/[\u0A00-\u0A7F]/.test(message)) {
      detected = 'pa'; // Punjabi
    } else if (/[\u0A80-\u0AFF]/.test(message)) {
      detected = 'gu'; // Gujarati
    } else if (/[ąćęłńóśźż]/i.test(message)) {
      detected = 'pl'; // Polish
    } else if (/[\u4E00-\u9FFF]/.test(message)) {
      detected = 'zh'; // Chinese
    }

    setDetectedLanguage(detected);

    // Show prompt if:
    // 1. Detected language differs from current
    // 2. User hasn't dismissed this prompt
    // 3. Message seems to indicate non-native English
    const shouldPrompt =
      detected !== currentLanguage &&
      !dismissed &&
      (detected !== 'en' || seemsToBeStrugglingWithEnglish(message));

    if (shouldPrompt) {
      // Delay slightly to not interrupt immediately
      const timer = setTimeout(() => {
        setShowLanguagePrompt(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [message, currentLanguage, dismissed]);

  // Detect user intent
  const intent = detectIntent(message);
  const detectedLang = SUPPORTED_LANGUAGES[detectedLanguage || 'en'];

  if (!showLanguagePrompt && !showSuggestions) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Language Switch Prompt */}
      {showLanguagePrompt && detectedLanguage && detectedLanguage !== currentLanguage && (
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-indigo-900">
                  I noticed you're speaking {detectedLang?.nativeName}
                </h4>
                <p className="text-sm text-indigo-700 mt-1">
                  Would you prefer I respond in {detectedLang?.nativeName} or English?
                </p>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-indigo-400" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onLanguageSwitch(detectedLanguage!);
                  setShowLanguagePrompt(false);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <Globe className="w-4 h-4 mr-2" />
                {detectedLang?.nativeName}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onLanguageSwitch('en');
                  setShowLanguagePrompt(false);
                }}
                className="flex-1"
              >
                <Globe className="w-4 h-4 mr-2" />
                English
              </Button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-indigo-600 mt-3 text-center">
              💡 I can translate our conversation to English for form submissions
            </p>
          </div>
        </Card>
      )}

      {/* Intent-based Suggestions */}
      {showSuggestions && intent && (
        <Card className="border-purple-200 bg-purple-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900">
                  I can help with that!
                </h4>
                <p className="text-sm text-purple-700 mt-1">{intent.response}</p>
              </div>
            </div>

            {/* Suggested Actions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-purple-900 uppercase">
                What would you like to do?
              </p>
              {intent.suggestedActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (onActionRequest) {
                      onActionRequest(action);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 bg-white hover:bg-purple-50 border border-purple-200 rounded-lg transition-colors group"
                >
                  <span className="text-sm font-medium text-purple-900">
                    {action}
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Capabilities Showcase (for new users) */}
      {showSuggestions && message.length < 20 && (
        <Card className="border-gray-200 bg-gray-50">
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Here's what I can help you with:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  icon: <FileText className="w-4 h-4" />,
                  title: 'Fill Forms',
                  description: 'Pupil Premium, Free School Meals, RIDDOR reports',
                },
                {
                  icon: <MessageSquare className="w-4 h-4" />,
                  title: 'Chat in Your Language',
                  description: 'I speak 13+ languages and translate for you',
                },
                {
                  icon: <ImageIcon className="w-4 h-4" />,
                  title: 'Photo Upload',
                  description: 'Report maintenance issues with photos',
                },
                {
                  icon: <Sparkles className="w-4 h-4" />,
                  title: 'Voice Support',
                  description: 'Use voice input and hear Edwina speak',
                },
              ].map((capability, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200"
                >
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    {capability.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {capability.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {capability.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Just tell me what you need help with!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// LANGUAGE SELECTION PROMPT (Proactive)
// ============================================================================

interface LanguageSelectionPromptProps {
  detectedLanguage: LanguageCode;
  onConfirm: (language: LanguageCode) => void;
  onDismiss: () => void;
}

export function LanguageSelectionPrompt({
  detectedLanguage,
  onConfirm,
  onDismiss,
}: LanguageSelectionPromptProps) {
  const lang = SUPPORTED_LANGUAGES[detectedLanguage];

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm">
      <Card className="border-indigo-200 bg-white shadow-xl">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                I noticed you're speaking <span className="font-semibold">{lang?.nativeName}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Should I switch to {lang?.nativeName}?
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => onConfirm(detectedLanguage)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <Check className="w-3 h-3 mr-1" />
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="flex-1"
            >
              <X className="w-3 h-3 mr-1" />
              No thanks
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// PROACTIVE HELPER (Reads between the lines)
// ============================================================================

interface ProactiveHelperProps {
  userMessage: string;
  onSuggestion: (suggestion: string) => void;
}

export function ProactiveHelper({ userMessage, onSuggestion }: ProactiveHelperProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const lowerMessage = userMessage.toLowerCase();

    // Form-related suggestions
    if (lowerMessage.includes('form') || lowerMessage.includes('apply')) {
      if (lowerMessage.includes('pupil') || lowerMessage.includes('free school')) {
        setSuggestions([
          'I can help fill out the Pupil Premium form',
          'What is your household income?',
          'How many children do you have?',
        ]);
      } else if (lowerMessage.includes('injury') || lowerMessage.includes('accident') || lowerMessage.includes('riddor')) {
        setSuggestions([
          'I can help with RIDDOR reporting',
          'What happened?',
          'Was anyone injured?',
          'When did it occur?',
        ]);
      }
    }
    // Photo-related suggestions
    else if (lowerMessage.includes('broken') || lowerMessage.includes('leak') || lowerMessage.includes('damage')) {
      setSuggestions([
        'You can upload a photo of the issue',
        'I can analyze the image and create a maintenance ticket',
        'Where is the problem located?',
      ]);
    }
    // Language-related
    else if (lowerMessage.length < 5 && lowerMessage.split(' ').length === 1) {
      setSuggestions([
        'Tell me more about what you need help with',
        'I can help with forms, questions, or reports',
        'Try asking: "Help me fill a form"',
      ]);
    }
    // Clear suggestions otherwise
    else {
      setSuggestions([]);
    }
  }, [userMessage]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <div className="p-3">
        <p className="text-xs font-medium text-amber-900 mb-2">
          💡 You might want to:
        </p>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestion(suggestion)}
            className="w-full text-left px-3 py-2 text-sm text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
          >
            • {suggestion}
          </button>
        ))}
      </div>
    </Card>
  );
}

export default SmartLanguageDetection;
