import OpenAI from 'openai';
import { logger } from './logger';

/**
 * Custom error for embedding generation failures
 */
export class EmbeddingError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'EmbeddingError';
    }
}

/**
 * Generate text embeddings using OpenAI's embedding model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const context = { function: 'generateEmbedding', file: 'embeddings.ts' };

    try {
        if (!text || text.trim().length === 0) {
            logger.warn('Attempted to generate embedding for empty text', context);
            throw new EmbeddingError('Cannot generate embedding for empty text');
        }

        if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
            logger.error('API key missing for embedding generation', context);
            throw new EmbeddingError('API key not configured');
        }

        logger.debug('Generating embedding', context, { textLength: text.length });

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "https://schoolgle.co.uk",
                "X-Title": "Schoolgle",
            }
        });

        const cleanedText = text.replace(/\n/g, ' ').trim();

        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: cleanedText,
        });

        if (!response.data || response.data.length === 0) {
            throw new EmbeddingError('No embedding data returned from API');
        }

        const embedding = response.data[0].embedding;

        logger.info('Embedding generated successfully', context, {
            textLength: text.length,
            embeddingDimensions: embedding.length,
            usage: response.usage
        });

        return embedding;
    } catch (error) {
        if (error instanceof EmbeddingError) {
            logger.error('Embedding generation failed', context, error);
            throw error;
        }

        logger.error('Unexpected error generating embedding', context, error);
        throw new EmbeddingError(
            'Failed to generate embedding',
            error instanceof Error ? error : undefined
        );
    }
}
