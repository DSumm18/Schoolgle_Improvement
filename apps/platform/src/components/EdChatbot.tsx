'use client';

import { useEffect, useRef } from 'react';

// Import the working Ed class directly from source
// This is the proven, working implementation from c:\Git\ED
let Ed: any = null;

// Dynamically import to avoid SSR issues
if (typeof window !== 'undefined') {
    // Import directly from source files (no build needed)
    import('../../../../packages/ed-widget/src/Ed').then((module) => {
        Ed = module.Ed;
    }).catch((err) => {
        console.error('[EdChatbot] Failed to load Ed widget:', err);
    });
}

/**
 * React wrapper for the original working Ed widget
 * This component initializes the Ed class from c:\Git\ED which has all features working:
 * - Fish Audio TTS (Edwina's voice)
 * - Particle morphing (flags, pencil, lightbulb, etc.)
 * - Language detection
 * - Magic Tools animations
 * - Form fill detection
 */
export function EdChatbot() {
    const edInstance = useRef<any>(null);
    const initAttempted = useRef(false);

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return;

        // Only initialize once
        if (initAttempted.current) return;
        initAttempted.current = true;

        // Wait for Ed class to be loaded
        const initEd = () => {
            if (!Ed) {
                console.log('[EdChatbot] Waiting for Ed class to load...');
                setTimeout(initEd, 100);
                return;
            }

            if (edInstance.current) {
                console.warn('[EdChatbot] Ed already initialized');
                return;
            }

            console.log('[EdChatbot] Initializing Ed widget with configuration...');

            // Hardcode API keys since process.env doesn't work in dynamically imported modules
            // These values are from .env.local
            const fishApiKey = '979fa335474b48d8af6bbe56cc171ec6';
            const geminiApiKey = 'AIzaSyC9MpcNpygkHG0XfT6G4sDH_8L3PczQrEc';

            const config = {
                schoolId: 'schoolgle',
                theme: 'standard',
                position: 'bottom-right',
                language: 'en-GB',
                persona: 'edwina',
                fishAudioApiKey: fishApiKey,
                fishAudioVoiceIds: {
                    ed: '400b2a2c4aa44afc87b6d14adf0dd13c',
                    edwina: '72e3a3135204461ba041df787dc5c834',
                    santa: '2e56aeff1a7a4cc9b904971cd5bd9794',
                    elf: 'd66de7f0c2c9468b924120fdf1a4aae7',
                    headteacher: '',
                    custom: '',
                },
                // Don't pass geminiApiKey - Ed will use fallback responses
                // Chat API responses will come from /api/ed/chat (which uses OpenRouter/DeepSeek)
                features: {
                    admissions: true,
                    policies: true,
                    calendar: true,
                    staffDirectory: false,
                    formFill: true,
                    voice: true,
                },
            };

            console.log('[EdChatbot] Config:', {
                ...config,
                fishAudioApiKey: fishApiKey ? `${fishApiKey.substring(0, 8)}...` : 'MISSING',
                geminiApiKey: geminiApiKey ? `${geminiApiKey.substring(0, 8)}...` : 'MISSING',
            });

            try {
                edInstance.current = new Ed(config);
                console.log('[EdChatbot] ✅ Ed widget initialized successfully');
            } catch (error) {
                console.error('[EdChatbot] ❌ Failed to initialize Ed:', error);
            }
        };

        initEd();

        // Cleanup on unmount
        return () => {
            if (edInstance.current && edInstance.current.destroy) {
                console.log('[EdChatbot] Destroying Ed instance');
                edInstance.current.destroy();
                edInstance.current = null;
            }
        };
    }, []);

    // Ed creates its own DOM, so we don't render anything
    return null;
}

// Export as default for compatibility with page.tsx
export default EdChatbot;
