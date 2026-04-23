import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { mapUrlToDomain, generateProactiveContext } from '@schoolgle/ed-agents';

export async function POST(request: NextRequest) {
    try {
        const { url, organizationId } = await request.json();

        if (!url || !organizationId) {
            return NextResponse.json(
                { success: false, error: 'URL and Organization ID are required' },
                { status: 400 }
            );
        }

        const domain = mapUrlToDomain(url);
        if (!domain) {
            return NextResponse.json({ success: true, suggestions: [] });
        }

        // Use service role to bypass RLS for proactive context checks
        const supabase = createServiceRoleClient();
        const suggestions = await generateProactiveContext(organizationId, domain, supabase as any);

        return NextResponse.json({
            success: true,
            domain,
            suggestions
        });
    } catch (error: any) {
        console.error('Error in /api/ed/proactive:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
