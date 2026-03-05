/**
 * Translation API
 *
 * Provides endpoints for translation and language preferences:
 * - GET /api/translation/languages - Get supported languages
 * - GET /api/translation/detect - Detect language from text
 * - POST /api/translation/translate - Translate text
 * - GET /api/translation/preferences - Get user's language preferences
 * - POST /api/translation/preferences - Update user's language preferences
 * - POST /api/translation/fields - Translate form field labels
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getTranslationService, SUPPORTED_LANGUAGES } from '@/lib/translation-service';
import type { LanguageCode } from '@/lib/translation-service';

// ============================================================================
// TYPES
// ============================================================================

interface DetectRequest {
  text: string;
}

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
  fontSize?: 'small' | 'medium' | 'large';
}

// ============================================================================
// GET HANDLER
// ============================================================================

/**
 * GET /api/translation
 *
 * Get supported languages or user preferences
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'languages':
        return handleGetLanguages();

      case 'preferences':
        return handleGetPreferences(user?.id);

      default:
        return NextResponse.json(
          { error: 'Invalid Action', message: 'Specify action=languages or action=preferences' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Translation API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Get supported languages
 */
async function handleGetLanguages() {
  const languages = Object.values(SUPPORTED_LANGUAGES);
  return NextResponse.json({ languages });
}

/**
 * Get user's language preferences
 */
async function handleGetPreferences(userId: string | undefined) {
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('user_language_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'Database Error', message: error.message },
      { status: 500 }
    );
  }

  // Return default preferences if none set
  if (!data) {
    return NextResponse.json({
      preferredLanguage: 'en',
      secondaryLanguage: null,
      autoTranslate: true,
      showSideBySide: true,
      fontSize: 'medium',
    });
  }

  return NextResponse.json(data);
}

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * POST /api/translation
 *
 * Handle translation operations
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await createServerSupabaseClient();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'detect':
        return handleDetect(body);

      case 'translate':
        return handleTranslate(body);

      case 'translateFields':
        return handleTranslateFields(body);

      case 'updatePreferences':
        return handleUpdatePreferences(body, user?.id);

      default:
        return NextResponse.json(
          { error: 'Invalid Action', message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Translation API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Detect language from text
 */
async function handleDetect(body: DetectRequest) {
  const { text } = body;

  if (!text) {
    return NextResponse.json(
      { error: 'Invalid Input', message: 'Text is required' },
      { status: 400 }
    );
  }

  const translationService = getTranslationService();
  const detectedLanguage = await translationService.detectLanguage(text);

  const language = SUPPORTED_LANGUAGES[detectedLanguage];

  return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Invalid Input', message: 'Text and targetLanguage are required' },
      { status: 400 }
    );
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
    context
  );

  return NextResponse.json(result);
}

/**
 * Translate form field labels
 */
async function handleTranslateFields(body: TranslateFieldsRequest) {
  const { fields, targetLanguage, formType } = body;

  if (!fields || !targetLanguage) {
    return NextResponse.json(
      { error: 'Invalid Input', message: 'Fields and targetLanguage are required' },
      { status: 400 }
    );
  }

  const translationService = getTranslationService();
  const translatedFields = await translationService.translateFieldLabels(
    fields,
    targetLanguage,
    formType
  );

  return NextResponse.json({
    translatedFields,
    sourceLanguage: 'en',
    targetLanguage,
  });
}

/**
 * Update user language preferences
 */
async function handleUpdatePreferences(body: UpdatePreferencesRequest, userId: string | undefined) {
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Check if preferences exist
  const { data: existing } = await supabase
    .from('user_language_preferences')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  let result;

  if (existing) {
    // Update existing preferences
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.preferredLanguage !== undefined) updateData.preferred_language = body.preferredLanguage;
    if (body.secondaryLanguage !== undefined) updateData.secondary_language = body.secondaryLanguage;
    if (body.autoTranslate !== undefined) updateData.auto_translate = body.autoTranslate;
    if (body.showSideBySide !== undefined) updateData.show_side_by_side = body.showSideBySide;
    if (body.fontSize !== undefined) updateData.font_size = body.fontSize;

    result = await supabase
      .from('user_language_preferences')
      .update(updateData)
      .eq('user_id', userId);
  } else {
    // Create new preferences
    const insertData: any = {
      user_id: userId,
    };

    if (body.preferredLanguage !== undefined) insertData.preferred_language = body.preferredLanguage;
    if (body.secondaryLanguage !== undefined) insertData.secondary_language = body.secondaryLanguage;
    if (body.autoTranslate !== undefined) insertData.auto_translate = body.autoTranslate;
    if (body.showSideBySide !== undefined) insertData.show_side_by_side = body.showSideBySide;
    if (body.fontSize !== undefined) insertData.font_size = body.fontSize;

    result = await supabase
      .from('user_language_preferences')
      .insert(insertData);
  }

  if (result.error) {
    return NextResponse.json(
      { error: 'Database Error', message: result.error.message },
      { status: 500 }
    );
  }

  // Fetch and return updated preferences
  const { data: preferences } = await supabase
    .from('user_language_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  return NextResponse.json({
    success: true,
    preferences,
  });
}
