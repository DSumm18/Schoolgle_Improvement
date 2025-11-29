import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient | any = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn("Supabase URL or Key missing. Vector DB features will not work.");
    // Create a dummy proxy to prevent build crashes if imported
    supabase = {
        from: () => ({
            insert: async () => ({ error: { message: "Supabase not configured" } }),
            select: async () => ({ error: { message: "Supabase not configured" } }),
        })
    };
}

export { supabase };
