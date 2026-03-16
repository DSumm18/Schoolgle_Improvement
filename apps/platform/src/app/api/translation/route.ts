/**
 * Translation API
 *
 * Provides endpoints for translation and language preferences:
 * - GET /api/translation?action=languages - Get supported languages
 * - GET /api/translation?action=preferences - Get user's language preferences
 * - POST /api/translation (action: detect) - Detect language from text
 * - POST /api/translation (action: translate) - Translate text
 * - POST /api/translation (action: translateFields) - Translate form field labels
 * - POST /api/translation (action: updatePreferences) - Update user's language preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  getTranslationService,
  SUPPORTED_LANGUAGES,
} from "@/lib/translation-service";
import type { LanguageCode } from "@/lib/translation-service";

// ============================================================================
// TYPES
// ============================================================================

interface TranslateRequest {
  text: string;
  sourceLanguage?: LanguageCode;
  targetLanguage: LanguageCode;
  context?: string;
}

interface TranslateFieldsRequest {
  fields: Array<{
    ref: string;
    name: string;
    type?: string;
    placeholder?: string;
  }>;
  targetLanguage: LanguageCode;
  formType?: string;
}

interface UpdatePreferencesRequest {
  preferredLanguage?: LanguageCode;
  secondaryLanguage?: LanguageCode;
  autoTranslate?: boolean;
  showSideBySide?: boolean;
  fontSize?: "small" | "medium" | "large";
}

// ============================================================================
// GET HANDLER
// ============================================================================

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  switch (action) {
    case "languages":
      return apiSuccess({ languages: Object.values(SUPPORTED_LANGUAGES) });

    case "preferences":
      return handleGetPreferences(auth.userId);

    default:
      return apiError(
        "Invalid Action. Specify action=languages or action=preferences",
        400,
      );
  }
});

/**
 * Get user's language preferences
 */
async function handleGetPreferences(userId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("user_language_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return apiError(error.message, 500);
  }

  // Return default preferences if none set
  if (!data) {
    return apiSuccess({
      preferredLanguage: "en",
      secondaryLanguage: null,
      autoTranslate: true,
      showSideBySide: true,
      fontSize: "medium",
    });
  }

  return apiSuccess(data);
}

// ============================================================================
// POST HANDLER
// ============================================================================

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "detect":
      return handleDetect(body);

    case "translate":
      return handleTranslate(body);

    case "translateFields":
      return handleTranslateFields(body);

    case "updatePreferences":
      return handleUpdatePreferences(body, auth.userId);

    default:
      return apiError(`Unknown action: ${action}`, 400);
  }
});

/**
 * Detect language from text
 */
async function handleDetect(body: { text: string }) {
  const { text } = body;

  if (!text) {
    return apiError("Text is required", 400);
  }

  const translationService = getTranslationService();
  const detectedLanguage = await translationService.detectLanguage(text);

  const language = SUPPORTED_LANGUAGES[detectedLanguage];

  return apiSuccess({
    language: detectedLanguage,
    languageName: language?.name,
    nativeName: language?.nativeName,
    direction: language?.direction,
  });
}

/**
 * Translate text
 */
async function handleTranslate(body: TranslateRequest) {
  const { text, sourceLanguage, targetLanguage, context } = body;

  if (!text || !targetLanguage) {
    return apiError("Text and targetLanguage are required", 400);
  }

  const translationService = getTranslationService();

  // Auto-detect source language if not provided
  let sourceLang = sourceLanguage;
  if (!sourceLang) {
    sourceLang = await translationService.detectLanguage(text);
  }

  const result = await translationService.translate(
    text,
    sourceLang,
    targetLanguage,
    context,
  );

  return apiSuccess(result);
}

/**
 * Translate form field labels
 */
async function handleTranslateFields(body: TranslateFieldsRequest) {
  const { fields, targetLanguage, formType } = body;

  if (!fields || !targetLanguage) {
    return apiError("Fields and targetLanguage are required", 400);
  }

  const translationService = getTranslationService();
  const translatedFields = await translationService.translateFieldLabels(
    fields as any,
    targetLanguage,
    formType,
  );

  return apiSuccess({
    translatedFields,
    sourceLanguage: "en",
    targetLanguage,
  });
}

/**
 * Update user language preferences
 */
async function handleUpdatePreferences(
  body: UpdatePreferencesRequest,
  userId: string,
) {
  const supabase = createServiceRoleClient();

  // Check if preferences exist
  const { data: existing } = await supabase
    .from("user_language_preferences")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let result;

  if (existing) {
    // Update existing preferences
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.preferredLanguage !== undefined)
      updateData.preferred_language = body.preferredLanguage;
    if (body.secondaryLanguage !== undefined)
      updateData.secondary_language = body.secondaryLanguage;
    if (body.autoTranslate !== undefined)
      updateData.auto_translate = body.autoTranslate;
    if (body.showSideBySide !== undefined)
      updateData.show_side_by_side = body.showSideBySide;
    if (body.fontSize !== undefined) updateData.font_size = body.fontSize;

    result = await supabase
      .from("user_language_preferences")
      .update(updateData)
      .eq("user_id", userId);
  } else {
    // Create new preferences
    const insertData: any = {
      user_id: userId,
    };

    if (body.preferredLanguage !== undefined)
      insertData.preferred_language = body.preferredLanguage;
    if (body.secondaryLanguage !== undefined)
      insertData.secondary_language = body.secondaryLanguage;
    if (body.autoTranslate !== undefined)
      insertData.auto_translate = body.autoTranslate;
    if (body.showSideBySide !== undefined)
      insertData.show_side_by_side = body.showSideBySide;
    if (body.fontSize !== undefined) insertData.font_size = body.fontSize;

    result = await supabase
      .from("user_language_preferences")
      .insert(insertData);
  }

  if (result.error) {
    return apiError(result.error.message, 500);
  }

  // Fetch and return updated preferences
  const { data: preferences } = await supabase
    .from("user_language_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  return apiSuccess({
    success: true,
    preferences,
  });
}
