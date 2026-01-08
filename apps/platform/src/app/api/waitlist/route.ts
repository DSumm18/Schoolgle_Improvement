import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { withErrorHandling, apiError, apiSuccess } from '@/lib/api-utils';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    return withErrorHandling(async () => {
        const body = await request.json();
        const { email, school_name, role } = body;

        if (!email || !email.includes('@')) {
            return apiError('Valid email required', 400);
        }

        // Get UTM params from cookies or headers
        const utm_source = request.cookies.get('utm_source')?.value || null;
        const utm_medium = request.cookies.get('utm_medium')?.value || null;
        const utm_campaign = request.cookies.get('utm_campaign')?.value || null;

        const { error } = await supabaseAdmin
            .from('waitlist')
            .insert({
                email: email.toLowerCase().trim(),
                school_name,
                role,
                source: 'website',
                utm_source,
                utm_medium,
                utm_campaign,
            });

        if (error) {
            if (error.code === '23505') {
                return apiSuccess({ success: true, message: 'Already registered' });
            }
            throw error;
        }

        return apiSuccess({ success: true });
    }, 'Waitlist API');
}
