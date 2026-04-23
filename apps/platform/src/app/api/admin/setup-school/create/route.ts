import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Create a basic school organization record
 * POST /api/admin/setup-school/create
 *
 * Body: DfE school data object
 */
export const POST = async (req: NextRequest) => {
  // Manual auth for super admin (no organizationId needed)

  // Try Authorization header first (client-side fetch)
  let user: any = null;
  const authHeader = req.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (!authError && authUser) {
      user = authUser;
    }
  }

  // Fall back to cookies (SSR)
  if (!user) {
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
    if (!authError && cookieUser) {
      user = cookieUser;
    }
  }

  if (!user) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  // Check super admin status
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: isAdmin } = await adminClient
    .from('super_admins')
    .select('access_level')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle();

  if (!isAdmin) {
    return apiError('Unauthorized. Super admin access required.', 403);
  }

  const schoolData = await req.json();

  // Validate required fields
  if (!schoolData?.urn || !schoolData?.name) {
    return apiError('URN and school name are required', 400);
  }

  try {
    // Check if organization already exists by URN
    const { data: existingOrg } = await adminClient
      .from('organizations')
      .select('id, name')
      .eq('urn', String(schoolData.urn))
      .maybeSingle();

    if (existingOrg) {
      return apiError(
        `A school with URN ${schoolData.urn} already exists: ${existingOrg.name}`,
        409,
        'ORG_EXISTS'
      );
    }

    // Determine school type from DfE data
    let schoolType = 'unknown';
    const phaseLower = (schoolData.phase || '').toLowerCase();
    const typeLower = (schoolData.type || '').toLowerCase();

    if (phaseLower.includes('primary') || typeLower.includes('primary')) {
      schoolType = 'primary';
    } else if (phaseLower.includes('secondary')) {
      schoolType = 'secondary';
    } else if (phaseLower.includes('all-through')) {
      schoolType = 'all-through';
    } else if (typeLower.includes('special')) {
      schoolType = 'special';
    } else if (phaseLower.includes('nursery')) {
      schoolType = 'nursery';
    }

    // Create organization
    const { data: organization, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: schoolData.name,
        urn: String(schoolData.urn),
        school_type: schoolType,
        local_authority: '', // Can be filled in later from LA code
        address: {
          line1: schoolData.address || '',
          line2: '',
          line3: '',
          town: schoolData.town || '',
          postcode: schoolData.postcode || '',
          phone: '',
          email: '',
          website: '',
        },
        settings: {
          phase: schoolData.phase || '',
          type_name: schoolData.type || '',
          trust_name: '',
          religious_character: '',
          dfe_number: schoolData.dfe_number,
          la_code: schoolData.la_code,
          establishment_number: schoolData.establishment_number,
          pupil_count: schoolData.pupil_count,
          is_academy: schoolData.is_academy || false,
          created_via: 'setup_school_tool',
        },
        organization_type: 'school',
      })
      .select()
      .single();

    if (orgError) throw orgError;

    return apiSuccess({
      school: {
        id: organization.id,
        name: organization.name,
        urn: organization.urn,
        school_type: organization.school_type,
      },
      message: 'School created successfully. You can now configure subscriptions, users, and permissions.',
    });
  } catch (error: any) {
    console.error('Error creating school:', error);
    return apiError(
      error.message || 'Failed to create school',
      500,
      'CREATE_FAILED'
    );
  }
};
