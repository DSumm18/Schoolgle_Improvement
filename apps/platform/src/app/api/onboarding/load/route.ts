import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/onboarding/load?token=xxx
 * Load onboarding lead data by completion token
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const { data: lead, error } = await supabaseAdmin
        .from('onboarding_leads')
        .select('*')
        .eq('completion_token', token)
        .single();

    if (error || !lead) {
        return Response.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    return Response.json({ lead });
}
