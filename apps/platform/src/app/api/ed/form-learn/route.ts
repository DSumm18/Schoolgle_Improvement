// Ed Form Learning API
// Ed learns form structure by observing users fill forms

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/ed/form-learn
 * Save a learned form structure
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, form_name, form_structure, session_quality } = body;

    if (!url || !form_name || !form_structure) {
      return NextResponse.json(
        { error: 'url, form_name, and form_structure are required' },
        { status: 400 }
      );
    }

    // Validate no personal data in form_structure
    const cleanStructure = sanitizeFormStructure(form_structure);

    // Upsert the learned form
    const { data: formId, error } = await supabase.rpc('upsert_learned_form', {
      p_url: url,
      p_form_name: form_name,
      p_form_structure: cleanStructure,
      p_session_quality: session_quality || 50,
    });

    if (error) {
      console.error('[Form Learn API] Error upserting form:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record the learning session
    const { data: session } = await supabase
      .from('ed_learning_sessions')
      .insert({
        form_id: formId,
        user_id: user.id,
        completed_at: new Date().toISOString(),
        fields_observed: form_structure.fields?.length || 0,
        session_quality: session_quality || 50,
        completeness_score: calculateCompleteness(cleanStructure),
        user_agent: request.headers.get('user-agent'),
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      form_id: formId,
      session_id: session?.id,
      message: 'Form structure saved. Thank you for teaching Ed!',
    });
  } catch (error) {
    console.error('[Form Learn API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ed/form-learn
 * List learned forms
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: forms, error } = await supabase
      .from('ed_learned_forms')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      forms: forms || [],
      count: forms?.length || 0,
    });
  } catch (error) {
    console.error('[Form Learn API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Remove any potential personal data from form structure
 */
function sanitizeFormStructure(structure: any): any {
  const clean = { ...structure };

  // Ensure no actual values in fields
  if (clean.fields && Array.isArray(clean.fields)) {
    clean.fields = clean.fields.map((field: any) => ({
      selector: field.selector,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      options: field.options,
      semantic_meaning: field.semantic_meaning,
      data_source: field.data_source,
      help_text: field.help_text,
      validation: field.validation,
      // Explicitly remove any 'value' property
      value: undefined,
    }));
  }

  return clean;
}

/**
 * Calculate completeness score (0-100)
 */
function calculateCompleteness(structure: any): number {
  if (!structure.fields || !Array.isArray(structure.fields)) {
    return 0;
  }

  const fields = structure.fields;
  let score = 0;

  // Base score for having fields
  score += Math.min(50, fields.length * 5);

  // Bonus for semantic meanings
  const withMeaning = fields.filter((f: any) => f.semantic_meaning).length;
  score += (withMeaning / fields.length) * 30;

  // Bonus for validation rules
  const withValidation = fields.filter((f: any) => f.validation).length;
  score += (withValidation / fields.length) * 20;

  return Math.min(100, Math.round(score));
}
