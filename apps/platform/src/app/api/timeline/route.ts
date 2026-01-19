import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, apiError, apiSuccess } from '@/lib/api-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    return withErrorHandling(async () => {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('organizationId');
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!orgId) {
            return apiError('organizationId is required', 400);
        }

        let query = supabase
            .from('timeline_entries')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        return apiSuccess({ entries: data });
    }, 'Timeline GET');
}

export async function POST(request: NextRequest) {
    return withErrorHandling(async () => {
        const body = await request.json();
        const {
            organizationId,
            userId,
            title,
            description,
            entry_type,
            source_type,
            source_id,
            evidence_ids,
            category,
            subcategory,
            icon,
            color
        } = body;

        if (!organizationId || !userId || !title || !entry_type) {
            return apiError('Missing required fields', 400);
        }

        const { data, error } = await supabase
            .from('timeline_entries')
            .insert({
                organization_id: organizationId,
                created_by: userId,
                title,
                description,
                entry_type,
                source_type,
                source_id,
                evidence_ids: evidence_ids || [],
                category,
                subcategory,
                icon,
                color
            })
            .select()
            .single();

        if (error) throw error;

        return apiSuccess(data);
    }, 'Timeline POST');
}
