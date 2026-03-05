// Ed Form Field Annotations API
// Users provide explanations for what fields mean

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/ed/form-learn/annotate
 * Record a user's explanation of what a field is for
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { form_id, field_selector, semantic_meaning, data_source, help_text } = body;

    if (!form_id || !field_selector || !semantic_meaning) {
      return NextResponse.json(
        { error: 'form_id, field_selector, and semantic_meaning are required' },
        { status: 400 }
      );
    }

    // Record the annotation
    const { data: annotationId, error } = await supabase.rpc('record_field_annotation', {
      p_form_id: form_id,
      p_field_selector: field_selector,
      p_semantic_meaning: semantic_meaning,
      p_data_source: data_source,
      p_help_text: help_text,
      p_user_id: user.id,
    });

    if (error) {
      console.error('[Form Annotate API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      annotation_id: annotationId,
      message: 'Thank you! Ed now understands this field better.',
    });
  } catch (error) {
    console.error('[Form Annotate API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ed/form-learn/annotate
 * Get annotations for a form
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('form_id');

    if (!formId) {
      return NextResponse.json(
        { error: 'form_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: annotations, error } = await supabase
      .from('ed_field_annotations')
      .select('*')
      .eq('form_id', formId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      annotations: annotations || [],
      count: annotations?.length || 0,
    });
  } catch (error) {
    console.error('[Form Annotate API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
