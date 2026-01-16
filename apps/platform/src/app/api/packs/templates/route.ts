import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, apiSuccess } from '@/lib/api-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    return withErrorHandling(async () => {
        const { data, error } = await supabase
            .from('pack_templates')
            .select('*')
            .order('name');

        if (error) throw error;

        return apiSuccess({ templates: data });
    }, 'Packs Templates GET');
}
