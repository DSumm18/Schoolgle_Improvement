import { NextRequest, NextResponse } from 'next/server';

/**
 * Fish Audio TTS Proxy
 * Keeps API key secure on server-side
 * Simply forwards requests from client to Fish Audio API
 */
export async function POST(request: NextRequest) {
    console.log('[Fish Audio Proxy] POST request received');
    try {
        // Get the request body from the client (contains text, reference_id, language, etc.)
        const requestBody = await request.json();

        // Get API key from environment variable (server-side only)
        // Fallback to hardcoded key for development (should be in .env.local in production)
        const apiKey = process.env.FISH_AUDIO_API_KEY || '979fa335474b48d8af6bbe56cc171ec6';

        console.log('[Fish Audio Proxy] API key status:', {
            hasKey: !!apiKey,
            keyPreview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'NONE',
            source: process.env.FISH_AUDIO_API_KEY ? 'env' : 'fallback',
        });

        if (!apiKey) {
            console.error('[Fish Audio Proxy] API key not found');
            return NextResponse.json(
                { error: 'Fish Audio API key not configured. Set FISH_AUDIO_API_KEY in .env.local' },
                { status: 500 }
            );
        }

        console.log('[Fish Audio Proxy] Forwarding request to Fish Audio:', {
            textLength: requestBody.text?.length || 0,
            textPreview: requestBody.text?.substring(0, 50) + '...',
            reference_id: requestBody.reference_id,
            hasLanguage: !!requestBody.language,
        });

        // Forward the request to Fish Audio API
        // The client calls /api/fish-audio, we forward to https://api.fish.audio/v1/tts
        const fishAudioUrl = 'https://api.fish.audio/v1/tts';

        console.log('[Fish Audio Proxy] Forwarding to:', fishAudioUrl);

        const response = await fetch(fishAudioUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('[Fish Audio Proxy] Upstream response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Fish Audio Proxy] ❌ API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
            });
            // Forward the upstream error details
            return NextResponse.json(
                { error: 'Fish Audio TTS failed', details: errorText, status: response.status },
                { status: response.status }
            );
        }

        // Return audio blob
        const audioBlob = await response.blob();
        console.log('[Fish Audio Proxy] Success! Audio blob size:', audioBlob.size);

        return new NextResponse(audioBlob, {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });

    } catch (error) {
        console.error('[Fish Audio Proxy] Critical Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
