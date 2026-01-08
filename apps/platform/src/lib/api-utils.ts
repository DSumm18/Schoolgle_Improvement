import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
    error: string;
    code?: string;
    details?: any;
}

export function apiError(message: string, status: number = 500, code?: string, details?: any) {
    return NextResponse.json(
        { error: message, code, details },
        { status }
    );
}

export function apiSuccess<T>(data: T, status: number = 200) {
    return NextResponse.json(data, { status });
}

export async function withErrorHandling(
    fn: () => Promise<NextResponse>,
    context: string = 'API Request'
): Promise<NextResponse> {
    try {
        return await fn();
    } catch (error: any) {
        console.error(`[${context}] Error:`, {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
        });

        // Handle Supabase specific errors if they propagate
        if (error.code === 'PGRST116') {
            return apiError('Resource not found', 404, 'NOT_FOUND');
        }

        if (error.status === 401 || error.message?.includes('JWT')) {
            return apiError('Unauthorized session', 401, 'UNAUTHORIZED');
        }

        return apiError(
            process.env.NODE_ENV === 'development' ? error.message : 'An internal server error occurred',
            500,
            'INTERNAL_SERVER_ERROR'
        );
    }
}
