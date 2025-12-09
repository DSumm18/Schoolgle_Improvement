import { NextRequest, NextResponse } from 'next/server';

/**
 * Fish Audio TTS Proxy
 * Keeps API key secure on server-side
 * Simply forwards requests from client to Fish Audio API
 */
export async function POST(request: NextRequest) {
    try {
        // Get the request body from the client (contains text, reference_id, language, etc.)
        const requestBody = await request.json();

        // TEMPORARY WORKAROUND: Hardcode API key since env vars aren't loading
        // TODO: Fix environment variable loading in Next.js
        const apiKey = '979fa335474b48d8af6bbe56cc171ec6';

        console.log('[Fish Audio Proxy] Using hardcoded API key:', {
            hasKey: !!apiKey,
            keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'NONE',
        });

        if (!apiKey) {
            console.error('[Fish Audio Proxy] API key not found');
            return NextResponse.json(
                { error: 'Fish Audio API key not configured' },
                { status: 500 }
            );
        }

        console.log('[Fish Audio Proxy] Forwarding request to Fish Audio:', {
            text: requestBody.text?.substring(0, 50) + '...',
            reference_id: requestBody.reference_id,
            hasLanguage: !!requestBody.language,
        });

        // Forward the request to Fish Audio API
        const response = await fetch('https://api.fish.audio/v1/tts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Fish Audio Proxy] ❌ API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
            });
            return NextResponse.json(
                { error: 'Fish Audio TTS failed', details: errorText, status: response.status },
                { status: response.status }
            );
        }

        // Return audio blob
        const audioBlob = await response.blob();
        return new NextResponse(audioBlob, {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });

    } catch (error) {
        console.error('[Fish Audio Proxy] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
