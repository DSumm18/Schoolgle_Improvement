import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
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

        const supabase = createServerSupabaseClient();
        const suggestions = await generateProactiveContext(organizationId, domain, supabase);

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
