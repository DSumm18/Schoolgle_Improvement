import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { userId, subcategoryId, evidenceItem } = await req.json();

        if (!userId || !subcategoryId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

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
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
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

        return NextResponse.json({ matches });

    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
