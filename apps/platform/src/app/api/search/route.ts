import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { supabase } from "@/lib/supabase";
import { searchRequestSchema, validateRequest } from "@/lib/validations";
import { searchLimiter } from "@/lib/rateLimit";
import { logger, createOperationLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    const searchLogger = createOperationLogger('search-api', { endpoint: '/api/search' });

    try {
        // Rate limiting check
        const rateLimitResult = await searchLimiter.check(req);
        if (!rateLimitResult.allowed) {
            searchLogger.warn('Rate limit exceeded');
            return rateLimitResult.response!;
        }

        // Parse and validate request body
        const body = await req.json();
        const validation = validateRequest(searchRequestSchema, body);

        if (!validation.success) {
            searchLogger.warn('Invalid search request', undefined, undefined, { validationError: validation.error });
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { query, matchThreshold, matchCount } = validation.data;

        searchLogger.info('Processing search query', undefined, { query, matchThreshold, matchCount });

        // Generate embedding for the search query
        let embedding: number[];
        try {
            embedding = await searchLogger.measureTime(
                'embedding generation',
                () => generateEmbedding(query)
            );
        } catch (embeddingError) {
            searchLogger.error('Failed to generate search embedding', undefined, embeddingError);
            return NextResponse.json({
                error: 'Failed to process search query',
                details: 'Unable to generate search embedding'
            }, { status: 500 });
        }

        // Search in Supabase using the match_documents RPC function
        searchLogger.debug('Querying Supabase for matching documents');

        const { data: documents, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: matchThreshold,
            match_count: matchCount
        });

        if (error) {
            searchLogger.error('Supabase search query failed', undefined, error);
            return NextResponse.json({
                error: 'Search query failed',
                details: error.message
            }, { status: 500 });
        }

        searchLogger.info('Search completed successfully', undefined, {
            resultCount: documents?.length || 0
        });

        return NextResponse.json({
            results: documents || [],
            metadata: {
                query,
                matchThreshold,
                matchCount,
                resultCount: documents?.length || 0
            }
        });

    } catch (error: any) {
        searchLogger.error('Unexpected error in search API', undefined, error);
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
