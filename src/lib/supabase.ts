import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Gets the Supabase client instance
 * Throws an error if Supabase is not properly configured
 */
function getSupabaseClient(): SupabaseClient {
    if (!supabaseUrl || !supabaseKey) {
        const error = new Error(
            'Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
        );
        logger.fatal('Supabase initialization failed', {
            function: 'getSupabaseClient',
            file: 'supabase.ts'
        }, error);
        throw error;
    }

    return createClient(supabaseUrl, supabaseKey);
}

// Initialize the client - will throw if not configured
let supabase: SupabaseClient;

try {
    supabase = getSupabaseClient();
    logger.info('Supabase client initialized successfully', {
        file: 'supabase.ts'
    });
} catch (error) {
    // During build time without env vars, we create a dummy client that will fail at runtime
    // This allows the build to succeed
    if (process.env.NODE_ENV === 'production') {
        throw error; // In production, fail fast
    }

    logger.warn('Supabase client initialization deferred (build time)', {
        file: 'supabase.ts'
    });

    // Create client with empty strings - will fail if actually used
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };
