import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const { sql } = await req.json();
    if (!sql) {
        return NextResponse.json({ error: 'Missing SQL' }, { status: 400 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Debug: Try to query documents table directly to verify existence
        const { data: testData, error: testError } = await supabase.from('documents').select('id').limit(1);
        if (testError) {
            console.error('[DebugSQL] Table check failed:', testError);
        } else {
            console.log('[DebugSQL] Documents table exists');
        }

        // Let's check for an exec_sql RPC first.
        const { data, error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
            console.error('[DebugSQL] RPC Error:', error);
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
