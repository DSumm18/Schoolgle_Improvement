import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const POST = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();

  // Add admin@schoolgle.co.uk as super admin
  const { data, error } = await supabase
    .from('super_admins')
    .upsert({
      user_id: 'admin@schoolgle.co.uk',
      email: 'admin@schoolgle.co.uk',
      access_level: 'full',
      added_by: auth.email || 'system'
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({
    message: 'admin@schoolgle.co.uk added as super admin',
    data
  });
});
