"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface EdWidgetWrapperProps {
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  organizationId?: string;
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
  organizationId,
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
          // Strategy 2: Try workspace package import (only if available)
          try {
            // Use dynamic import with error handling to avoid build-time errors
            const module = await import('@schoolgle/ed-widget').catch(() => null);
            if (module?.EdWidget) {
              EdWidget = module.EdWidget;
              console.log('[EdWidgetWrapper] ✅ Loaded from @schoolgle/ed-widget package');
            } else {
              throw new Error('Module not available');
            }
          } catch (moduleError: any) {
            // Strategy 3: Use global EdWidget (set by auto-init or script tag)
            if ((window as any).EdWidget) {
              EdWidget = (window as any).EdWidget;
              console.log('[EdWidgetWrapper] ✅ Using global EdWidget');
            } else {
              // Silently fail for marketing site - Ed widget is optional
              console.warn('[EdWidgetWrapper] Ed widget not available (this is OK for marketing pages)');
              initLockRef.current = false;
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
            // TTS Configuration - Use Fish Audio for voice output
            ttsProvider: 'fish', // CRITICAL: Must be 'fish' to enable Fish Audio
            enableTTS: true, // Enable text-to-speech
            fishAudioApiKey: fishAudioApiKey, // Pass API key to enable Fish Audio
            fishAudioVoiceIds: Object.keys(fishAudioVoiceIds).length > 0 ? fishAudioVoiceIds : undefined, // Pass voice IDs if configured
            disableBrowserTTS: false, // Allow browser TTS as fallback if Fish Audio fails
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

  // Listen for context events from EdChatButton components
  useEffect(() => {
    const handleContextEvent = (event: CustomEvent) => {
      const context = event.detail;
      console.log('[EdWidgetWrapper] Received context event:', context);

      const ed = edInstanceRef.current || (window as any).__ED_INSTANCE__;
      if (!ed) {
        console.warn('[EdWidgetWrapper] Ed instance not available for context');
        return;
      }

      // Open the widget if closed
      if (ed.open && typeof ed.open === 'function') {
        ed.open();
      }

      // Set tool context for domain-specific expertise
      if (ed.setToolContext && typeof ed.setToolContext === 'function' && context.domain) {
        const domainNames: Record<string, string> = {
          legionella: 'Legionella Control',
          fire: 'Fire Safety',
          asbestos: 'Asbestos Management',
          electrical: 'Electrical Safety',
          gas: 'Gas Safety',
          water: 'Water Quality',
          mechanical: 'Mechanical & Heating',
          lifts: 'Lifts & LOLER',
          playground: 'Playground Safety',
          accessibility: 'Accessibility',
          security: 'Security',
          manual_handling: 'Manual Handling',
          working_at_height: 'Working at Height',
        };

        const expertise: Record<string, string[]> = {
          legionella: ['Water temperature monitoring', 'Sentinel outlet checks', 'Flushing procedures', 'HSE L8 compliance'],
          fire: ['Weekly alarm testing', 'Emergency lighting checks', 'Extinguisher inspections', 'RRO 2005 compliance'],
          asbestos: ['Asbestos register management', 'Annual visual inspections', 'CAR 2012 compliance'],
          electrical: ['Fixed wire testing', 'PAT testing', 'EICR certificates', 'EAWR 1989 compliance'],
          gas: ['Annual gas safety checks', 'CP12 certificates', 'Gas Safe requirements'],
          water: ['Drinking water quality testing', 'Tank inspections', 'UKAS lab requirements'],
          mechanical: ['Boiler servicing', 'Ventilation maintenance', 'AHU filter checks'],
          lifts: ['6-monthly LOLER examinations', 'Daily inspections', 'LOLER 1998 compliance'],
          playground: ['Annual equipment inspections', 'Surfacing checks', 'RPII requirements'],
          accessibility: ['Accessibility statements', 'Route inspections', 'Equality Act compliance'],
          security: ['Perimeter checks', 'CCTV maintenance', 'Access control'],
          manual_handling: ['Risk assessment reviews', 'Training requirements'],
          working_at_height: ['Equipment inspections', 'Ladder safety', 'WAH 2005 compliance'],
        };

        ed.setToolContext({
          name: domainNames[context.domain] || context.domain,
          category: 'Estates',
          url: `/estates-compliance/${context.domain}`,
          expertise: expertise[context.domain] || ['Statutory compliance', 'Risk assessment', 'Record keeping'],
        });
      }

      // Send initial message if provided
      if (context.initialMessage) {
        setTimeout(() => {
          const input = document.querySelector('#chat-input') as HTMLInputElement;
          if (input) {
            input.value = context.initialMessage;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            // Trigger send
            const sendBtn = document.querySelector('#send-btn') as HTMLButtonElement;
            if (sendBtn) {
              sendBtn.click();
            }
          }
        }, 500);
      }
    };

    // Add event listener
    window.addEventListener('ed-open-with-context', handleContextEvent as EventListener);

    return () => {
      window.removeEventListener('ed-open-with-context', handleContextEvent as EventListener);
    };
  }, []);

  // Proactive Engine: Monitor URL changes and trigger suggestions
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathnameRef = useRef<string>("");

  useEffect(() => {
    if (mode !== 'user' || !organizationId || !isInitialized) return;

    // Only trigger if path actually changed (ignore query params for proactivity usually, 
    // or include them if specific like ?checkId=...)
    if (pathname === lastPathnameRef.current) return;
    lastPathnameRef.current = pathname;

    const checkProactivity = async () => {
      try {
        const response = await fetch('/api/ed/proactive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: pathname,
            organizationId
          })
        });

        const data = await response.json();
        if (data.success && data.suggestions && data.suggestions.length > 0) {
          const ed = edInstanceRef.current || (window as any).__ED_INSTANCE__;
          if (ed && ed.addMessage) {
            // Ed 'thinks' for a second then speaks
            setTimeout(() => {
              const greeting = `👋 **Ed here!** I've noticed something you might find helpful for ${data.domain}:\n\n` +
                data.suggestions.map((s: string) => `• ${s}`).join('\n');

              ed.addMessage({
                role: 'assistant',
                content: greeting,
                proactive: true
              });

              // Optional: Speak it too if voice is enabled and user is not busy
              if (ed.speak && !isOpen) {
                ed.speak("I've found some compliance alerts for this page. Click me to view them.");
              }
            }, 2000);
          }
        }
      } catch (error) {
        console.error('[EdWidgetWrapper] Proactive check failed:', error);
      }
    };

    // Delay a bit to allow page content to settle
    const timeoutId = setTimeout(checkProactivity, 3000);
    return () => clearTimeout(timeoutId);
  }, [pathname, isInitialized, organizationId, mode, isOpen]);

  // This component doesn't render anything - Ed widget renders itself
  // The widget creates its own DOM elements (orb with Particle3D, dock, chat interface, voice controls)
  return null;
}
