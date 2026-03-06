/**
 * Ed Form Helper - Handler Functions
 *
 * Implementation of form-filling assistance with translation and privacy safeguards.
 */

import { openrouter } from "@/lib/ai-openrouter";
import type {
  FormField,
  DetectedForm,
  FormSession,
  FieldResponse,
} from "./form-helper";

// ============================================================================
// Constants
// ============================================================================

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "pl", name: "Polish" },
  { code: "ro", name: "Romanian" },
  { code: "ur", name: "Urdu" },
  { code: "pa", name: "Punjabi" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "ar", name: "Arabic" },
  { code: "so", name: "Somali" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "pt", name: "Portuguese" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lv", name: "Latvian" },
  { code: "ta", name: "Tamil" },
];

export const PRIVACY_NOTICE = `This form helper is provided by Schoolgle. We do not store any personal data you enter into forms. Your responses are processed in-memory only and discarded after your session ends. No form data is sent to any third party.`;

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang?.name || code;
}

// ============================================================================
// Configuration
// ============================================================================

const FORM_HELPER_CONFIG = {
  // Vision model for form detection (via OpenRouter)
  visionModel: "qwen/qwen-2.5-vl-72b-instruct",

  // Translation model
  translationModel: "google/gemini-2.0-flash-lite-001",

  // Maximum session time (seconds)
  maxSessionTime: 600, // 10 minutes

  // Maximum fields per form
  maxFields: 50,
};

// ============================================================================
// Form Detection
// ============================================================================

/**
 * Detect forms on a webpage using vision analysis
 */
export async function detectFormsOnPage(params: {
  pageUrl: string;
  screenshot?: string;
  pageContent?: string;
}): Promise<{
  forms: DetectedForm[];
  success: boolean;
  error?: string;
}> {
  try {
    const { pageUrl, screenshot, pageContent } = params;

    // Build analysis prompt
    const prompt = `Analyze this webpage and identify ALL forms. For each form, extract:

1. Form identifier (CSS selector or ID)
2. Form action/submit URL (if visible)
3. All form fields with:
   - Field identifier (id, name, or CSS selector)
   - Field type (text, email, tel, textarea, select, checkbox, radio)
   - Label text (the question/label shown to user)
   - Placeholder text (if any)
   - Whether it's required (look for required indicators)
   - Options (for select/radio: list all choices)

Return as JSON:
{
  "forms": [
    {
      "formId": "selector",
      "action": "url",
      "method": "POST",
      "fields": [
        {
          "id": "field-id",
          "name": "field-name",
          "type": "text|email|tel|textarea|select|checkbox|radio",
          "label": "Label text",
          "placeholder": "Placeholder text",
          "required": true/false,
          "options": ["Option 1", "Option 2"]
        }
      ]
    }
  ]
}

Page URL: ${pageUrl}
${screenshot ? `[Screenshot attached - analyze visual layout]` : ""}
${pageContent ? `\nPage HTML content:\n${pageContent.substring(0, 5000)}` : ""}`;

    // Use vision model if screenshot provided, otherwise use text model
    const model = screenshot
      ? FORM_HELPER_CONFIG.visionModel
      : FORM_HELPER_CONFIG.translationModel;

    const response = await openrouter.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a form detection specialist. Identify all forms and fields accurately. Return only valid JSON.",
        },
        {
          role: "user",
          content: screenshot
            ? [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: screenshot,
                  },
                },
              ]
            : prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Validate and structure the result
    const forms: DetectedForm[] = (result.forms || []).map((form: any) => ({
      formId: form.formId || "form-" + Math.random().toString(36).substring(7),
      action: form.action,
      method: form.method || "POST",
      fields: (form.fields || []).map((field: any) => ({
        id:
          field.id ||
          field.name ||
          "field-" + Math.random().toString(36).substring(7),
        name: field.name || field.id || "",
        type: field.type || "text",
        label: field.label || field.name || "",
        placeholder: field.placeholder || "",
        required: field.required || false,
        options: field.options || [],
      })),
      fieldCount: form.fields?.length || 0,
    }));

    return {
      forms,
      success: true,
    };
  } catch (error) {
    console.error("[FormHelper] Detection error:", error);
    return {
      forms: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Translation
// ============================================================================

/**
 * Translate text to or from English
 */
export async function translateText(params: {
  text: string;
  from: string; // ISO 639-1 code
  to: string; // ISO 639-1 code
  context?: string; // Additional context for better translation
}): Promise<{
  translated: string;
  original: string;
  detectedLanguage?: string;
}> {
  try {
    const { text, from, to, context } = params;

    // If same language, return as-is
    if (from === to) {
      return {
        translated: text,
        original: text,
      };
    }

    const languageNames: Record<string, string> = {
      en: "English",
      ur: "Urdu",
      pa: "Punjabi",
      bn: "Bengali",
      gu: "Gujarati",
      pl: "Polish",
      ro: "Romanian",
      ar: "Arabic",
      zh: "Chinese",
      hi: "Hindi",
      es: "Spanish",
      fr: "French",
      pt: "Portuguese",
    };

    const prompt = context
      ? `Translate the following text from ${languageNames[from] || from} to ${languageNames[to] || to}.\n\nContext: ${context}\n\nText to translate: "${text}"`
      : `Translate from ${languageNames[from] || from} to ${languageNames[to] || to}: "${text}"`;

    const response = await openrouter.chat.completions.create({
      model: FORM_HELPER_CONFIG.translationModel,
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Translate accurately while preserving meaning and tone. Return only the translated text, no explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const translated = response.choices[0].message.content?.trim() || text;

    return {
      translated,
      original: text,
    };
  } catch (error) {
    console.error("[FormHelper] Translation error:", error);
    // Fallback: return original text
    return {
      translated: params.text,
      original: params.text,
    };
  }
}

// ============================================================================
// Field Question Generation
// ============================================================================

/**
 * Generate a question for the user to collect a field value
 * Translates to user's language if needed
 */
export async function generateFieldQuestion(params: {
  field: FormField;
  userLanguage: string;
  fieldName?: string; // Optional custom name from form context
}): Promise<{
  question: string;
  questionEnglish: string; // For verification display
}> {
  try {
    const { field, userLanguage, fieldName } = params;

    const fieldLabel = fieldName || field.label;
    const fieldType = field.type;
    const isRequired = field.required;

    // Generate question in English first
    const englishPrompt = `Generate a natural, friendly question to ask someone to provide information for a form field.

Field details:
- Label: "${fieldLabel}"
- Type: ${fieldType}
- Required: ${isRequired ? "Yes" : "No"}

Generate a simple, conversational question. Keep it under 15 words.`;

    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.0-flash-lite-001",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful form assistant. Generate simple, conversational questions. Return only the question.",
        },
        {
          role: "user",
          content: englishPrompt,
        },
      ],
      temperature: 0.7,
    });

    const questionEnglish =
      response.choices[0].message.content?.trim() ||
      `What is your ${fieldLabel}?`;

    // If user's language is not English, translate
    if (userLanguage !== "en") {
      const translated = await translateText({
        text: questionEnglish,
        from: "en",
        to: userLanguage,
        context: `Form field: ${fieldLabel}`,
      });

      return {
        question: translated.translated,
        questionEnglish,
      };
    }

    return {
      question: questionEnglish,
      questionEnglish,
    };
  } catch (error) {
    console.error("[FormHelper] Question generation error:", error);
    // Fallback to basic question
    const fallbackQuestion = `What is your ${field.label || field.name}?`;
    return {
      question: fallbackQuestion,
      questionEnglish: fallbackQuestion,
    };
  }
}

// ============================================================================
// Response Verification
// ============================================================================

/**
 * Process and verify user's response
 * Detects language, translates if needed, extracts the actual value
 */
export async function processUserResponse(params: {
  userResponse: string;
  expectedLanguage: string; // What language we expect
  fieldLabel: string;
  fieldType: string;
}): Promise<{
  value: string; // The value to fill in the form
  originalText: string; // What user actually said
  detectedLanguage: string; // Language we detected
  confidence: number; // How confident we are (0-1)
  questionForUser: string; // Verification question
}> {
  try {
    const { userResponse, expectedLanguage, fieldLabel, fieldType } = params;

    // Detect language (simple heuristic)
    const detectedLanguage = detectLanguageSimple(userResponse);
    const needsTranslation =
      detectedLanguage !== "en" && expectedLanguage !== "en";

    let englishText = userResponse;
    let questionForUser = `I understood: "${userResponse}". Is this correct?`;

    if (needsTranslation) {
      // Translate to English
      const translated = await translateText({
        text: userResponse,
        from: detectedLanguage,
        to: "en",
        context: `Form field: ${fieldLabel} (${fieldType})`,
      });
      englishText = translated.translated;

      // Generate verification question in user's language
      const verifyPrompt = `Generate a verification question in ${detectedLanguage} asking if "${userResponse}" is correct. Keep it simple.`;
      const verifyResponse = await openrouter.chat.completions.create({
        model: FORM_HELPER_CONFIG.translationModel,
        messages: [
          {
            role: "user",
            content: verifyPrompt,
          },
        ],
        temperature: 0.3,
      });

      questionForUser =
        verifyResponse.choices[0].message.content?.trim() || questionForUser;
    }

    // Extract the actual value based on field type
    const extractedValue = extractValueForFieldType(englishText, fieldType);

    return {
      value: extractedValue,
      originalText: userResponse,
      detectedLanguage,
      confidence: 0.8,
      questionForUser,
    };
  } catch (error) {
    console.error("[FormHelper] Response processing error:", error);
    return {
      value: userResponse,
      originalText: userResponse,
      detectedLanguage: expectedLanguage,
      confidence: 0.5,
      questionForUser: `Is this correct: "${userResponse}"?`,
    };
  }
}

/**
 * Simple language detection (heuristic-based)
 * In production, use a proper language detection library
 */
function detectLanguageSimple(text: string): string {
  // Check for Urdu/Punjabi/Arabic scripts
  const urduPattern = /[\u0600-\u06FF]/;
  const chinesePattern = /[\u4E00-\u9FFF]/;
  const cyrillicPattern = /[\u0400-\u04FF]/;

  if (urduPattern.test(text)) {
    // Could be Urdu, Arabic, Persian, Punjabi (Shahmukhi)
    // Default to Urdu for Pakistan demographics
    return "ur";
  }
  if (chinesePattern.test(text)) {
    return "zh";
  }
  if (cyrillicPattern.test(text)) {
    return "pl"; // Assume Polish (common in UK schools)
  }

  // Check for common words
  const lowerText = text.toLowerCase();
  const languageMarkers: Record<string, string[]> = {
    ur: ["hai", "hai", "kya", "mera", "meri", "apka", "aap"],
    pa: ["haan", "ki", "da", "mainu"],
    bn: ["ami", "amar", "tumi"],
    gu: ["chhu", "mare"],
    pl: ["jestem", "proszę", "dziękuję"],
    ro: ["sunt", "mulțumesc", "vă rog"],
    es: ["sí", "gracias", "por favor"],
    fr: ["oui", "merci", "s'il vous plaît"],
  };

  for (const [lang, markers] of Object.entries(languageMarkers)) {
    if (markers.some((marker) => lowerText.includes(marker))) {
      return lang;
    }
  }

  return "en"; // Default to English
}

/**
 * Extract clean value based on field type
 */
function extractValueForFieldType(text: string, fieldType: string): string {
  // Clean up common verbal fillers
  let cleaned = text
    .replace(/^(my|the|a|an)\s+/i, "")
    .replace(/^(it is|it's|its)\s+/i, "")
    .replace(/^(i think|i believe|i guess)\s+/i, "")
    .trim();

  // Type-specific cleaning
  switch (fieldType) {
    case "tel":
    case "email":
      // Extract phone/email pattern
      if (fieldType === "tel") {
        const phoneMatch = cleaned.match(/[\d\s\-\+()]+/);
        if (phoneMatch) {
          return phoneMatch[0].replace(/[\s\-\(\)]/g, "");
        }
      }
      if (fieldType === "email") {
        const emailMatch = cleaned.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
          return emailMatch[0];
        }
      }
      return cleaned;

    case "checkbox":
      // Yes/No to boolean
      const yesMatch = cleaned.match(/^(yes|yeah|yep|haan|han|oui|tak)/i);
      return yesMatch ? "yes" : cleaned;

    default:
      return cleaned;
  }
}

// ============================================================================
// Session Management (Ephemeral - No Storage)
// ============================================================================

/**
 * Create a new form session (in-memory only)
 * Sessions are NOT persisted - lost on refresh (intentional for privacy)
 */
export function createFormSession(params: {
  organizationId: string;
  pageUrl: string;
  form: DetectedForm;
  userLanguage?: string;
}): FormSession {
  return {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    organizationId: params.organizationId,
    pageUrl: params.pageUrl,
    form: params.form,
    currentFieldIndex: 0,
    userLanguage: params.userLanguage || "en",
    responses: [],
    startedAt: new Date().toISOString(),
    status: "collecting",
  };
}

/**
 * Update session with a field response
 */
export function addFieldResponse(
  session: FormSession,
  response: FieldResponse,
): FormSession {
  return {
    ...session,
    responses: [...session.responses, response],
    currentFieldIndex: session.currentFieldIndex + 1,
  };
}

/**
 * Complete a session (mark as done, trigger cleanup)
 */
export function completeSession(session: FormSession): {
  success: boolean;
  fieldsFilled: number;
  totalFields: number;
} {
  // Log anonymous metrics only
  const { logFormHelperMetrics } = require("./form-helper");

  logFormHelperMetrics({
    organizationId: session.organizationId,
    formType: inferFormType(session.pageUrl, session.form),
    detectedLanguage: session.userLanguage,
    fieldCount: session.form.fieldCount,
    fieldsFilled: session.responses.filter((r) => r.userConfirmed).length,
    userCorrections: session.responses.filter((r) => !r.userConfirmed).length,
    completionTime: Math.floor(
      (Date.now() - new Date(session.startedAt).getTime()) / 1000,
    ),
    abandoned: false,
  });

  // Return summary (session data is discarded)
  return {
    success: true,
    fieldsFilled: session.responses.filter((r) => r.userConfirmed).length,
    totalFields: session.form.fieldCount,
  };
}

/**
 * Infer form type from URL and form content
 */
function inferFormType(pageUrl: string, form: DetectedForm): string {
  const urlLower = pageUrl.toLowerCase();

  if (
    urlLower.includes("safeguard") ||
    urlLower.includes("concern") ||
    urlLower.includes("report")
  ) {
    return "safeguarding";
  }
  if (
    urlLower.includes("admission") ||
    urlLower.includes("enrol") ||
    urlLower.includes("apply")
  ) {
    return "admissions";
  }
  if (
    urlLower.includes("meal") ||
    urlLower.includes("lunch") ||
    urlLower.includes("dinner")
  ) {
    return "free-school-meals";
  }
  if (urlLower.includes("attend") || urlLower.includes("absence")) {
    return "attendance";
  }
  if (urlLower.includes("contact")) {
    return "contact";
  }

  // Check form fields for clues
  const labels = form.fields.map((f) => f.label.toLowerCase()).join(" ");

  if (
    labels.includes("concern") ||
    labels.includes("worry") ||
    labels.includes("report")
  ) {
    return "safeguarding";
  }
  if (
    labels.includes("child") ||
    labels.includes("pupil") ||
    labels.includes("student")
  ) {
    return "admissions";
  }
  if (labels.includes("income") || labels.includes("benefit")) {
    return "free-school-meals";
  }

  return "general";
}

// ============================================================================
// Export all handlers
// ============================================================================

export const formHelperHandlers = {
  detectFormsOnPage,
  translateText,
  generateFieldQuestion,
  processUserResponse,
  createFormSession,
  addFieldResponse,
  completeSession,
};

// ============================================================================
// Correction & Edit Mode
// ============================================================================

/**
 * User's intent when asking to make a change
 */
export interface ChangeRequest {
  intent: "change" | "edit" | "modify" | "correct" | "go back";
  targetField?: {
    identifier: string; // "first field", "name field", "the email"
    index?: number; // Field index if specified
  };
  newValue?: string; // User might provide the new value immediately
}

/**
 * Parse user's request to identify which field they want to change
 * Handles natural language like "change the first field", "I need to fix the email"
 */
export async function parseChangeRequest(params: {
  userMessage: string;
  userLanguage: string;
  formFields: FormField[];
  currentFieldIndex: number;
  sessionResponses: FieldResponse[];
}): Promise<{
  intent: string;
  targetField?: FormField;
  targetIndex?: number;
  understoodChange: boolean;
  clarificationQuestion?: string;
}> {
  const {
    userMessage,
    userLanguage,
    formFields,
    currentFieldIndex,
    sessionResponses,
  } = params;

  const prompt = `Analyze this user message about changing a form field they already filled.

FORM FIELDS (${formFields.length} total):
${formFields.map((f, i) => `${i + 1}. ${f.label} (${f.type}) - ${sessionResponses[i]?.originalText || "[not filled]"}`).join("\n")}

CURRENT FIELD: ${currentFieldIndex + 1} (${formFields[currentFieldIndex]?.label})

USER MESSAGE: "${userMessage}"

Determine:
1. What is their intent? (change, edit, modify, correct, go back, continue)
2. Which field do they want to change? (field index or field name)
3. Did they provide a new value already?

Return JSON:
{
  "intent": "change|edit|modify|correct|go_back|continue",
  "targetFieldIndex": 0-3 (number, or null if unclear),
  "targetFieldName": "name|email|phone etc" (or null if unclear),
  "newValueProvided": "what they want to change it to" (or null),
  "clarificationNeeded": true/false (if unclear, what to ask)
}`;

  try {
    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.0-flash-lite-001",
      messages: [
        {
          role: "system",
          content:
            "You are a form assistant. Parse user intent precisely. Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Map to the actual field
    const targetIndex = result.targetFieldIndex ?? undefined;
    const targetField =
      targetIndex !== undefined ? formFields[targetIndex] : undefined;

    return {
      intent: result.intent,
      targetField,
      targetIndex,
      understoodChange:
        result.targetFieldIndex !== null || result.targetFieldName !== null,
      clarificationQuestion: result.clarificationNeeded
        ? generateClarification(result, userLanguage)
        : undefined,
    };
  } catch (error) {
    console.error("[FormHelper] Parse change request error:", error);

    // Fallback: simple keyword matching
    return parseChangeRequestFallback(
      userMessage,
      formFields,
      currentFieldIndex,
    );
  }
}

/**
 * Generate clarification question in user's language
 */
function generateClarification(result: any, userLanguage: string): string {
  if (userLanguage === "ur") {
    return "Kis field ko change karna chahte hain? / Which field do you want to change?";
  }
  if (userLanguage === "pa") {
    return "Kehun field change karna? / Which field?";
  }
  return "Which field would you like to change?";
}

/**
 * Fallback: Simple pattern matching for change requests
 */
function parseChangeRequestFallback(
  userMessage: string,
  formFields: FormField[],
  currentFieldIndex: number,
): {
  intent: string;
  targetField?: FormField;
  targetIndex?: number;
  understoodChange: boolean;
  clarificationQuestion?: string;
} {
  const lower = userMessage.toLowerCase();

  // Check for "go back" or "previous"
  if (
    lower.includes("go back") ||
    lower.includes("previous") ||
    lower.includes("last one")
  ) {
    const prevIndex = Math.max(0, currentFieldIndex - 1);
    return {
      intent: "go_back",
      targetField: formFields[prevIndex],
      targetIndex: prevIndex,
      understoodChange: true,
    };
  }

  // Check for field names in user's message
  for (let i = 0; i < formFields.length; i++) {
    const field = formFields[i];
    const labelLower = field.label.toLowerCase();

    // Check if field label is mentioned
    if (
      lower.includes(labelLower) ||
      (field.name && lower.includes(field.name.toLowerCase()))
    ) {
      return {
        intent: "change",
        targetField: field,
        targetIndex: i,
        understoodChange: true,
      };
    }

    // Check for ordinal numbers
    if (lower.includes("first field") && i === 0) {
      return {
        intent: "change",
        targetField: formFields[0],
        targetIndex: 0,
        understoodChange: true,
      };
    }
    if (lower.includes("second field") && i === 1) {
      return {
        intent: "change",
        targetField: formFields[1],
        targetIndex: 1,
        understoodChange: true,
      };
    }
    if (lower.includes("third field") && i === 2) {
      return {
        intent: "change",
        targetField: formFields[2],
        targetIndex: 2,
        understoodChange: true,
      };
    }
  }

  return {
    intent: "unclear",
    clarificationQuestion: "Which field would you like to change?",
  };
}

/**
 * Update a previously filled field
 */
export function updateFieldResponse(
  session: FormSession,
  fieldIndex: number,
  newValue: FieldResponse,
): FormSession {
  const newResponses = [...session.responses];
  newResponses[fieldIndex] = newValue;

  return {
    ...session,
    responses: newResponses,
  };
}

/**
 * Get field summary for change confirmation
 */
export function getFieldSummary(
  field: FormField,
  currentValue: string | undefined,
): {
  label: string;
  currentValue: string;
  type: string;
} {
  return {
    label: field.label,
    currentValue: currentValue || "[empty]",
    type: field.type,
  };
}

/**
 * Generate confirmation message for field change
 */
export async function generateChangeConfirmation(params: {
  field: FormField;
  oldValue: string;
  newValue: string;
  userLanguage: string;
}): Promise<{
  message: string;
  messageEnglish: string;
}> {
  const { field, oldValue, newValue, userLanguage } = params;

  const english = `The ${field.label} field currently has "${oldValue}". I'll change it to "${newValue}". Is that correct?`;

  if (userLanguage === "en") {
    return { message: english, messageEnglish: english };
  }

  // Translate confirmation to user's language
  const translated = await translateText({
    text: english,
    from: "en",
    to: userLanguage,
    context: `Field: ${field.label}, old: ${oldValue}, new: ${newValue}`,
  });

  return {
    message: translated.translated,
    messageEnglish: english,
  };
}
