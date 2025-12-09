import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evidenceRequestSchema, validateRequest } from '@/lib/validations';
import { standardLimiter } from '@/lib/rateLimit';
import { logger, createOperationLogger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    const evidenceLogger = createOperationLogger('evidence-api', { endpoint: '/api/evidence' });

    try {
        // Rate limiting check
        const rateLimitResult = await standardLimiter.check(req);
        if (!rateLimitResult.allowed) {
            evidenceLogger.warn('Rate limit exceeded');
            return rateLimitResult.response!;
        }

        // Parse and validate request body
        const body = await req.json();
        const validation = validateRequest(evidenceRequestSchema, body);

        if (!validation.success) {
            evidenceLogger.warn('Invalid request', undefined, undefined, { validationError: validation.error });
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { userId, subcategoryId, evidenceItem } = validation.data;

        evidenceLogger.info('Fetching evidence matches', { userId, subcategoryId }, { evidenceItem });

        // We need to filter by user_id on the joined document, but Supabase join filtering is tricky.
        // However, RLS is enabled. But we are using service role key here, so we bypass RLS.
        // We MUST manually filter by user_id to ensure data isolation if using service role.

        // To filter by joined table column:
        // .eq('documents.user_id', userId) works if using inner join, but Supabase default is left join.
        // We can use !inner to force inner join and filter.

        let query = supabase
            .from('evidence_matches')
            .select(`
                *,
                document:documents!inner (
                    name,
                    web_view_link,
                    folder_path,
                    mime_type,
                    user_id
                )
            `)
            .eq('subcategory_id', subcategoryId)
            .eq('document.user_id', userId)
            .order('confidence', { ascending: false });

        if (evidenceItem) {
            query = query.eq('evidence_item', evidenceItem);
        }

        const { data, error } = await query;

        if (error) {
            evidenceLogger.error('Supabase query failed', { userId, subcategoryId }, error);
            return NextResponse.json({
                error: 'Failed to fetch evidence matches',
                details: error.message
            }, { status: 500 });
        }

        // Transform data for frontend
        const matches = data.map((match: any) => ({
            documentName: match.document?.name || 'Unknown Document',
            documentLink: match.document?.web_view_link,
            confidence: match.confidence,
            relevanceExplanation: match.relevance_explanation,
            keyQuotes: match.key_quotes,
            folderPath: match.document?.folder_path
        }));

        evidenceLogger.info('Successfully fetched evidence matches', { userId, subcategoryId }, { matchCount: matches.length });

        return NextResponse.json({ matches });

    } catch (error: any) {
        evidenceLogger.error('Unexpected error in evidence API', undefined, error);
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
