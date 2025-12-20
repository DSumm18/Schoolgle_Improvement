"use client";

import { useEffect, useRef, useState } from "react";

interface EdWidgetWrapperProps {
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  /**
   * Mode for Ed widget:
   * - 'demo': For logged-out users on home page - explains system, shows off features
   * - 'user': For logged-in users - full functionality with access to user data
   */
  mode?: 'demo' | 'user';
}

export default function EdWidgetWrapper({
  isOpen,
  onToggle,
  isMinimized,
  onToggleMinimize,
  mode = 'user', // Default to user mode
}: EdWidgetWrapperProps) {
  const edInstanceRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initLockRef = useRef(false); // Prevent double initialization

  useEffect(() => {
    // Initialize Ed widget once
    if (!isInitialized && !initLockRef.current && typeof window !== 'undefined') {
      initLockRef.current = true; // Lock immediately to prevent race
      
      // Check if already initialized globally
      if ((window as any).__ED_INSTANCE__) {
        console.log('[EdWidgetWrapper] Ed widget already initialized globally');
        edInstanceRef.current = (window as any).__ED_INSTANCE__;
        setIsInitialized(true);
        initLockRef.current = false;
        return;
      }

      // Initialize Ed widget with multiple fallback strategies
      const initEdWidget = async () => {
        let EdWidget: any;
        
        // Strategy 1: Try relative path import first (workspace source - most reliable)
        try {
          const module = await import('../../../../packages/ed-widget/src/index');
          EdWidget = module.EdWidget;
          console.log('[EdWidgetWrapper] ✅ Loaded from relative path (workspace source)');
        } catch (relativeError) {
          // Strategy 2: Try workspace package import
          try {
            // @ts-ignore - Workspace package, TypeScript can't resolve but works at runtime
            const module = await import('@schoolgle/ed-widget');
            EdWidget = module.EdWidget;
            console.log('[EdWidgetWrapper] ✅ Loaded from @schoolgle/ed-widget package');
          } catch (moduleError: any) {
            // Strategy 3: Use global EdWidget (set by auto-init or script tag)
            if ((window as any).EdWidget) {
              EdWidget = (window as any).EdWidget;
              console.log('[EdWidgetWrapper] ✅ Using global EdWidget');
            } else {
              console.error('[EdWidgetWrapper] ❌ EdWidget not found in any location');
              console.error('[EdWidgetWrapper] Tried: relative path, @schoolgle/ed-widget, global');
              return;
            }
          }
        }

        if (!EdWidget || !EdWidget.init) {
          console.error('[EdWidgetWrapper] ❌ EdWidget.init is not available');
          return;
        }

        try {
          // Fish Audio is proxied through /api/fish-audio, so we pass a placeholder
          // The actual API key is stored server-side in the API route
          // Passing a non-empty string enables Fish Audio initialization
          const fishAudioApiKey = typeof window !== 'undefined' 
            ? (process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY || 'proxy-enabled') 
            : 'proxy-enabled';

          // Get voice IDs from environment variables (British UK accents)
          // These should be set in .env.local as NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ED and NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_EDWINA
          const fishAudioVoiceIds: Record<string, string> = {};
          if (typeof window !== 'undefined') {
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ED) {
              fishAudioVoiceIds.ed = process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ED;
            }
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_EDWINA) {
              fishAudioVoiceIds.edwina = process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_EDWINA;
            }
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_SANTA) {
              fishAudioVoiceIds.santa = process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_SANTA;
            }
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ELF) {
              fishAudioVoiceIds.elf = process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ELF;
            }
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_HEADTEACHER) {
              fishAudioVoiceIds.headteacher = process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_HEADTEACHER;
            }
          }

          // Configure Ed based on mode
          // Demo mode: For logged-out users - explains system, shows off features
          // User mode: For logged-in users - full functionality
          const config: any = {
            position: 'bottom-right',
            theme: 'standard',
            persona: 'ed',
            features: {
              admissions: mode === 'user', // Only for logged-in users
              policies: mode === 'user',
              calendar: mode === 'user',
              staffDirectory: false,
              formFill: mode === 'user',
              voice: true, // Voice always enabled
            },
            fishAudioApiKey: fishAudioApiKey, // Pass API key to enable Fish Audio
            fishAudioVoiceIds: Object.keys(fishAudioVoiceIds).length > 0 ? fishAudioVoiceIds : undefined, // Pass voice IDs if configured
            disableBrowserTTS: true, // Disable browser TTS fallback - only use Fish Audio
            // TODO: Add customKnowledge for demo mode when user provides rules
            // customKnowledge: mode === 'demo' ? [...demoKnowledge] : undefined,
          };

          if (mode === 'demo') {
            console.log('[EdWidgetWrapper] 🎭 Demo mode enabled - Ed will explain the system');
          } else {
            console.log('[EdWidgetWrapper] 👤 User mode enabled - Full functionality');
          }

          const ed = EdWidget.init(config);
          edInstanceRef.current = ed;
          (window as any).__ED_INSTANCE__ = ed; // Store globally to prevent duplicates
          setIsInitialized(true);
          
          console.log('[EdWidgetWrapper] ✅✅✅ Ed widget initialized successfully!');
          console.log('[EdWidgetWrapper] Features enabled: orb (Particle3D), chat, voice (Fish Audio)');
          console.log('[EdWidgetWrapper] Fish Audio API key configured:', fishAudioApiKey ? 'YES' : 'NO');
          console.log('[EdWidgetWrapper] Fish Audio voice IDs configured:', Object.keys(fishAudioVoiceIds).length > 0 ? Object.keys(fishAudioVoiceIds).join(', ') : 'NONE (using default voices)');
        } catch (initError) {
          console.error('[EdWidgetWrapper] ❌ Failed to call EdWidget.init:', initError);
          initLockRef.current = false; // Release lock on error
        }
      };

      initEdWidget();
    }
  }, [isInitialized, mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (edInstanceRef.current && typeof window !== 'undefined') {
        try {
          const EdWidget = (window as any).EdWidget;
          if (EdWidget && EdWidget.destroy) {
            EdWidget.destroy();
          }
          edInstanceRef.current = null;
          setIsInitialized(false);
        } catch (error) {
          console.error('[EdWidgetWrapper] Error destroying Ed widget:', error);
        }
      }
    };
  }, []);

  // This component doesn't render anything - Ed widget renders itself
  // The widget creates its own DOM elements (orb with Particle3D, dock, chat interface, voice controls)
  return null;
}
