"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface EdWidgetWrapperProps {
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  organizationId?: string;
  userName?: string;
  schoolName?: string;
  /**
   * Mode for Ed widget:
   * - 'demo': For logged-out users on home page - explains system, shows off features
   * - 'user': For logged-in users - full functionality with access to user data
   */
  mode?: "demo" | "user";
  /** Supabase session access token — updated reactively when auth state changes */
  accessToken?: string;
  context?: any;
}

export default function EdWidgetWrapper({
  isOpen,
  onToggle,
  isMinimized,
  onToggleMinimize,
  organizationId,
  userName,
  schoolName,
  mode = "user", // Default to user mode
  accessToken: accessTokenProp,
}: EdWidgetWrapperProps) {
  const edInstanceRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initLockRef = useRef(false); // Prevent double initialization
  const ownsInstanceRef = useRef(false);

  useEffect(() => {
    // Initialize Ed widget once
    if (
      !isInitialized &&
      !initLockRef.current &&
      typeof window !== "undefined"
    ) {
      initLockRef.current = true; // Lock immediately to prevent race
      const win = window as any;

      // Check if already initialized globally
      if (win.__ED_INSTANCE__) {
        console.log("[EdWidgetWrapper] Ed widget already initialized globally");
        edInstanceRef.current = win.__ED_INSTANCE__;
        setIsInitialized(true);
        initLockRef.current = false;
        return;
      }

      if (win.__ED_INIT_PROMISE__) {
        win.__ED_INIT_PROMISE__
          .then((ed: any) => {
            if (ed) {
              edInstanceRef.current = ed;
              setIsInitialized(true);
            }
          })
          .finally(() => {
            initLockRef.current = false;
          });
        return;
      }

      // Initialize Ed widget with multiple fallback strategies
      const initEdWidget = async () => {
        let EdWidget: any;

        // Strategy 1: Try workspace package import (aliased to stub in next.config)
        try {
          const module = await import("@schoolgle/ed-widget").catch(() => null);
          if (module?.EdWidget) {
            EdWidget = module.EdWidget;
            console.log(
              "[EdWidgetWrapper] ✅ Loaded from @schoolgle/ed-widget package",
            );
          } else {
            throw new Error("Module not available");
          }
        } catch (moduleError: any) {
          // Strategy 2: Use global EdWidget (set by auto-init or script tag)
          if ((window as any).EdWidget) {
            EdWidget = (window as any).EdWidget;
            console.log("[EdWidgetWrapper] ✅ Using global EdWidget");
          } else {
            // Silently fail for marketing site - Ed widget is optional
            console.warn(
              "[EdWidgetWrapper] Ed widget not available (this is OK for marketing pages)",
            );
            initLockRef.current = false;
            return null;
          }
        }

        if (!EdWidget || !EdWidget.init) {
          console.error("[EdWidgetWrapper] ❌ EdWidget.init is not available");
          initLockRef.current = false;
          return null;
        }

        try {
          // Fish Audio is proxied through /api/fish-audio, so we pass a placeholder
          // The actual API key is stored server-side in the API route
          // Passing a non-empty string enables Fish Audio initialization
          const fishAudioApiKey =
            typeof window !== "undefined"
              ? process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY || "proxy-enabled"
              : "proxy-enabled";

          // Get voice IDs from environment variables (British UK accents)
          // These should be set in .env.local as NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ED and NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_EDWINA
          const fishAudioVoiceIds: Record<string, string> = {};
          if (typeof window !== "undefined") {
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ED) {
              fishAudioVoiceIds.ed =
                process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ED;
            }
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_EDWINA) {
              fishAudioVoiceIds.edwina =
                process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_EDWINA;
            }
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_SANTA) {
              fishAudioVoiceIds.santa =
                process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_SANTA;
            }
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ELF) {
              fishAudioVoiceIds.elf =
                process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ELF;
            }
            if (process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_HEADTEACHER) {
              fishAudioVoiceIds.headteacher =
                process.env.NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_HEADTEACHER;
            }
          }

          // Configure Ed based on mode
          // Website mode: Public visitors (parents, students) - school info only
          // Support mode: Pre-login - helps with login/access only
          // School mode: Post-login - full school support functionality

          // Determine mode from props and config
          let edMode: "website" | "support" | "school" = "support";
          if (mode === "demo" || (mode === "user" && !organizationId)) {
            // Demo mode or user without org = support mode (login help)
            edMode = "support";
          } else if (organizationId) {
            // Logged in with organization = school mode
            edMode = "school";
          }
          // website mode would be set explicitly if isWebsiteEmbed is true

          // Get Supabase access token for API auth
          let accessToken: string | undefined;
          try {
            const { supabase } = await import("@/lib/supabase");
            const { data } = await supabase.auth.getSession();
            accessToken = data.session?.access_token || undefined;
          } catch {
            /* ok */
          }

          const config: any = {
            position: "bottom-left",
            theme: "standard",
            persona: "ed",
            mode: edMode,
            provider: "api", // Use /api/ed/chat endpoint (preferred)
            apiBaseUrl: "/api/ed/chat",
            accessToken, // Supabase JWT for API auth
            organizationId: organizationId || undefined, // Pass org ID if logged in
            userName: userName || undefined, // User's display name for personalised greetings
            schoolName: schoolName || undefined, // School name for context
            features: {
              admissions: false, // Not for school support version
              policies: mode === "user",
              calendar: mode === "user",
              staffDirectory: false,
              formFill: false, // Disable form fill for school support
              voice: true, // Voice always enabled
            },
            // TTS Configuration - Use Fish Audio for voice output
            ttsProvider: "fish", // CRITICAL: Must be 'fish' to enable Fish Audio
            enableTTS: true, // Enable text-to-speech
            fishAudioApiKey: fishAudioApiKey, // Pass API key to enable Fish Audio
            fishAudioVoiceIds:
              Object.keys(fishAudioVoiceIds).length > 0
                ? fishAudioVoiceIds
                : undefined, // Pass voice IDs if configured
            disableBrowserTTS: false, // Allow browser TTS as fallback if Fish Audio fails
          };

          const ed = EdWidget.init(config);
          edInstanceRef.current = ed;
          ownsInstanceRef.current = true;
          win.__ED_INSTANCE__ = ed; // Store globally to prevent duplicates
          setIsInitialized(true);

          console.log(
            "[EdWidgetWrapper] ✅✅✅ Ed widget initialized successfully!",
          );
          console.log(
            "[EdWidgetWrapper] Features enabled: orb (Particle3D), chat, voice (Fish Audio)",
          );
          console.log(
            "[EdWidgetWrapper] Fish Audio API key configured:",
            fishAudioApiKey ? "YES" : "NO",
          );
          console.log(
            "[EdWidgetWrapper] Fish Audio voice IDs configured:",
            Object.keys(fishAudioVoiceIds).length > 0
              ? Object.keys(fishAudioVoiceIds).join(", ")
              : "NONE (using default voices)",
          );
        } catch (initError) {
          console.error(
            "[EdWidgetWrapper] ❌ Failed to call EdWidget.init:",
            initError,
          );
          initLockRef.current = false; // Release lock on error
          return null;
        }

        initLockRef.current = false;
        return edInstanceRef.current;
      };

      win.__ED_INIT_PROMISE__ = initEdWidget().finally(() => {
        if (win.__ED_INIT_PROMISE__) {
          delete win.__ED_INIT_PROMISE__;
        }
      });
    }
  }, [isInitialized, mode]);

  // Update access token when auth state changes (e.g. session refresh, initial login)
  useEffect(() => {
    if (!isInitialized || !accessTokenProp) return;
    const ed = edInstanceRef.current || (window as any).__ED_INSTANCE__;
    if (ed && ed.updateAuth) {
      ed.updateAuth(accessTokenProp, organizationId, undefined);
      console.log("[EdWidgetWrapper] 🔑 Access token updated");
    }
  }, [accessTokenProp, isInitialized, organizationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (
        edInstanceRef.current &&
        ownsInstanceRef.current &&
        typeof window !== "undefined"
      ) {
        try {
          const EdWidget = (window as any).EdWidget;
          if (EdWidget && EdWidget.destroy) {
            EdWidget.destroy();
          }
          delete (window as any).__ED_INSTANCE__;
          edInstanceRef.current = null;
          ownsInstanceRef.current = false;
          setIsInitialized(false);
        } catch (error) {
          console.error("[EdWidgetWrapper] Error destroying Ed widget:", error);
        }
      }
    };
  }, []);

  // Auto-scan website in website mode
  useEffect(() => {
    // Only scan in website mode with organization
    if (mode !== "demo" || !organizationId || !isInitialized) return;

    const triggerWebsiteScan = async () => {
      try {
        console.log(
          "[EdWidgetWrapper] 🌐 Website mode detected - triggering initial website scan",
        );

        // Get current page URL as base
        const websiteUrl = window.location.origin;

        const response = await fetch("/api/ed/website-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            websiteUrl,
            organizationId,
            fullScan: true, // Initial scan is always full
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("[EdWidgetWrapper] ✅ Website scan completed:", data);

          // Update Ed instance with knowledge
          const ed = edInstanceRef.current || (window as any).__ED_INSTANCE__;
          if (ed && ed.setKnowledgeBase) {
            ed.setKnowledgeBase({
              totalItems: data.knowledgeItems,
              pagesScanned: data.pagesScanned,
              lastScanned: new Date().toISOString(),
            });
          }
        } else {
          const error = await response.text();
          console.warn(
            "[EdWidgetWrapper] ⚠️ Website scan returned error:",
            error,
          );
        }
      } catch (error) {
        console.error("[EdWidgetWrapper] ❌ Website scan failed:", error);
      }
    };

    // Trigger scan after a short delay to let widget initialize
    const timeoutId = setTimeout(triggerWebsiteScan, 2000);
    return () => clearTimeout(timeoutId);
  }, [isInitialized, organizationId, mode]);

  // Listen for context events from EdChatButton components
  useEffect(() => {
    const handleContextEvent = (event: CustomEvent) => {
      const context = event.detail;
      console.log("[EdWidgetWrapper] Received context event:", context);

      const ed = edInstanceRef.current || (window as any).__ED_INSTANCE__;
      if (!ed) {
        console.warn("[EdWidgetWrapper] Ed instance not available for context");
        return;
      }

      // Open the widget if closed
      if (ed.open && typeof ed.open === "function") {
        ed.open();
      }

      // Set tool context for domain-specific expertise
      if (
        ed.setToolContext &&
        typeof ed.setToolContext === "function" &&
        context.domain
      ) {
        const domainNames: Record<string, string> = {
          legionella: "Legionella Control",
          fire: "Fire Safety",
          asbestos: "Asbestos Management",
          electrical: "Electrical Safety",
          gas: "Gas Safety",
          water: "Water Quality",
          mechanical: "Mechanical & Heating",
          lifts: "Lifts & LOLER",
          playground: "Playground Safety",
          accessibility: "Accessibility",
          security: "Security",
          manual_handling: "Manual Handling",
          working_at_height: "Working at Height",
        };

        const expertise: Record<string, string[]> = {
          legionella: [
            "Water temperature monitoring",
            "Sentinel outlet checks",
            "Flushing procedures",
            "HSE L8 compliance",
          ],
          fire: [
            "Weekly alarm testing",
            "Emergency lighting checks",
            "Extinguisher inspections",
            "RRO 2005 compliance",
          ],
          asbestos: [
            "Asbestos register management",
            "Annual visual inspections",
            "CAR 2012 compliance",
          ],
          electrical: [
            "Fixed wire testing",
            "PAT testing",
            "EICR certificates",
            "EAWR 1989 compliance",
          ],
          gas: [
            "Annual gas safety checks",
            "CP12 certificates",
            "Gas Safe requirements",
          ],
          water: [
            "Drinking water quality testing",
            "Tank inspections",
            "UKAS lab requirements",
          ],
          mechanical: [
            "Boiler servicing",
            "Ventilation maintenance",
            "AHU filter checks",
          ],
          lifts: [
            "6-monthly LOLER examinations",
            "Daily inspections",
            "LOLER 1998 compliance",
          ],
          playground: [
            "Annual equipment inspections",
            "Surfacing checks",
            "RPII requirements",
          ],
          accessibility: [
            "Accessibility statements",
            "Route inspections",
            "Equality Act compliance",
          ],
          security: ["Perimeter checks", "CCTV maintenance", "Access control"],
          manual_handling: ["Risk assessment reviews", "Training requirements"],
          working_at_height: [
            "Equipment inspections",
            "Ladder safety",
            "WAH 2005 compliance",
          ],
        };

        ed.setToolContext({
          name: domainNames[context.domain] || context.domain,
          category: "Estates",
          url: `/estates-compliance/${context.domain}`,
          expertise: expertise[context.domain] || [
            "Statutory compliance",
            "Risk assessment",
            "Record keeping",
          ],
        });
      }

      // Send initial message if provided
      if (context.initialMessage) {
        setTimeout(() => {
          const input = document.querySelector(
            "#chat-input",
          ) as HTMLInputElement;
          if (input) {
            input.value = context.initialMessage;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            // Trigger send
            const sendBtn = document.querySelector(
              "#send-btn",
            ) as HTMLButtonElement;
            if (sendBtn) {
              sendBtn.click();
            }
          }
        }, 500);
      }
    };

    // Add event listener
    window.addEventListener(
      "ed-open-with-context",
      handleContextEvent as EventListener,
    );

    return () => {
      window.removeEventListener(
        "ed-open-with-context",
        handleContextEvent as EventListener,
      );
    };
  }, []);

  // Proactive Engine: Monitor URL changes and trigger suggestions
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathnameRef = useRef<string>("");

  useEffect(() => {
    if (mode !== "user" || !organizationId || !isInitialized) return;

    // Only trigger if path actually changed (ignore query params for proactivity usually,
    // or include them if specific like ?checkId=...)
    if (pathname === lastPathnameRef.current) return;
    lastPathnameRef.current = pathname;

    const checkProactivity = async () => {
      try {
        const response = await fetch("/api/ed/proactive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: pathname,
            organizationId,
          }),
        });

        const data = await response.json();
        if (data.success && data.suggestions && data.suggestions.length > 0) {
          const ed = edInstanceRef.current || (window as any).__ED_INSTANCE__;
          if (ed && ed.addMessage) {
            // Ed 'thinks' for a second then speaks
            setTimeout(() => {
              const greeting =
                `👋 **Ed here!** I've noticed something you might find helpful for ${data.domain}:\n\n` +
                data.suggestions.map((s: string) => `• ${s}`).join("\n");

              ed.addMessage({
                role: "assistant",
                content: greeting,
                proactive: true,
              });

              // Optional: Speak it too if voice is enabled and user is not busy
              if (ed.speak && !isOpen) {
                ed.speak(
                  "I've found some compliance alerts for this page. Click me to view them.",
                );
              }
            }, 2000);
          }
        }
      } catch (error) {
        console.error("[EdWidgetWrapper] Proactive check failed:", error);
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
