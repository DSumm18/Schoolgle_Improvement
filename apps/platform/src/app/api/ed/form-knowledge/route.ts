// Ed Form Knowledge API
// Field-level guidance, explanations, and suggested wording from database

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/ed/form-knowledge
 * Get field knowledge for a form template
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('template_id');
    const fieldKey = searchParams.get('field_key');
    const orgId = searchParams.get('org_id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'template_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // If fieldKey is provided, get specific field knowledge
    if (fieldKey) {
      const { data, error } = await supabase.rpc('get_field_knowledge', {
        p_template_id: templateId,
        p_field_key: fieldKey,
      });

      if (error) {
        console.error('[Form Knowledge API] Error fetching field knowledge:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      // Return as array (RPC returns table)
      const knowledge = Array.isArray(data) && data.length > 0 ? data[0] : null;

      return NextResponse.json({
        template_id: templateId,
        field_key: fieldKey,
        knowledge: knowledge || null,
      });
    }

    // Get all knowledge for this template
    const { data, error } = await supabase
      .from('ed_form_field_knowledge')
      .select('*')
      .eq('template_id', templateId)
      .order('field_label', { ascending: true });

    if (error) {
      console.error('[Form Knowledge API] Error fetching template knowledge:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If orgId is provided, add LA-specific guidance
    let enrichedData = data;
    if (orgId && data) {
      enrichedData = data.map((field) => {
        const laGuidance = field.la_guidance as Record<string, any> | null;
        if (laGuidance) {
          // Try to find org-specific guidance, otherwise use default
          const orgSpecificGuidance = laGuidance[orgId] || laGuidance['default'];
          return {
            ...field,
            applicable_guidance: orgSpecificGuidance,
          };
        }
        return field;
      });
    }

    return NextResponse.json({
      template_id: templateId,
      fields: enrichedData || [],
      count: enrichedData?.length || 0,
    });
  } catch (error) {
    console.error('[Form Knowledge API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ed/form-knowledge
 * Check user input for red flags
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id, field_key, user_text } = body;

    if (!template_id || !field_key || !user_text) {
      return NextResponse.json(
        { error: 'template_id, field_key, and user_text are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check for red flags using the database function
    const { data, error } = await supabase.rpc('check_form_text_red_flags', {
      p_template_id: template_id,
      p_field_key: field_key,
      p_user_text: user_text,
    });

    if (error) {
      console.error('[Form Knowledge API] Error checking red flags:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Return as array (RPC returns table)
    const result = Array.isArray(data) && data.length > 0 ? data[0] : null;

    return NextResponse.json({
      template_id,
      field_key,
      user_text,
      has_red_flags: result?.has_red_flags || false,
      matched_flags: result?.matched_flags || [],
      suggestions: result?.suggestions || [],
    });
  } catch (error) {
    console.error('[Form Knowledge API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
