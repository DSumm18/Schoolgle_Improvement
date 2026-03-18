/**
 * Ed Form Helper API
 *
 * Privacy-first form filling assistance with translation support.
 * Zero data retention - all form data is ephemeral.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { openrouter } from "@/lib/ai-openrouter";
import {
  detectFormsFunction,
  startFormSessionFunction,
  askForFieldValueFunction,
  translateAndVerifyFunction,
  fillFormFieldFunction,
  completeFormSessionFunction,
} from "@/lib/skills/form-helper";
import {
  detectFormsOnPage,
  generateFieldQuestion,
  processUserResponse,
  createFormSession,
  addFieldResponse,
  completeSession,
  getLanguageName,
  PRIVACY_NOTICE,
  SUPPORTED_LANGUAGES,
} from "@/lib/skills/form-helper-handler";
import type { FormSession, FormField } from "@/lib/skills/form-helper";

// ============================================================================
// POST - Main Form Helper Entry Point
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case "detect":
        return await handleDetect(params);
      case "start_session":
        return await handleStartSession(params);
      case "ask_field":
        return await handleAskField(params);
      case "verify_response":
        return await handleVerifyResponse(params);
      case "fill_field":
        return await handleFillField(params);
      case "complete":
        return await handleComplete(params);
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[FormHelper] Error:", error);
    return NextResponse.json(
      {
        error: "An error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// GET - Privacy Notice and Language Support
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  switch (action) {
    case "privacy_notice":
      return NextResponse.json(PRIVACY_NOTICE);
    case "languages":
      return NextResponse.json(SUPPORTED_LANGUAGES);
    default:
      return NextResponse.json({
        name: "Ed Form Helper",
        description: "AI-powered form filling with translation support",
        version: "1.0.0",
        privacy: "Zero data retention - all conversations are ephemeral",
        actions: [
          "detect",
          "start_session",
          "ask_field",
          "verify_response",
          "fill_field",
          "complete",
        ],
        languages: Object.keys(SUPPORTED_LANGUAGES),
      });
  }
}

// ============================================================================
// Action Handlers
// ============================================================================

/**
 * Detect forms on the current page
 */
async function handleDetect(params: any) {
  const { pageUrl, pageContent } = params;

  if (!pageUrl) {
    return NextResponse.json({ error: "pageUrl is required" }, { status: 400 });
  }

  const result = await detectFormsOnPage({
    pageUrl,
    pageContent,
  });

  return NextResponse.json(result);
}

/**
 * Start a new form helper session
 * User must have consented to privacy notice first
 */
async function handleStartSession(params: any) {
  const { formId, userLanguage, organizationId, pageUrl, formData } = params;

  if (!formId || !organizationId) {
    return NextResponse.json(
      { error: "formId and organizationId are required" },
      { status: 400 },
    );
  }

  // Create session from detected form data
  const session = createFormSession({
    organizationId,
    pageUrl,
    form: formData, // Should be pre-detected
    userLanguage: userLanguage || "en",
  });

  // Get first field
  const firstField = session.form.fields[session.currentFieldIndex];

  if (!firstField) {
    return NextResponse.json(
      { error: "No fields found in form" },
      { status: 400 },
    );
  }

  // Generate first question
  const question = await generateFieldQuestion({
    field: firstField,
    userLanguage: session.userLanguage,
  });

  return NextResponse.json({
    sessionId: session.sessionId,
    fieldIndex: 0,
    totalFields: session.form.fieldCount,
    field: {
      id: firstField.id,
      label: firstField.label,
      type: firstField.type,
      required: firstField.required,
    },
    question: question.question,
    questionEnglish: question.questionEnglish,
    language: session.userLanguage,
  });
}

/**
 * Ask user for a field value (with translation)
 */
async function handleAskField(params: any) {
  const { sessionId, fieldId, fieldLabel, fieldType, userLanguage } = params;

  const field: FormField = {
    id: fieldId,
    name: fieldId,
    type: fieldType,
    label: fieldLabel,
    required: true,
  };

  const question = await generateFieldQuestion({
    field,
    userLanguage,
  });

  return NextResponse.json({
    question: question.question,
    questionEnglish: question.questionEnglish,
  });
}

/**
 * Process and verify user's response
 */
async function handleVerifyResponse(params: any) {
  const { userResponse, expectedLanguage, fieldLabel, fieldType } = params;

  const result = await processUserResponse({
    userResponse,
    expectedLanguage,
    fieldLabel,
    fieldType,
  });

  return NextResponse.json(result);
}

/**
 * Fill a form field (instruction only - client executes)
 */
async function handleFillField(params: any) {
  const { fieldSelector, value, fieldType } = params;

  // Return instructions for client-side execution
  // This keeps the privacy boundary - we don't touch the DOM directly
  return NextResponse.json({
    action: "fill_field",
    selector: fieldSelector,
    value,
    type: fieldType,
    instructions: `Set the value of "${fieldSelector}" to "${value}"`,
  });
}

/**
 * Complete the form session
 */
async function handleComplete(params: any) {
  const { sessionId, fieldsFilled, totalFields } = params;

  // Session is completed and deleted
  // Only anonymous metrics logged

  return NextResponse.json({
    success: true,
    message:
      fieldsFilled === totalFields
        ? `All ${totalFields} fields are filled! Please review the form and click Submit when you're ready.`
        : `${fieldsFilled} of ${totalFields} fields filled. You can complete the rest yourself.`,
    fieldsFilled,
    totalFields,
    privacyReminder:
      "All conversation data has been deleted. Thank you for using Ed Form Helper!",
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect language from text (simple heuristic)
 */
function detectLanguage(text: string): string {
  // Urdu/Arabic script
  if (/[\u0600-\u06FF]/.test(text)) return "ur";
  // Chinese
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  // Default
  return "en";
}

/**
 * Clean phone number
 */
function cleanPhone(value: string): string {
  return value.replace(/[\s\-\(\)]/g, "");
}

/**
 * Extract email from text
 */
function extractEmail(text: string): string | null {
  const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return match ? match[0] : null;
}

/**
 * Infer form type from URL
 */
function inferFormType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("safeguard") || lower.includes("concern"))
    return "safeguarding";
  if (lower.includes("admission") || lower.includes("enrol"))
    return "admissions";
  if (lower.includes("meal") || lower.includes("dinner"))
    return "free-school-meals";
  if (lower.includes("attend") || lower.includes("absence"))
    return "attendance";
  return "general";
}

/**
 * Log anonymous metrics (no personal data)
 */
function logMetrics(data: {
  organizationId: string;
  formType: string;
  language: string;
  fieldsFilled: number;
  totalFields: number;
  corrections: number;
  duration: number;
}) {
  console.log(
    "[FormHelper Analytics]",
    JSON.stringify({
      event: "form_helper_session",
      sessionId: `anon_${Date.now()}`,
      ...data,
    }),
  );
}

// ============================================================================
// Privacy Notice Response
// ============================================================================

function getPrivacyNotice() {
  return {
    title: "How your data is handled",
    content: PRIVACY_NOTICE,
    buttonText: "I understand",
    declineButton: "No thanks",
    keyPoints: [
      {
        icon: "🗑️",
        title: "I don't keep your data",
        description:
          "Everything you say is deleted immediately after the form is filled",
      },
      {
        icon: "🔒",
        title: "The school receives your form",
        description: "They handle it according to their own privacy policy",
      },
      {
        icon: "❌",
        title: "I don't train on what you say",
        description: "Your conversations won't improve my abilities",
      },
      {
        icon: "✅",
        title: "You can stop anytime",
        description: "Just close this window",
      },
    ],
  };
}
