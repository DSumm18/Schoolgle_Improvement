/**
 * Ed Form Helper - Skill Definition
 *
 * Helps users fill out school forms with voice input and translation support.
 * Privacy-first: Zero data retention, ephemeral processing.
 */

import { z } from 'zod';

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Form field detected on the page
 */
export const FormFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio']),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For select/radio
  value: z.string().optional(),
});

export type FormField = z.infer<typeof FormFieldSchema>;

/**
 * Detected form on the page
 */
export const DetectedFormSchema = z.object({
  formId: z.string(),
  action: z.string().optional(), // Form submit URL
  method: z.enum(['GET', 'POST']).default('POST'),
  fields: z.array(FormFieldSchema),
  fieldCount: z.number(),
});

export type DetectedForm = z.infer<typeof DetectedFormSchema>;

/**
 * User's response to a field question
 */
export const FieldResponseSchema = z.object({
  fieldId: z.string(),
  originalText: z.string(), // What user said (in their language)
  translatedText: z.string(), // English translation
  userConfirmed: z.boolean(),
  language: z.string(), // ISO 639-1 code (e.g., 'ur', 'en')
});

export type FieldResponse = z.infer<typeof FieldResponseSchema>;

/**
 * Form helper session state
 */
export const FormSessionSchema = z.object({
  sessionId: z.string(),
  organizationId: z.string(),
  pageUrl: z.string(),
  form: DetectedFormSchema,
  currentFieldIndex: z.number(),
  userLanguage: z.string().default('en'),
  responses: z.array(FieldResponseSchema),
  startedAt: z.string(),
  status: z.enum(['detecting', 'consent', 'collecting', 'filling', 'completed', 'abandoned']),
});

export type FormSession = z.infer<typeof FormSessionSchema>;

// ============================================================================
// Function Schemas for AI Skill
// ============================================================================

/**
 * Detect forms on the current page
 */
export const detectFormsFunction = {
  name: 'detect_forms',
  description: 'Detect and analyze all forms on the current webpage. Returns form structure including field types, labels, and requirements.',
  parameters: z.object({
    pageUrl: z.string().describe('The URL of the page to scan for forms'),
    screenshot: z.string().optional().describe('Base64 screenshot of the page (optional, for better detection)'),
  }),
};

/**
 * Start a form helper session
 */
export const startFormSessionFunction = {
  name: 'start_form_session',
  description: 'Initialize a form-filling session. Must get user consent first with privacy notice.',
  parameters: z.object({
    formId: z.string().describe('The ID of the form to help fill'),
    userLanguage: z.string().optional().describe("User's preferred language code (e.g., 'ur' for Urdu, 'en' for English)"),
  }),
};

/**
 * Ask user for a field value (with translation)
 */
export const askForFieldValueFunction = {
  name: 'ask_for_field_value',
  description: 'Ask the user to provide a value for a specific form field. Translates the question to the user\'s language if needed.',
  parameters: z.object({
    fieldLabel: z.string().describe('The label/text of the form field'),
    fieldType: z.string().describe('The type of input expected (text, email, phone, etc.)'),
    userLanguage: z.string().describe('User\'s language code for translation'),
    fieldHint: z.string().optional().describe('Additional context about what information is needed'),
  }),
};

/**
 * Translate and verify user's response
 */
export const translateAndVerifyFunction = {
  name: 'translate_and_verify',
  description: 'Translate user\'s response to English and verify it matches what they intended. Returns both original and translated text.',
  parameters: z.object({
    userResponse: z.string().describe('What the user said (in their language)'),
    userLanguage: z.string().describe('The language code of user\'s response'),
    fieldLabel: z.string().describe('The form field this response is for'),
  }),
};

/**
 * Fill a form field on the page
 */
export const fillFormFieldFunction = {
  name: 'fill_form_field',
  description: 'Fill a specific form field with the provided value. Returns success status.',
  parameters: z.object({
    fieldSelector: z.string().describe('CSS selector or field identifier'),
    value: z.string().describe('The value to fill in the field'),
    fieldType: z.string().describe('The type of field (text, email, tel, select, checkbox)'),
  }),
};

/**
 * Complete the form helper session
 */
export const completeFormSessionFunction = {
  name: 'complete_form_session',
  description: 'Mark the form session as complete. All temporary data is deleted. User reviews and submits the form themselves.',
  parameters: z.object({
    sessionId: z.string().describe('The form session ID to complete'),
    fieldsFilled: z.number().describe('How many fields were successfully filled'),
    totalFields: z.number().describe('Total number of fields in the form'),
  }),
};

// ============================================================================
// Privacy & Analytics (Anonymous Only)
// ============================================================================

/**
 * Anonymous analytics for form helper performance
 * NO PERSONAL DATA is logged
 */
export interface FormHelperAnalytics {
  sessionId: string; // Anonymous session ID (hash of timestamp + random)
  organizationId: string;
  formType: string; // 'safeguarding', 'admissions', etc.
  detectedLanguage: string; // ISO 639-1 code
  fieldCount: number;
  fieldsFilled: number;
  userCorrections: number; // How many times user corrected Ed
  completionTime: number; // Seconds
  abandoned: boolean;
  timestamp: string;
}

/**
 * Log anonymous performance metrics
 */
export function logFormHelperMetrics(metrics: Omit<FormHelperAnalytics, 'sessionId' | 'timestamp'>): void {
  const anonymousSessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const analytics: FormHelperAnalytics = {
    ...metrics,
    sessionId: anonymousSessionId,
    timestamp: new Date().toISOString(),
  };

  // Only log to analytics system, never to chat history or training data
  console.log('[FormHelper Analytics]', JSON.stringify({
    event: 'form_helper_session',
    ...analytics,
  }));

  // In production, send to your analytics platform (e.g., Plausible, PostHog)
  // Ensure analytics platform is configured to NOT use data for training
}

// ============================================================================
// Language Support
// ============================================================================

/**
 * Supported languages for form helper
 * Maps ISO 639-1 codes to language names (native and English)
 */
export const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', nativeName: 'English' },
  'ur': { name: 'Urdu', nativeName: 'اردو' },
  'pa': { name: 'Punjabi', nativeName: 'ਪੰੰਜਾਬੀ' },
  'bn': { name: 'Bengali', nativeName: 'বাংলা' },
  'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી' },
  'pl': { name: 'Polish', nativeName: 'Polski' },
  'ro': { name: 'Romanian', nativeName: 'Română' },
  'ar': { name: 'Arabic', nativeName: 'العربية' },
  'zh': { name: 'Chinese', nativeName: '中文' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी' },
  'es': { name: 'Spanish', nativeName: 'Español' },
  'fr': { name: 'French', nativeName: 'Français' },
  'pt': { name: 'Portuguese', nativeName: 'Português' },
  'lt': { name: 'Lithuanian', nativeName: 'Lietuvių' },
  'sk': { name: 'Slovak', nativeName: 'Slovenčina' },
  'tr': { name: 'Turkish', nativeName: 'Türkçe' },
  // Add more as needed
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Get language name in both English and native script
 */
export function getLanguageName(code: string): { english: string; native: string } {
  const lang = SUPPORTED_LANGUAGES[code as SupportedLanguage];
  if (!lang) {
    return { english: 'Unknown', native: code };
  }
  return {
    english: lang.name,
    native: lang.nativeName,
  };
}

// ============================================================================
// Privacy Notice Text
// ============================================================================

export const PRIVACY_NOTICE = {
  title: "How your data is handled",
  content: `I can help you fill out this form. Here's how your data is handled:

🗑️ **I don't keep your data** - everything you say is deleted immediately after the form is filled

🔒 **The school receives your form** - they handle it according to their own privacy policy

❌ **I don't train on what you say** - your conversations won't improve my abilities

✅ **You can stop anytime** - just close this window

By continuing, you agree that I will process your responses to fill the form, but I won't store any of your information.`,
  agreeButton: "I understand, let's start",
  declineButton: "Cancel",
};

// ============================================================================
// Export all schemas
// ============================================================================

export const formHelperSchemas = {
  FormField: FormFieldSchema,
  DetectedForm: DetectedFormSchema,
  FieldResponse: FieldResponseSchema,
  FormSession: FormSessionSchema,
};

export const formHelperFunctions = {
  detectForms: detectFormsFunction,
  startFormSession: startFormSessionFunction,
  askForFieldValue: askForFieldValueFunction,
  translateAndVerify: translateAndVerifyFunction,
  fillFormField: fillFormFieldFunction,
  completeFormSession: completeFormSessionFunction,
};
