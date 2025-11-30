import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const debug = {
        hasSupabaseUrl: !!supabaseUrl,
        supabaseUrlPreview: supabaseUrl?.substring(0, 30) + '...',
        hasServiceKey: !!supabaseServiceKey,
        serviceKeyPreview: supabaseServiceKey?.substring(0, 20) + '...',
        tables: null as any,
        error: null as any
    };

    if (supabaseUrl && supabaseServiceKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            
            // Try to list users table
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .limit(1);

            if (error) {
                debug.error = error.message;
            } else {
                debug.tables = 'users table accessible';
            }
        } catch (e: any) {
            debug.error = e.message;
        }
    }

    return NextResponse.json(debug);
}

