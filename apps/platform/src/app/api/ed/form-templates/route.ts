/**
 * Ed Form Templates API
 *
 * Manage pre-configured forms that Ed knows how to fill.
 * Schools can add their own templates, plus there are public templates like RIDDOR.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/ed/form-templates
 *
 * Get form templates available to the user
 *
 * Query params:
 * - url: Check if a specific URL matches a template
 * - category: Filter by category (hse, safeguarding, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const category = searchParams.get('category');
    const orgId = searchParams.get('org_id');

    // Get user from auth
    const cookieStore = cookies();
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Service client for RLS bypass
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // If checking a specific URL
    if (url) {
      const { data: template } = await serviceClient
        .rpc('get_form_template_by_url', {
          url,
          org_id: orgId,
        });

      if (!template) {
        return NextResponse.json({
          found: false,
          message: 'No template found for this URL',
        });
      }

      return NextResponse.json({
        found: true,
        template: Array.isArray(template) ? template[0] : template,
      });
    }

    // Get public templates
    let query = serviceClient
      .from('ed_form_templates')
      .select('form_key, form_name, form_category, description, url_pattern, estimated_time_minutes, help_text')
      .eq('is_active', true)
      .eq('is_public', true);

    if (category) {
      query = query.eq('form_category', category);
    }

    const { data: publicTemplates } = await query;

    // Get school's custom templates (if org provided)
    let schoolTemplates = [];
    if (orgId) {
      const { data: custom } = await serviceClient
        .rpc('get_school_form_templates', {
          school_org_id: orgId,
        });
      schoolTemplates = custom || [];
    }

    return NextResponse.json({
      templates: {
        public: publicTemplates || [],
        school: schoolTemplates,
      },
    });

  } catch (error: any) {
    console.error('[FormTemplates] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get form templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ed/form-templates
 *
 * Create a custom form template for a school
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      form_key,
      form_name,
      form_category,
      url_pattern,
      form_structure,
      conversation_template,
      description,
      help_text,
      organization_id,
    } = body;

    // Validate required fields
    if (!form_key || !form_name || !form_category || !url_pattern || !form_structure) {
      return NextResponse.json(
        { error: 'Missing required fields: form_key, form_name, form_category, url_pattern, form_structure' },
        { status: 400 }
      );
    }

    // Get user from auth
    const cookieStore = cookies();
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user belongs to the organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single();

    if (!userOrg) {
      return NextResponse.json(
        { error: 'You do not have permission to create templates for this organization' },
        { status: 403 }
      );
    }

    // Check if user has permission (admin, slt only)
    if (!['admin', 'slt', 'school_business_manager'].includes(userOrg.role)) {
      return NextResponse.json(
        { error: 'Only admins and SLT can create form templates' },
        { status: 403 }
      );
    }

    // Create the template
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: template, error } = await serviceClient
      .from('ed_form_templates')
      .insert({
        form_key,
        form_name,
        form_category,
        url_pattern,
        url_pattern_type: 'contains',
        form_structure,
        conversation_template,
        description,
        help_text,
        organization_id,
        is_public: false,  // School templates are private by default
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Check for duplicate
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A template with this key already exists for your school' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      template,
    });

  } catch (error: any) {
    console.error('[FormTemplates] Error creating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ed/form-templates
 *
 * Update an existing form template
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id, ...updates } = body;

    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
    }

    // Get user
    const cookieStore = cookies();
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the template to check ownership
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: template } = await serviceClient
      .from('ed_form_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check permission
    if (template.organization_id) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', template.organization_id)
        .single();

      if (!userOrg || !['admin', 'slt'].includes(userOrg.role)) {
        return NextResponse.json(
          { error: 'You do not have permission to update this template' },
          { status: 403 }
        );
      }
    }

    // Update the template
    const { data: updated } = await serviceClient
      .from('ed_form_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', template_id)
      .select()
      .single();

    return NextResponse.json({
      success: true,
      template: updated,
    });

  } catch (error: any) {
    console.error('[FormTemplates] Error updating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ed/form-templates
 *
 * Delete a form template (soft delete by setting is_active = false)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('template_id');

    if (!templateId) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
    }

    // Get user
    const cookieStore = cookies();
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the template
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: template } = await serviceClient
      .from('ed_form_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Cannot delete public templates
    if (template.is_public) {
      return NextResponse.json(
        { error: 'Cannot delete public templates' },
        { status: 403 }
      );
    }

    // Check permission
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', template.organization_id)
      .single();

    if (!userOrg || !['admin', 'slt'].includes(userOrg.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this template' },
        { status: 403 }
      );
    }

    // Soft delete
    await serviceClient
      .from('ed_form_templates')
      .update({ is_active: false })
      .eq('id', templateId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[FormTemplates] Error deleting template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
