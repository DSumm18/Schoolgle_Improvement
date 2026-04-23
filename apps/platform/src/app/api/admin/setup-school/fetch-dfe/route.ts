import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const GET = async (req: NextRequest) => {
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

  const { searchParams } = new URL(req.url);
  const urn = searchParams.get('urn');

  if (!urn) {
    return apiError('URN parameter is required', 400);
  }

  // Validate URN format (6-7 digits)
  if (!/^\d{6,7}$/.test(urn)) {
    return apiError('Invalid URN format. Must be 6-7 digits.', 400);
  }

  try {
    // Query the schools table in the MAIN database
    const { data: school, error } = await adminClient
      .from('schools')
      .select('*')
      .eq('urn', urn)
      .single();

    if (error || !school) {
      return apiError(`School not found. Check URN: ${urn}`, 404);
    }

    // Transform to our schema format
    const schoolData = {
      urn: school.urn,
      name: school.name,
      dfe_number: school.laestab,
      la_code: school.la_code,
      establishment_number: school.establishment_number,
      address: [school.street, school.locality, school.county].filter(Boolean).join(', '),
      town: school.town || '',
      postcode: school.postcode || '',
      phase: school.phase_name || '',
      type: school.type_name || '',
      pupil_count: school.number_of_pupils || null,
      is_academy: school.type_group_name === 'Academies' ||
                 (school.type_code && ['34','35','36','37','38'].includes(school.type_code))
    };

    return apiSuccess({ school: schoolData });
  } catch (error) {
    console.error('School lookup error:', error);
    return apiError('Failed to fetch school data', 500);
  }
};
