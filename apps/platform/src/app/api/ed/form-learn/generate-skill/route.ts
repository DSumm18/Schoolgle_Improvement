// Ed Form Learning - Skill Generation
// Convert learned forms into automation skills

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/ed/form-learn/generate-skill
 * Generate an automation skill from a learned form
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { form_id, skill_name, skill_category, require_review } = body;

    if (!form_id) {
      return NextResponse.json(
        { error: 'form_id is required' },
        { status: 400 }
      );
    }

    // Get the learned form
    const { data: form, error: formError } = await supabase
      .from('ed_learned_forms')
      .select('*')
      .eq('id', form_id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Learned form not found' },
        { status: 404 }
      );
    }

    // Check if form is ready for skill generation
    if (form.confidence_score < 50) {
      return NextResponse.json({
        error: 'Form not ready for skill generation',
        message: `Confidence score is ${form.confidence_score}%. Need at least 50% (more observations required).`,
        current_confidence: form.confidence_score,
      }, { status: 400 });
    }

    // Generate skill definition
    const skillDefinition = generateSkillDefinition(
      form,
      skill_name || `${form.form_name} (Learned)`,
      skill_category || 'forms',
      require_review !== false
    );

    // Create the skill
    const { data: skill, error: skillError } = await supabase
      .from('ed_rpa_skills')
      .insert({
        skill_key: generateSkillKey(form.form_name),
        name: skill_name || `${form.form_name} (Learned)`,
        description: `Learned from ${form.learned_from_count} observation(s).`,
        category: skill_category || 'forms',
        target_url: form.url,
        target_name: form.form_name,
        eligible_roles: ['admin', 'school_business_manager'],
        skill_definition: skillDefinition,
        risk_level: require_review === false ? 'low' : 'medium',
        is_public: false,
        created_by_user: user.id,
        // Link to learned form for updates
        metadata: {
          learned_from_form_id: form_id,
          confidence_score: form.confidence_score,
        },
      })
      .select()
      .single();

    if (skillError) {
      console.error('[Generate Skill API] Error:', skillError);
      return NextResponse.json({ error: skillError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      skill,
      message: `Skill "${skill.name}" created successfully!`,
    });
  } catch (error) {
    console.error('[Generate Skill API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ed/form-learn/generate-skill
 * Get skill preview without creating it
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

    const { data: form, error } = await supabase
      .from('ed_learned_forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (error || !form) {
      return NextResponse.json(
        { error: 'Learned form not found' },
        { status: 404 }
      );
    }

    // Generate preview
    const preview = generateSkillDefinition(form, form.form_name, 'forms', true);

    return NextResponse.json({
      form: {
        id: form.id,
        name: form.form_name,
        url: form.url,
        confidence_score: form.confidence_score,
        learned_from_count: form.learned_from_count,
      },
      skill_preview: preview,
      ready_for_automation: form.confidence_score >= 70,
    });
  } catch (error) {
    console.error('[Generate Skill API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a skill definition from learned form structure
 */
function generateSkillDefinition(
  form: any,
  skillName: string,
  category: string,
  requireReview: boolean
): any {
  const structure = form.form_structure;

  // Generate steps from fields
  const steps: any[] = [];

  // Initial navigation
  steps.push({
    action: 'navigate',
    url: form.url,
  });

  // Group fields by sections if available
  if (structure.sections && structure.sections.length > 0) {
    structure.sections.forEach((section: any) => {
      steps.push({
        action: 'section',
        title: section.title,
      });

      section.fields.forEach((fieldSelector: string) => {
        const field = structure.fields.find((f: any) => f.selector === fieldSelector);
        if (field) {
          steps.push(generateFieldStep(field));
        }
      });
    });
  } else {
    // No sections, just fields in order
    structure.fields?.forEach((field: any) => {
      steps.push(generateFieldStep(field));
    });
  }

  // Submission
  if (structure.submission) {
    steps.push({
      action: structure.submission.method,
      selector: structure.submission.target,
    });
  }

  // Always add review pause for safety
  steps.push({
    action: 'pause',
    message: 'Please review all information before submitting',
  });

  // Generate data sources mapping
  const dataSources: Record<string, string> = {};
  structure.fields?.forEach((field: any) => {
    if (field.semantic_meaning && field.selector) {
      const key = field.semantic_meaning.toLowerCase().replace(/\s+/g, '_');
      dataSources[key] = field.data_source || 'user_input';
    }
  });

  return {
    steps,
    data_sources: dataSources,
    safety: {
      require_review: requireReview,
      required_role: 'school_business_manager',
      confirmation_message: `This will fill the ${skillName} form. Please review before submitting.`,
    },
    learned_from: {
      observations: form.learned_from_count,
      confidence_score: form.confidence_score,
      field_count: structure.fields?.length || 0,
    },
  };
}

/**
 * Generate a step for a single field
 */
function generateFieldStep(field: any): any {
  const step: any = {
    action: 'fill',
    selector: field.selector,
    value: `\${${getFieldVariableName(field)}}`,
  };

  // Add type information
  if (field.type) {
    step.type = field.type;
  }

  // Add options for select fields
  if (field.options && field.options.length > 0) {
    step.options = field.options;
  }

  // Add validation if known
  if (field.validation) {
    step.validation = field.validation;
  }

  // Add help text for user
  if (field.help_text || field.semantic_meaning) {
    step.help = field.help_text || field.semantic_meaning;
  }

  return step;
}

/**
 * Generate a variable name for a field
 */
function getFieldVariableName(field: any): string {
  if (field.semantic_meaning) {
    return field.semantic_meaning
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  if (field.label) {
    return field.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  return 'field_value';
}

/**
 * Generate a skill key from form name
 */
function generateSkillKey(formName: string): string {
  return formName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') + '_learned';
}
