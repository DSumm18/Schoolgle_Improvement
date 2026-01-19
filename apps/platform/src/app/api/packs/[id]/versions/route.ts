import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, apiSuccess } from '@/lib/api-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withErrorHandling(async () => {
        const { id } = params;

        const { data, error } = await supabase
            .from('pack_versions')
            .select('*')
            .eq('pack_id', id)
            .order('version_number', { ascending: false });

        if (error) throw error;

        return apiSuccess({ versions: data });
    }, 'Pack Versions GET');
}
