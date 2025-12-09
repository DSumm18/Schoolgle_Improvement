import { NextRequest, NextResponse } from 'next/server';
import { uploadLimiter } from '@/lib/rateLimit';
import { logger, createOperationLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
    const transcribeLogger = createOperationLogger('transcribe-api', { endpoint: '/api/voice/transcribe' });

    try {
        // Rate limiting check
        const rateLimitResult = await uploadLimiter.check(req);
        if (!rateLimitResult.allowed) {
            transcribeLogger.warn('Rate limit exceeded');
            return rateLimitResult.response!;
        }

        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            transcribeLogger.warn('No audio file provided in request');
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        transcribeLogger.info('Processing audio transcription', undefined, {
            fileName: audioFile.name,
            fileSize: audioFile.size,
            fileType: audioFile.type
        });

        // Validate file size (max 25MB)
        if (audioFile.size > 25 * 1024 * 1024) {
            transcribeLogger.warn('Audio file exceeds size limit', undefined, undefined, {
                fileSize: audioFile.size,
                maxSize: 25 * 1024 * 1024
            });
            return NextResponse.json({
                error: 'File size must be less than 25MB',
                details: `Your file is ${(audioFile.size / 1024 / 1024).toFixed(2)}MB`
            }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/m4a'];
        if (!allowedTypes.includes(audioFile.type)) {
            transcribeLogger.warn('Invalid audio file type', undefined, undefined, {
                providedType: audioFile.type,
                allowedTypes
            });
            return NextResponse.json({
                error: 'Invalid audio format. Supported: WAV, MP3, WEBM, M4A',
                details: `Your file type: ${audioFile.type}`
            }, { status: 400 });
        }

        // Check if OpenAI key is available for Whisper
        const openaiKey = process.env.OPENAI_API_KEY;

        if (openaiKey) {
            transcribeLogger.debug('Using OpenAI Whisper API for transcription');

            try {
                // Use OpenAI Whisper API
                const whisperFormData = new FormData();
                whisperFormData.append('file', audioFile);
                whisperFormData.append('model', 'whisper-1');
                whisperFormData.append('language', 'en');

                const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiKey}`
                    },
                    body: whisperFormData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    transcribeLogger.error('OpenAI Whisper API error', undefined, new Error(errorText), {
                        status: response.status,
                        statusText: response.statusText
                    });
                    throw new Error(`Whisper API error: ${response.status}`);
                }

                const data = await response.json();
                transcribeLogger.info('Transcription successful', undefined, {
                    transcriptLength: data.text?.length
                });

                return NextResponse.json({ transcript: data.text });
            } catch (whisperError) {
                transcribeLogger.error('Whisper transcription failed', undefined, whisperError);

                // Fall through to demo transcript if Whisper fails
                transcribeLogger.info('Falling back to demo transcript');
            }
        } else {
            transcribeLogger.warn('OpenAI API key not configured, using demo transcript');
        }

        // Fallback: Return a demo transcript
        const demoTranscript = `Lesson observation notes. The lesson demonstrated strong subject knowledge from the teacher.
        Good use of questioning to check understanding. Behaviour management was effective.
        Clear learning objectives were shared. Differentiation was evident through tiered activities.
        Areas for development include increasing pace and providing more opportunities for student discussion.`;

        transcribeLogger.info('Returning demo transcript');

        return NextResponse.json({
            transcript: demoTranscript,
            isDemoTranscript: true,
            message: 'Demo transcript provided. Configure OpenAI API key for real transcription.'
        });

    } catch (error: any) {
        transcribeLogger.error('Unexpected error in transcription API', undefined, error);
        return NextResponse.json({
            error: 'An error occurred during transcription',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
