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

        const supabase = await createServerSupabaseClient();
        const suggestions = await generateProactiveContext(organizationId, domain, supabase);

        return NextResponse.json({
            success: true,
            domain,
            suggestions
        });
    } catch (error: any) {
        // Return empty suggestions on error — don't pollute console with 500s
        return NextResponse.json({
            success: true,
            suggestions: [],
        });
    }
}
