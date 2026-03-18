/**
 * Ed - Main Widget Class
 * Orchestrates all components and handles state
 */

import { Particle3D } from "./components/Particle3D";
import { Dock } from "./components/Dock";
import { Chat } from "./components/Chat";
import { VoiceInput } from "./components/VoiceInput";
import { StatusPill } from "./components/StatusPill";
import { EmojiTester } from "./components/EmojiTester";
import { GeminiClient } from "./ai/gemini";
import { EdAPIClient } from "./ai/api-client";
import { getPersona, personas } from "./ai/prompts";
import { languages, getLanguage } from "./utils/flags";
import { FormFiller } from "./features/formFill";
import { ProactiveService } from "./features/proactive";
import { FishAudioVoice } from "./voice/fish-audio";
import { getIntroForPersona, processAIResponse } from "./voice/intro-scripts";
import { pageScanner } from "./features/pageScan";
import type {
  EdConfig,
  Message,
  ParticleShape,
  PersonaType,
  Language,
} from "./types";

const DEFAULT_CONFIG: EdConfig = {
  schoolId: "demo",
  theme: "standard",
  position: "bottom-right",
  language: "en-GB",
  persona: "ed",
  features: {
    admissions: true,
    policies: true,
    calendar: true,
    staffDirectory: false,
    formFill: true,
    voice: true,
  },
};

export class Ed {
  private config: EdConfig;
  private container: HTMLElement;
  private widget: HTMLElement | null = null;
  private isOpen = false;
  private isListening = false;

  // Drag state
  private isDragging = false;
  private wasDragged = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartLeft = 0;
  private dragStartTop = 0;
  private launcherPosition: { x: number; y: number } | null = null;
  private static POSITION_KEY = "ed-widget-position";

  // Components
  private particle3D: Particle3D | null = null;
  private launcherParticle3D: Particle3D | null = null;
  private dock: Dock | null = null;
  private chat: Chat | null = null;
  private voice: VoiceInput | null = null;
  private ai: GeminiClient | null = null;
  private apiClient: EdAPIClient | null = null; // API client for /api/ed/chat
  private formFiller: FormFiller | null = null;
  private proactive: ProactiveService | null = null;
  private fishVoice: FishAudioVoice | null = null;
  private statusPill: StatusPill | null = null;
  private emojiTester: EmojiTester | null = null;

  // State
  private messages: Message[] = [];
  private currentLanguage: Language;
  private currentPersona: PersonaType;
  private currentTheme: string;
  private showKeyboard = false;
  private toolContext: {
    name: string;
    category: string;
    url?: string;
    expertise: string[];
  } | null = null;
  private mode: "website" | "support" | "school" = "school"; // website = public visitors, support = pre-login, school = logged-in
  private pendingImage: string | null = null; // Base64 image awaiting next message

  constructor(config: Partial<EdConfig> = {}) {
    // Read from window.ED_CONFIG if available (extension context)
    const edConfig = (window as any).ED_CONFIG;

    // Merge: window.ED_CONFIG (extension) > passed config > defaults
    const mergedConfig: Partial<EdConfig> = {
      ...DEFAULT_CONFIG,
      ...config,
      ...(edConfig
        ? {
            // Only override with ED_CONFIG if it exists
            geminiApiKey: edConfig.geminiApiKey || config.geminiApiKey,
            openRouterApiKey:
              edConfig.openRouterApiKey || config.openRouterApiKey,
            fishAudioApiKey: edConfig.fishAudioApiKey || config.fishAudioApiKey,
            provider: edConfig.provider || config.provider,
            enableAI:
              edConfig.enableAI !== undefined
                ? edConfig.enableAI
                : config.enableAI,
            enableTTS:
              edConfig.enableTTS !== undefined
                ? edConfig.enableTTS
                : config.enableTTS,
            ttsProvider: edConfig.ttsProvider || config.ttsProvider,
            schoolId: edConfig.schoolId || config.schoolId,
            language: edConfig.language || config.language,
            persona: edConfig.persona || config.persona,
          }
        : {}),
    };

    this.config = mergedConfig as EdConfig;
    this.currentLanguage = getLanguage(this.config.language);
    this.currentPersona = this.config.persona;
    this.currentTheme = this.config.theme;

    // Determine mode from config (website = public visitors, support = pre-login help, school = logged-in staff)
    const configuredMode = (this.config as any).mode;
    if (configuredMode) {
      this.mode = configuredMode;
    } else if ((this.config as any).isWebsiteEmbed) {
      this.mode = "website";
    } else if ((this.config as any).organizationId) {
      this.mode = "school";
    } else {
      this.mode = "support";
    }

    // Log mode
    const modeNames = {
      website: "🌐 Website mode (public visitors - parents, students)",
      support: "🔓 Support mode (pre-login help)",
      school: "🏫 School mode (logged-in staff support)",
    };
    console.log(`[Ed] Mode: ${this.mode} - ${modeNames[this.mode]}`);

    // Log configuration
    if (edConfig) {
      console.log("[Ed] Provider:", edConfig.provider || "not set");
      console.log(
        "[Ed] TTS:",
        edConfig.enableTTS ? edConfig.ttsProvider || "browser" : "disabled",
      );
      console.log("[Ed] Keys present:", {
        openrouter: !!(this.config as any).openRouterApiKey,
        gemini: !!this.config.geminiApiKey,
        fish: !!this.config.fishAudioApiKey,
      });
    }

    // Create container
    this.container = document.createElement("div");
    this.container.id = "ed-widget-container";
    this.container.className = `ed-widget-container ed-position-${this.config.position}`;
    document.body.appendChild(this.container);

    // Initialize components
    this.initComponents();
    this.render();
    this.bindEvents();

    // Check for forms on page
    if (this.config.features.formFill) {
      this.formFiller = new FormFiller();
      this.checkForForms();
    }

    // Initialize proactive service
    this.proactive = new ProactiveService((message) => {
      this.handleProactiveNudge(message);
    });

    console.log("[Ed] Widget initialized", this.config);
  }

  private initComponents(): void {
    const provider = (this.config as any).provider || "api"; // Default to 'api' for Schoolgle
    const enableAI = (this.config as any).enableAI !== false; // Default to true
    const enableTTS = (this.config as any).enableTTS !== false; // Default to true
    const ttsProvider = (this.config as any).ttsProvider || "browser";

    // Log mode
    console.log(
      `[Ed] Mode: ${this.mode} (${this.mode === "support" ? "pre-login support" : "logged-in school support"})`,
    );

    // API Client - uses /api/ed/chat endpoint (preferred for Schoolgle)
    if (provider === "api" || (this.config as any).organizationId) {
      const apiBaseUrl = (this.config as any).apiBaseUrl || "/api/ed/chat";
      this.apiClient = new EdAPIClient(
        apiBaseUrl,
        (this.config as any).organizationId,
        (this.config as any).userId,
        (this.config as any).accessToken,
      );
      console.log("[Ed] ✅ API client initialized for", apiBaseUrl);
    }

    // AI Client - fallback to Gemini if API client not available
    if (enableAI && !this.apiClient) {
      if (provider === "gemini" && this.config.geminiApiKey) {
        try {
          this.ai = new GeminiClient(this.config.geminiApiKey);
          // Check available models (async, won't block)
          this.ai
            .listAvailableModels()
            .then((models) => {
              if (models.length > 0) {
                console.log(
                  `[Ed] ✅ Gemini API connected. Available models: ${models.join(", ")}`,
                );
              } else {
                console.warn(
                  "[Ed] ⚠️ Gemini API connected but no models found. Check your API key permissions.",
                );
              }
            })
            .catch((err) => {
              console.warn("[Ed] ⚠️ Could not list Gemini models:", err);
            });
        } catch (error) {
          console.error("[Ed] ❌ Gemini client initialization failed:", error);
        }
      } else if (
        provider === "openrouter" &&
        (this.config as any).openRouterApiKey
      ) {
        // TODO: Initialize OpenRouter client when implemented
        console.log(
          "[Ed] ✅ OpenRouter provider selected (client initialization pending)",
        );
      } else {
        // Only warn if AI is enabled but provider/key not set
        if (provider === "gemini" && !this.config.geminiApiKey) {
          console.debug(
            "[Ed] Gemini provider selected but API key not set. AI features disabled.",
          );
        } else if (
          provider === "openrouter" &&
          !(this.config as any).openRouterApiKey
        ) {
          console.debug(
            "[Ed] OpenRouter provider selected but API key not set. AI features disabled.",
          );
        }
      }
    } else if (!this.apiClient) {
      console.log("[Ed] AI disabled in configuration");
    }

    // Fish Audio Voice - only initialize if TTS is enabled and provider is fish
    if (enableTTS && ttsProvider === "fish") {
      if (
        this.config.fishAudioApiKey &&
        this.config.fishAudioApiKey.trim() !== ""
      ) {
        try {
          this.fishVoice = new FishAudioVoice(
            this.config.fishAudioApiKey,
            this.config.fishAudioVoiceIds,
          );
          console.log("[Ed] ✅ Fish Audio voice initialized", {
            hasApiKey: !!this.config.fishAudioApiKey,
            voiceIds: this.config.fishAudioVoiceIds,
          });
        } catch (error) {
          console.error("[Ed] ❌ Fish Audio initialization failed:", error);
        }
      } else {
        console.debug(
          "[Ed] Fish Audio provider selected but API key not set. Falling back to browser TTS.",
        );
      }
    } else if (enableTTS && ttsProvider === "browser") {
      console.log("[Ed] Using browser TTS");
    } else {
      console.log("[Ed] TTS disabled in configuration");
    }

    // Voice input
    if (this.config.features.voice) {
      this.voice = new VoiceInput(this.currentLanguage.voiceLang);
      this.voice.onResult((text) => this.handleUserInput(text));
      this.voice.onListeningChange((listening) => {
        this.isListening = listening;
        this.dock?.setListening(listening);
      });
    }
  }

  private render(): void {
    // Render trigger button
    this.renderTriggerButton();
  }

  private renderTriggerButton(): void {
    // Create launcher group matching original structure
    const launcherGroup = document.createElement("div");
    launcherGroup.id = "launcher-group";
    launcherGroup.innerHTML = `
      <div class="launcher-label">Ask Ed</div>
      <div id="launcher-btn" title="Open Assistant — drag to move">
        <div id="launcher-logo-container"></div>
      </div>
    `;

    const launcherBtn = launcherGroup.querySelector(
      "#launcher-btn",
    ) as HTMLElement;
    launcherBtn.addEventListener("click", (e) => {
      // Only toggle if not a drag
      if (!this.wasDragged) {
        this.toggle();
      }
      this.wasDragged = false;
    });

    // Check for sidebar slot — if present, dock Ed there instead of floating
    const sidebarSlot = document.getElementById("ed-sidebar-slot");
    if (sidebarSlot && !this.hasSavedPosition()) {
      // Dock in sidebar: render inline, not fixed
      launcherGroup.style.position = "relative";
      launcherGroup.style.bottom = "auto";
      launcherGroup.style.right = "auto";
      sidebarSlot.appendChild(launcherGroup);
    } else {
      // Floating mode: append to widget container
      this.container.appendChild(launcherGroup);
      // Restore saved position if any
      this.restoreLauncherPosition(launcherGroup);
    }

    // Make launcher draggable (works in both modes — dragging out of sidebar goes to fixed position)
    this.makeDraggable(launcherGroup);

    // Create Particle3D logo for launcher button (instead of CSS version)
    this.createParticle3DLogo();
  }

  private hasSavedPosition(): boolean {
    try {
      const saved = localStorage.getItem(Ed.POSITION_KEY);
      if (saved) {
        const pos = JSON.parse(saved);
        return pos.x >= 0 && pos.y >= 0;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  private restoreLauncherPosition(launcher: HTMLElement): void {
    try {
      const saved = localStorage.getItem(Ed.POSITION_KEY);
      if (saved) {
        const pos = JSON.parse(saved);
        // Validate position is still on screen
        if (
          pos.x >= 0 &&
          pos.x <= window.innerWidth - 64 &&
          pos.y >= 0 &&
          pos.y <= window.innerHeight - 64
        ) {
          this.launcherPosition = pos;
          this.applyLauncherPosition(launcher, pos);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  private applyLauncherPosition(
    launcher: HTMLElement,
    pos: { x: number; y: number },
  ): void {
    // Override CSS positioning — use fixed position directly on the launcher
    // z-index must be above ALL page content (sidebars, modals, overlays)
    launcher.style.position = "fixed";
    launcher.style.left = `${pos.x}px`;
    launcher.style.top = `${pos.y}px`;
    launcher.style.bottom = "auto";
    launcher.style.right = "auto";
    launcher.style.zIndex = "999999";
  }

  private makeDraggable(launcher: HTMLElement): void {
    let activePointerId: number | null = null;

    const onPointerDown = (e: PointerEvent) => {
      // Only drag with primary button
      if (e.button !== 0) return;

      this.isDragging = false;
      this.wasDragged = false;
      activePointerId = e.pointerId;

      const rect = launcher.getBoundingClientRect();
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragStartLeft = rect.left;
      this.dragStartTop = rect.top;

      // Don't capture yet — capture only when drag threshold is met
      // This allows click events to fire normally for non-drag clicks
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;

      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;

      // Require minimum movement to start drag (prevents accidental drags on click)
      if (!this.isDragging && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

      // First time crossing threshold — capture pointer and begin drag
      if (!this.isDragging) {
        this.isDragging = true;
        try {
          launcher.setPointerCapture(e.pointerId);
        } catch {
          /* ok */
        }
        launcher.style.cursor = "grabbing";
        launcher.style.transition = "none";
      }

      // Calculate new position, clamped to viewport
      const x = Math.max(
        0,
        Math.min(window.innerWidth - 80, this.dragStartLeft + dx),
      );
      const y = Math.max(
        0,
        Math.min(window.innerHeight - 80, this.dragStartTop + dy),
      );

      this.applyLauncherPosition(launcher, { x, y });
      this.launcherPosition = { x, y };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      activePointerId = null;

      if (launcher.hasPointerCapture(e.pointerId)) {
        launcher.releasePointerCapture(e.pointerId);
      }
      launcher.style.cursor = "";
      launcher.style.transition = "";

      if (this.isDragging) {
        this.wasDragged = true;
        this.isDragging = false;

        // Snap to nearest edge for tidiness
        if (this.launcherPosition) {
          const midX = window.innerWidth / 2;
          const snappedX =
            this.launcherPosition.x < midX ? 20 : window.innerWidth - 84;
          this.launcherPosition = { x: snappedX, y: this.launcherPosition.y };

          launcher.style.transition = "left 0.2s ease, top 0.2s ease";
          this.applyLauncherPosition(launcher, this.launcherPosition);

          // Save position
          try {
            localStorage.setItem(
              Ed.POSITION_KEY,
              JSON.stringify(this.launcherPosition),
            );
          } catch {
            /* ignore */
          }
        }
      }
    };

    launcher.addEventListener("pointerdown", onPointerDown);
    launcher.addEventListener("pointermove", onPointerMove);
    launcher.addEventListener("pointerup", onPointerUp);
    // Prevent text selection during drag
    launcher.style.touchAction = "none";
    launcher.style.userSelect = "none";
  }

  private createParticle3DLogo(): void {
    const container = document.getElementById("launcher-logo-container");
    if (!container) return;

    // Create canvas container for Particle3D
    const canvasContainer = document.createElement("div");
    canvasContainer.id = "launcher-particle3d-container";
    canvasContainer.style.cssText = `
      width: 60px;
      height: 60px;
      position: relative;
      display: block;
    `;

    container.appendChild(canvasContainer);

    // Initialize Particle3D for launcher (solar system mode, always visible)
    try {
      this.launcherParticle3D = new Particle3D(canvasContainer);
      this.launcherParticle3D.start();
      // Keep in solar system mode (not active/chaser mode)
      this.launcherParticle3D.setActive(false);
      console.log("[Ed] Launcher Particle3D initialized");
    } catch (error) {
      console.error("[Ed] Failed to initialize launcher Particle3D:", error);
      // Fallback to simple circle if WebGL fails
      canvasContainer.innerHTML =
        '<div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>';
    }
  }

  private renderWidget(): void {
    if (this.widget) return;

    // Create app-panel matching original structure
    this.widget = document.createElement("div");
    this.widget.id = "app-panel";
    this.widget.className = `theme-${this.currentTheme}`;
    this.widget.innerHTML = `
      <div class="status-pill" id="status-pill">Ready</div>
      
      <!-- Chat Container -->
      <div class="chat-container">
        <div id="chat-messages" class="chat-scroll scrollbar-hide"></div>
        <div class="input-bar">
          <input type="text" id="chat-input" placeholder="Ask Ed anything..." class="bg-transparent border-none text-white text-sm placeholder-slate-400 flex-grow outline-none" autocomplete="off">
          <input type="file" id="image-upload" accept="image/*" capture="environment" style="display:none">
          <button id="camera-btn" class="text-slate-400 hover:text-teal-400 transition-colors" title="Share a photo or screenshot">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>
          <button id="screen-btn" class="text-slate-400 hover:text-teal-400 transition-colors" title="Share your screen so Ed can see what you see">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </button>
          <button id="send-btn" class="text-teal-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Dock -->
      <div id="app-dock"></div>
      
      <!-- 3D PARTICLE AVATAR CONTAINER (Inside app-panel, matching Gemini) -->
      <div id="canvas-container"></div>
    `;

    this.container.appendChild(this.widget);

    // Add widget-active class to body when open
    if (this.isOpen) {
      document.body.classList.add("widget-active");
    }

    // Initialize 3D particle avatar (canvas-container)
    const canvasContainer = this.widget.querySelector(
      "#canvas-container",
    ) as HTMLElement;
    if (canvasContainer) {
      console.log(
        "[Ed] Initializing particle system in container:",
        canvasContainer,
      );
      // Ensure container is visible and has dimensions
      canvasContainer.style.display = "block";
      canvasContainer.style.visibility = "visible";
      canvasContainer.style.opacity = "1";
      canvasContainer.style.width = "300px";
      canvasContainer.style.height = "300px";
      canvasContainer.style.position = "absolute";
      canvasContainer.style.bottom = "60px";
      canvasContainer.style.right = "0";
      canvasContainer.style.zIndex = "10";
      this.particle3D = new Particle3D(canvasContainer);
      // Don't start here - will start when widget opens
    } else {
      console.error("[Ed] Canvas container not found!");
    }

    // Initialize chat (chat-messages container)
    const chatMessages = this.widget.querySelector(
      "#chat-messages",
    ) as HTMLElement;
    this.chat = new Chat(chatMessages, (text: string) => {
      // Handle quick reply click - check if it's a language switch
      if (text.includes("🇬🇧") || text.includes("English")) {
        this.setLanguage("en-GB");
      } else if (text.includes("🇵🇱") || text.includes("Polski")) {
        this.setLanguage("pl");
      } else if (text.includes("🇷🇴") || text.includes("Română")) {
        this.setLanguage("ro");
      } else if (text.includes("🇪🇸") || text.includes("Español")) {
        this.setLanguage("es");
      } else {
        // Regular message
        this.handleUserInput(text);
      }
    });

    // Initialize status pill
    const statusPillEl = this.widget.querySelector(
      "#status-pill",
    ) as HTMLElement;
    if (statusPillEl) {
      this.statusPill = new StatusPill(this.widget);
    }

    // Initialize dock
    const dockEl = this.widget.querySelector("#app-dock") as HTMLElement;
    this.dock = new Dock(dockEl, {
      onAction: (action) => this.handleDockAction(action),
      onToolAction: (tool: string) => this.handleToolAction(tool),
      onSettingChange: (theme: string) => this.setTheme(theme as any),
      onLanguageChange: (lang: string) => this.setLanguage(lang),
      onPersonaChange: (persona: string) =>
        this.setPersona(persona as PersonaType),
    });

    // Bind input events (matching original IDs)
    const input = this.widget.querySelector("#chat-input") as HTMLInputElement;
    const sendBtn = this.widget.querySelector("#send-btn") as HTMLButtonElement;

    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        this.handleUserInput(input.value.trim());
        input.value = "";
      }
    });

    sendBtn?.addEventListener("click", () => {
      if (input.value.trim()) {
        this.handleUserInput(input.value.trim());
        input.value = "";
      }
    });

    // Vision: camera button triggers file upload
    const cameraBtn = this.widget.querySelector(
      "#camera-btn",
    ) as HTMLButtonElement;
    const imageUpload = this.widget.querySelector(
      "#image-upload",
    ) as HTMLInputElement;
    const screenBtn = this.widget.querySelector(
      "#screen-btn",
    ) as HTMLButtonElement;

    cameraBtn?.addEventListener("click", () => {
      imageUpload?.click();
    });

    imageUpload?.addEventListener("change", () => {
      const file = imageUpload.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.pendingImage = reader.result as string;
        // Show preview indicator
        this.addMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: `📷 Image attached: ${file.name}`,
          timestamp: new Date(),
          language: this.currentLanguage.code,
        });
        input?.focus();
        input.placeholder = "Describe what you need help with...";
      };
      reader.readAsDataURL(file);
      imageUpload.value = ""; // Reset for re-use
    });

    screenBtn?.addEventListener("click", async () => {
      if (!this.apiClient) return;

      // Toggle screen sharing on/off
      if (this.apiClient.isScreenSharing) {
        this.apiClient.stopScreenShare();
        screenBtn.style.color = ""; // Reset to default
        screenBtn.title = "Share your screen so Ed can see what you see";
        this.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Screen sharing stopped. I can no longer see your screen.",
          timestamp: new Date(),
          language: this.currentLanguage.code,
        });
      } else {
        const started = await this.apiClient.startScreenShare();
        if (started) {
          screenBtn.style.color = "#2dd4bf"; // Teal = active
          screenBtn.title = "Stop screen sharing";
          this.addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I can now see your screen. Just ask me anything and I'll look at what you're seeing. Click the screen icon again to stop sharing.",
            timestamp: new Date(),
            language: this.currentLanguage.code,
          });
        } else {
          this.addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Screen sharing wasn't started. You can use the camera button to upload a screenshot instead.",
            timestamp: new Date(),
            language: this.currentLanguage.code,
          });
        }
      }
    });
  }

  private bindEvents(): void {
    // Listen for escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }

  private greetingShown = false;

  private showGreeting(): void {
    // Only show greeting once per widget lifecycle
    if (this.greetingShown) return;
    this.greetingShown = true;

    const persona = getPersona(this.currentPersona);

    // Check if first visit
    const isFirstVisit = !localStorage.getItem("ed-visited");
    if (isFirstVisit) {
      localStorage.setItem("ed-visited", "true");
    }

    // Get greeting based on mode — keep it short and warm
    let greeting: string;

    // Try to get the school name from config
    const schoolName = (this.config as any).schoolName || "";
    const schoolId = this.config.schoolId || "";
    // Derive a friendly name from schoolId if no explicit name
    const friendlyName =
      schoolName ||
      (schoolId !== "demo"
        ? schoolId
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "");

    if (this.mode === "website") {
      // Website visitor — parent, prospective family, community member
      const welcome = friendlyName ? `Welcome to ${friendlyName}!` : "Welcome!";
      greeting = `Hi! ${welcome} I'm Ed, the school assistant.\n\nHow can I help you today?`;
    } else if (this.mode === "support") {
      // Pre-login — needs help accessing Schoolgle
      greeting = `Hi! I'm Ed. Need help logging in or finding something?`;
    } else {
      // Logged-in staff member
      const name = (this.config as any).userName;
      const nameGreet = name ? `Hi ${name}!` : "Hi!";
      greeting = `${nameGreet} I'm Ed, your school assistant. What can I help with?`;
    }

    // Display greeting (clean for chat, but keep original for voice)
    const displayText = this.cleanTextForDisplay(greeting);

    this.addMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: displayText, // Clean text for display
      timestamp: new Date(),
      language: this.currentLanguage.code,
    });

    // Morph avatar based on context
    const hasForm = this.formFiller && this.formFiller.detectForms().length > 0;
    if (hasForm) {
      setTimeout(() => this.particle3D?.morphTo("pencil"), 1000);
      setTimeout(() => this.particle3D?.morphTo("sphere"), 3000);
    }

    // Speak greeting with emotions (Fish Audio) or fallback
    if (this.config.features.voice) {
      // Stop any ongoing speech first (async to prevent conflicts)
      this.stopAllSpeechAsync().then(() => {
        if (this.fishVoice) {
          // Use Fish Audio - REMOVE emotion tags as Fish Audio doesn't support them in text
          // Fish Audio uses voice cloning for emotion, not text tags
          const cleanGreeting = this.cleanTextForDisplay(greeting);
          console.log("[Ed] Using Fish Audio for greeting");
          this.fishVoice
            .speakAndPlay(
              cleanGreeting,
              this.currentPersona,
              this.currentLanguage.code,
            )
            .then(() => {
              console.log("[Ed] Fish Audio greeting playback completed");
            })
            .catch((error) => {
              console.error("[Ed] Fish Audio error:", error);
              console.error("[Ed] Error details:", error.message);
              // Don't fallback to browser TTS - it causes dual audio
              // Only log the error and continue silently
              console.warn(
                "[Ed] Skipping browser TTS fallback to prevent dual audio",
              );
            });
        } else {
          // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
          // This is an emergency fallback only
          if (!this.config.disableBrowserTTS) {
            console.debug("[Ed] Using browser TTS for greeting");
            this.speak(displayText);
          }
        }
      });
    }
  }

  private getLocalizedGreeting(): string {
    const persona = getPersona(this.currentPersona);
    if (this.currentLanguage.code === "en-GB") {
      return persona.greeting;
    }
    return this.currentLanguage.greeting;
  }

  private async handleUserInput(text: string): Promise<void> {
    // Auto-detect language from user input (switch silently — no system message)
    const detectedLang = this.detectLanguage(text);
    if (detectedLang && detectedLang.code !== this.currentLanguage.code) {
      this.setLanguage(detectedLang.code, true);
    }

    // ── Form Filling Mode ────────────────────────────────────
    if (this.formFiller?.isActive) {
      const formResponse = this.handleFormInput(text);
      if (formResponse) {
        this.addMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: new Date(),
          language: this.currentLanguage.code,
        });
        this.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: formResponse,
          timestamp: new Date(),
          language: this.currentLanguage.code,
        });
        this.speakResponse(formResponse);
        return;
      }
    }

    // Add user message with translation if needed
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
      language: this.currentLanguage.code,
    };

    // If language is not English, add English translation
    if (this.currentLanguage.code !== "en-GB") {
      // Universal Translator Logic (Simulated)
      // In a real app, we would call: await this.translator.translate(text, this.currentLanguage.code, 'en-GB');
      userMessage.translation = `[Translated to English]: ${text}`;
    }

    this.addMessage(userMessage);

    // Reset proactive timer on user input
    this.proactive?.start();

    // Detect intent and morph accordingly
    const lowerText = text.toLowerCase();

    // Emoji-style morphing based on conversation context
    // Priority order: specific shapes first, then general

    // Celebration shapes (high priority)
    if (
      lowerText.includes("excited") ||
      lowerText.includes("wow") ||
      lowerText.includes("yay") ||
      lowerText.includes("fantastic") ||
      lowerText.includes("amazing") ||
      lowerText.includes("brilliant") ||
      lowerText.includes("can't wait") ||
      lowerText.includes("looking forward") ||
      lowerText.includes("thrilled") ||
      lowerText.includes("delighted") ||
      lowerText.includes("celebration") ||
      lowerText.includes("celebrate") ||
      lowerText.includes("party") ||
      lowerText.includes("special") ||
      lowerText.includes("great news") ||
      lowerText.includes("wonderful news")
    ) {
      this.particle3D?.morphTo("excited");
    } else if (lowerText.includes("fireworks") || lowerText.includes("🎆")) {
      this.particle3D?.morphTo("fireworks");
    } else if (lowerText.includes("confetti") || lowerText.includes("🎊")) {
      this.particle3D?.morphTo("confetti");
    } else if (
      lowerText.includes("trophy") ||
      lowerText.includes("achievement") ||
      lowerText.includes("award") ||
      lowerText.includes("won") ||
      lowerText.includes("victory") ||
      lowerText.includes("champion") ||
      lowerText.includes("first place") ||
      lowerText.includes("top") ||
      lowerText.includes("best") ||
      lowerText.includes("excellent work") ||
      lowerText.includes("well done") ||
      lowerText.includes("congratulations") ||
      lowerText.includes("accomplishment") ||
      lowerText.includes("milestone") ||
      lowerText.includes("record") ||
      lowerText.includes("result")
    ) {
      this.particle3D?.morphTo("trophy");

      // Essential shapes
    } else if (
      lowerText.includes("information") ||
      lowerText.includes("info") ||
      lowerText.includes("details") ||
      lowerText.includes("tell me") ||
      lowerText.includes("explain") ||
      lowerText.includes("about") ||
      lowerText.includes("read") ||
      lowerText.includes("learn") ||
      lowerText.includes("know") ||
      lowerText.includes("understand") ||
      lowerText.includes("what is") ||
      lowerText.includes("what are") ||
      lowerText.includes("describe") ||
      lowerText.includes("definition") ||
      lowerText.includes("meaning") ||
      lowerText.includes("guide") ||
      lowerText.includes("manual") ||
      lowerText.includes("handbook") ||
      lowerText.includes("policy") ||
      lowerText.includes("procedure") ||
      lowerText.includes("rule") ||
      lowerText.includes("regulation")
    ) {
      this.particle3D?.morphTo("book");
    } else if (
      lowerText.includes("time") ||
      lowerText.includes("when") ||
      lowerText.includes("schedule") ||
      lowerText.includes("timetable") ||
      lowerText.includes("hours") ||
      lowerText.includes("opening") ||
      lowerText.includes("closing") ||
      lowerText.includes("deadline") ||
      lowerText.includes("date") ||
      lowerText.includes("appointment") ||
      lowerText.includes("meeting") ||
      lowerText.includes("event") ||
      lowerText.includes("term dates") ||
      lowerText.includes("holiday") ||
      lowerText.includes("break") ||
      lowerText.includes("half term") ||
      lowerText.includes("start") ||
      lowerText.includes("finish") ||
      lowerText.includes("end") ||
      lowerText.includes("duration") ||
      lowerText.includes("how long") ||
      lowerText.includes("what time")
    ) {
      this.particle3D?.morphTo("clock");
    } else if (
      lowerText.includes("important") ||
      lowerText.includes("urgent") ||
      lowerText.includes("critical") ||
      lowerText.includes("required") ||
      lowerText.includes("must") ||
      lowerText.includes("need to") ||
      lowerText.includes("essential") ||
      lowerText.includes("mandatory") ||
      lowerText.includes("notice") ||
      lowerText.includes("alert") ||
      lowerText.includes("attention") ||
      lowerText.includes("warning") ||
      lowerText.includes("caution") ||
      lowerText.includes("deadline approaching") ||
      lowerText.includes("late") ||
      lowerText.includes("overdue") ||
      lowerText.includes("missing") ||
      lowerText.includes("required field")
    ) {
      this.particle3D?.morphTo("warning");
    } else if (
      lowerText.includes("ask") ||
      lowerText.includes("question") ||
      lowerText.includes("query") ||
      lowerText.includes("unsure") ||
      lowerText.includes("unclear") ||
      lowerText.includes("confused") ||
      lowerText.includes("don't understand") ||
      lowerText.includes("what do you mean") ||
      lowerText.includes("can you clarify") ||
      lowerText.includes("explain again") ||
      lowerText.includes("repeat") ||
      lowerText.includes("sorry") ||
      lowerText.includes("pardon") ||
      lowerText.includes("excuse me") ||
      lowerText.includes("what") ||
      lowerText.includes("how") ||
      lowerText.includes("why") ||
      lowerText.includes("where") ||
      lowerText.includes("who") ||
      lowerText.includes("which")
    ) {
      this.particle3D?.morphTo("question");
    } else if (
      lowerText.includes("calendar") ||
      lowerText.includes("event") ||
      lowerText.includes("date") ||
      lowerText.includes("schedule") ||
      lowerText.includes("term") ||
      lowerText.includes("holiday") ||
      lowerText.includes("break") ||
      lowerText.includes("half term") ||
      lowerText.includes("inset day") ||
      lowerText.includes("open day") ||
      lowerText.includes("tour") ||
      lowerText.includes("visit") ||
      lowerText.includes("meeting") ||
      lowerText.includes("appointment") ||
      lowerText.includes("deadline") ||
      lowerText.includes("when is") ||
      lowerText.includes("what date") ||
      lowerText.includes("school calendar") ||
      lowerText.includes("academic year") ||
      lowerText.includes("term dates")
    ) {
      this.particle3D?.morphTo("calendar");
    } else if (
      lowerText.includes("search") ||
      lowerText.includes("find") ||
      lowerText.includes("look for") ||
      lowerText.includes("locate") ||
      lowerText.includes("where is") ||
      lowerText.includes("where can i find") ||
      lowerText.includes("show me") ||
      lowerText.includes("find me") ||
      lowerText.includes("look up") ||
      lowerText.includes("search for") ||
      lowerText.includes("discover") ||
      lowerText.includes("browse")
    ) {
      this.particle3D?.morphTo("search");
    } else if (
      lowerText.includes("phone") ||
      lowerText.includes("call") ||
      lowerText.includes("telephone") ||
      lowerText.includes("contact") ||
      lowerText.includes("number") ||
      lowerText.includes("ring") ||
      lowerText.includes("speak to") ||
      lowerText.includes("talk to") ||
      lowerText.includes("reach") ||
      lowerText.includes("get in touch") ||
      lowerText.includes("contact details") ||
      lowerText.includes("phone number") ||
      lowerText.includes("mobile") ||
      lowerText.includes("landline") ||
      lowerText.includes("call me") ||
      lowerText.includes("ring me")
    ) {
      this.particle3D?.morphTo("phone");
    } else if (
      lowerText.includes("address") ||
      lowerText.includes("location") ||
      lowerText.includes("where") ||
      lowerText.includes("find") ||
      lowerText.includes("directions") ||
      lowerText.includes("map") ||
      lowerText.includes("postcode") ||
      lowerText.includes("post code") ||
      lowerText.includes("street") ||
      lowerText.includes("road") ||
      lowerText.includes("building") ||
      lowerText.includes("site") ||
      lowerText.includes("campus") ||
      lowerText.includes("how to get") ||
      lowerText.includes("directions to") ||
      lowerText.includes("where is the school") ||
      lowerText.includes("address of")
    ) {
      this.particle3D?.morphTo("location");

      // Core shapes (existing)
    } else if (
      lowerText.includes("form") ||
      lowerText.includes("fill") ||
      lowerText.includes("write") ||
      lowerText.includes("type") ||
      lowerText.includes("enter") ||
      lowerText.includes("input") ||
      lowerText.includes("complete") ||
      lowerText.includes("application") ||
      lowerText.includes("submit") ||
      lowerText.includes("document") ||
      lowerText.includes("sign") ||
      lowerText.includes("paperwork")
    ) {
      this.particle3D?.morphTo("pencil");
    } else if (
      lowerText.includes("help") ||
      lowerText.includes("how") ||
      lowerText.includes("what") ||
      lowerText.includes("why") ||
      lowerText.includes("explain") ||
      lowerText.includes("understand") ||
      lowerText.includes("idea") ||
      lowerText.includes("suggest") ||
      lowerText.includes("advice") ||
      lowerText.includes("guidance") ||
      lowerText.includes("tip") ||
      lowerText.includes("hint")
    ) {
      this.particle3D?.morphTo("lightbulb");
    } else if (
      lowerText.includes("thank") ||
      lowerText.includes("thanks") ||
      lowerText.includes("appreciate") ||
      lowerText.includes("grateful") ||
      lowerText.includes("love") ||
      lowerText.includes("lovely") ||
      lowerText.includes("wonderful") ||
      lowerText.includes("kind") ||
      lowerText.includes("caring") ||
      lowerText.includes("sweet")
    ) {
      this.particle3D?.morphTo("heart");
    } else if (
      lowerText.includes("yes") ||
      lowerText.includes("please") ||
      lowerText.includes("sure") ||
      lowerText.includes("okay") ||
      lowerText.includes("ok") ||
      lowerText.includes("agree") ||
      lowerText.includes("confirm") ||
      lowerText.includes("accept") ||
      lowerText.includes("correct") ||
      lowerText.includes("right") ||
      lowerText.includes("exactly")
    ) {
      this.particle3D?.morphTo("thumbsup");
    } else if (
      lowerText.includes("great") ||
      lowerText.includes("perfect") ||
      lowerText.includes("excellent") ||
      lowerText.includes("amazing") ||
      lowerText.includes("fantastic") ||
      lowerText.includes("brilliant") ||
      lowerText.includes("outstanding") ||
      lowerText.includes("superb") ||
      lowerText.includes("wonderful") ||
      lowerText.includes("awesome")
    ) {
      this.particle3D?.morphTo("star");
    } else if (
      lowerText.includes("👍") ||
      lowerText.includes("✓") ||
      lowerText.includes("ok") ||
      lowerText.includes("done") ||
      lowerText.includes("complete") ||
      lowerText.includes("finished") ||
      lowerText.includes("ready") ||
      lowerText.includes("confirmed") ||
      lowerText.includes("submitted") ||
      lowerText.includes("success") ||
      lowerText.includes("accomplished") ||
      lowerText.includes("achieved")
    ) {
      this.particle3D?.morphTo("checkmark");
    } else if (
      lowerText.includes("happy") ||
      lowerText.includes("glad") ||
      lowerText.includes("pleased") ||
      lowerText.includes("smile") ||
      lowerText.includes("joy") ||
      lowerText.includes("cheerful") ||
      lowerText.includes("delighted") ||
      lowerText.includes("excited") ||
      lowerText.includes("thrilled") ||
      lowerText.includes("wonderful") ||
      lowerText.includes("😊") ||
      lowerText.includes(":)")
    ) {
      this.particle3D?.morphTo("smiley");

      // Additional shapes
    } else if (
      lowerText.includes("let me think") ||
      lowerText.includes("considering") ||
      lowerText.includes("hmm") ||
      lowerText.includes("um") ||
      lowerText.includes("well") ||
      lowerText.includes("actually") ||
      lowerText.includes("perhaps") ||
      lowerText.includes("maybe") ||
      lowerText.includes("might") ||
      lowerText.includes("could") ||
      lowerText.includes("possibly") ||
      lowerText.includes("not sure") ||
      lowerText.includes("let me see") ||
      lowerText.includes("give me a moment") ||
      lowerText.includes("thinking about") ||
      lowerText.includes("considering")
    ) {
      this.particle3D?.morphTo("thinking");
    } else if (
      lowerText.includes("confused") ||
      lowerText.includes("don't understand") ||
      lowerText.includes("unclear") ||
      lowerText.includes("lost") ||
      lowerText.includes("not sure") ||
      lowerText.includes("puzzled") ||
      lowerText.includes("bewildered") ||
      lowerText.includes("what") ||
      lowerText.includes("huh") ||
      lowerText.includes("sorry") ||
      lowerText.includes("pardon") ||
      lowerText.includes("excuse me") ||
      lowerText.includes("repeat") ||
      lowerText.includes("say again") ||
      lowerText.includes("what do you mean") ||
      lowerText.includes("i don't get it")
    ) {
      this.particle3D?.morphTo("confused");
    } else if (
      lowerText.includes("error") ||
      lowerText.includes("problem") ||
      lowerText.includes("issue") ||
      lowerText.includes("broken") ||
      lowerText.includes("not working") ||
      lowerText.includes("failed") ||
      lowerText.includes("mistake") ||
      lowerText.includes("wrong") ||
      lowerText.includes("incorrect") ||
      lowerText.includes("sorry there was an error") ||
      lowerText.includes("something went wrong") ||
      lowerText.includes("unable to") ||
      lowerText.includes("can't") ||
      lowerText.includes("cannot")
    ) {
      this.particle3D?.morphTo("error");
    } else if (
      lowerText.includes("message") ||
      lowerText.includes("chat") ||
      lowerText.includes("talk") ||
      lowerText.includes("speak") ||
      lowerText.includes("conversation") ||
      lowerText.includes("discuss") ||
      lowerText.includes("tell me") ||
      lowerText.includes("say") ||
      lowerText.includes("mention") ||
      lowerText.includes("communicate") ||
      lowerText.includes("dialogue") ||
      lowerText.includes("speak to") ||
      lowerText.includes("talk to") ||
      lowerText.includes("have a chat")
    ) {
      this.particle3D?.morphTo("speech");
    } else if (
      lowerText.includes("document") ||
      lowerText.includes("form") ||
      lowerText.includes("file") ||
      lowerText.includes("pdf") ||
      lowerText.includes("download") ||
      lowerText.includes("print") ||
      lowerText.includes("application") ||
      lowerText.includes("letter") ||
      lowerText.includes("report") ||
      lowerText.includes("certificate") ||
      lowerText.includes("transcript") ||
      lowerText.includes("record") ||
      lowerText.includes("paperwork") ||
      lowerText.includes("document needed") ||
      lowerText.includes("required document")
    ) {
      this.particle3D?.morphTo("document");
    } else if (
      lowerText.includes("calculate") ||
      lowerText.includes("math") ||
      lowerText.includes("maths") ||
      lowerText.includes("number") ||
      lowerText.includes("count") ||
      lowerText.includes("add") ||
      lowerText.includes("subtract") ||
      lowerText.includes("multiply") ||
      lowerText.includes("divide") ||
      lowerText.includes("total") ||
      lowerText.includes("sum") ||
      lowerText.includes("cost") ||
      lowerText.includes("price") ||
      lowerText.includes("fee") ||
      lowerText.includes("payment") ||
      lowerText.includes("amount") ||
      lowerText.includes("calculate") ||
      lowerText.includes("work out") ||
      lowerText.includes("figure out")
    ) {
      this.particle3D?.morphTo("calculator");
    } else if (
      lowerText.includes("notification") ||
      lowerText.includes("alert") ||
      lowerText.includes("reminder") ||
      lowerText.includes("notify") ||
      lowerText.includes("inform") ||
      lowerText.includes("tell me when") ||
      lowerText.includes("let me know") ||
      lowerText.includes("alert me") ||
      lowerText.includes("remind me") ||
      lowerText.includes("notification") ||
      lowerText.includes("announcement") ||
      lowerText.includes("update") ||
      lowerText.includes("news")
    ) {
      this.particle3D?.morphTo("bell");
    } else if (
      lowerText.includes("graduation") ||
      lowerText.includes("graduate") ||
      lowerText.includes("leaving") ||
      lowerText.includes("year 6") ||
      lowerText.includes("year 11") ||
      lowerText.includes("year 13") ||
      lowerText.includes("a-levels") ||
      lowerText.includes("gcse") ||
      lowerText.includes("results") ||
      lowerText.includes("exam results") ||
      lowerText.includes("certificate") ||
      lowerText.includes("diploma") ||
      lowerText.includes("qualification") ||
      lowerText.includes("finish school") ||
      lowerText.includes("move on")
    ) {
      this.particle3D?.morphTo("graduation");
    } else {
      this.particle3D?.morphTo("lightbulb");
    }

    // Show typing indicator
    const typingId = this.chat?.showTyping() || "";

    // Vision: auto-attach a screen frame on every message if screen sharing is active
    if (!this.pendingImage && this.apiClient?.isScreenSharing) {
      const frame = this.apiClient.captureFrame();
      if (frame) {
        this.pendingImage = frame;
      }
    }

    // Vision: if not sharing but user asks about their screen, try one-shot capture
    if (!this.pendingImage && this.apiClient) {
      const visionTriggers = [
        "what's on my screen",
        "look at this",
        "i can see an error",
        "what am i looking at",
        "help with this page",
        "what does this mean",
      ];
      if (visionTriggers.some((t) => lowerText.includes(t))) {
        const autoScreenshot = await this.apiClient.captureScreen();
        if (autoScreenshot) {
          this.pendingImage = autoScreenshot;
        }
      }
    }

    // Consume pending image for this request
    const imageForRequest = this.pendingImage;
    this.pendingImage = null;

    // Reset input placeholder if it was changed for image context
    const chatInput = this.widget?.querySelector(
      "#chat-input",
    ) as HTMLInputElement;
    if (chatInput) chatInput.placeholder = "Ask Ed anything...";

    // Get AI response
    const response = await this.getAIResponse(
      text,
      imageForRequest || undefined,
    );

    // Hide typing
    this.chat?.hideTyping(typingId);

    // Morph back to sphere
    setTimeout(() => this.particle3D?.morphTo("sphere"), 500);

    // Add assistant message with translation if needed
    // Note: response is clean text from AI, we'll add emotion tags only for voice
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response, // Clean text for chat display
      timestamp: new Date(),
      language: this.currentLanguage.code,
    };

    // Only show language switch button if user is in a non-English language
    if (this.currentLanguage.code !== "en-GB") {
      assistantMessage.quickReplies = ["English 🇬🇧"];
    }

    this.addMessage(assistantMessage);

    // Emoji reaction based on response
    const responseLower = response.toLowerCase();
    if (
      responseLower.includes("great!") ||
      responseLower.includes("perfect!")
    ) {
      setTimeout(() => {
        this.particle3D?.morphTo("thumbsup");
        setTimeout(() => this.particle3D?.morphTo("sphere"), 2000);
      }, 1000);
    } else if (
      responseLower.includes("happy to help") ||
      responseLower.includes("glad")
    ) {
      setTimeout(() => {
        this.particle3D?.morphTo("smiley");
        setTimeout(() => this.particle3D?.morphTo("sphere"), 2000);
      }, 1000);
    }

    // Speak response with emotions (if Fish Audio available)
    if (this.config.features.voice) {
      // Stop any ongoing speech first (async to prevent conflicts)
      this.stopAllSpeechAsync().then(() => {
        if (this.fishVoice) {
          // Fish Audio doesn't support emotion tags in text - use clean text only
          // Emotion comes from the cloned voice itself, not text tags
          const cleanResponse = this.cleanTextForDisplay(response);
          console.log("[Ed] Using Fish Audio for response");
          this.fishVoice
            .speakAndPlay(
              cleanResponse,
              this.currentPersona,
              this.currentLanguage.code,
            )
            .then(() => {
              console.log("[Ed] Fish Audio playback completed");
            })
            .catch((error) => {
              console.error("[Ed] Fish Audio error:", error);
              console.error("[Ed] Error details:", error.message);
              // Don't fallback to browser TTS - it causes dual audio
              // Only log the error and continue silently
              console.warn(
                "[Ed] Skipping browser TTS fallback to prevent dual audio",
              );
            });
        } else {
          // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
          // This is an emergency fallback only
          if (!this.config.disableBrowserTTS) {
            console.warn(
              "[Ed] Fish Audio not available, using browser TTS (emergency fallback)",
            );
            this.speak(response);
          } else {
            console.warn(
              "[Ed] Fish Audio not available and browser TTS disabled - no voice output",
            );
          }
        }
      });
    }
  }

  /**
   * Handle user input during form filling — returns response or null to fall through
   */
  private handleFormInput(text: string): string | null {
    if (!this.formFiller) return null;
    const lower = text.toLowerCase().trim();

    // Cancel / stop commands
    if (
      ["stop", "cancel", "quit", "exit", "nevermind", "never mind"].some(
        (w) => lower === w,
      )
    ) {
      this.formFiller.stop();
      this.particle3D?.morphTo("sphere");
      return "No problem, I've stopped filling the form. Everything you already typed is still there.";
    }

    // Go back / edit previous
    if (lower === "back" || lower === "go back" || lower === "previous") {
      const prev = this.formFiller.previousField();
      if (prev) {
        return `Going back to ${prev.label}. What should it be?`;
      }
      return "We're already at the first field.";
    }

    // Edit a specific field: "change email" / "edit field 2"
    const editMatch = lower.match(
      /(?:change|edit|fix|update)\s+(?:field\s*)?(\d+|.+)/,
    );
    if (editMatch) {
      const summary = this.formFiller.getSummary();
      const target = editMatch[1];
      const byNumber = parseInt(target);

      let fieldIndex = -1;
      if (!isNaN(byNumber) && byNumber >= 1 && byNumber <= summary.length) {
        fieldIndex = byNumber - 1;
      } else {
        fieldIndex = summary.findIndex((s) =>
          s.label.toLowerCase().includes(target.toLowerCase()),
        );
      }

      if (fieldIndex >= 0) {
        const field = this.formFiller.goToField(fieldIndex);
        if (field) {
          return `Editing ${field.label} (currently: "${summary[fieldIndex].value}"). What should it be?`;
        }
      }
      return "I couldn't find that field. Say 'change field 1' or 'change email' to edit a specific field.";
    }

    // Review / summary request
    if (
      ["review", "summary", "show", "check", "list"].some((w) =>
        lower.includes(w),
      )
    ) {
      const summary = this.formFiller.getSummary();
      const lines = summary.map((s, i) => `${i + 1}. ${s.label}: ${s.value}`);
      return `Here's what I've filled:\n\n${lines.join("\n")}\n\nSay "change [field]", "submit", or "cancel".`;
    }

    // Submit request
    if (
      ["submit", "send", "done", "finish", "yes submit", "go ahead"].some((w) =>
        lower.includes(w),
      )
    ) {
      const summary = this.formFiller.getSummary();
      const unfilled = summary.filter((s) => s.value === "(empty)");

      if (unfilled.length > 0) {
        return `Hold on — ${unfilled.length} field${unfilled.length > 1 ? "s are" : " is"} still empty: ${unfilled.map((f) => f.label).join(", ")}.\n\nWould you like to fill those first, or submit as is?`;
      }

      this.formFiller.submitForm().then((submitted) => {
        this.particle3D?.morphTo("checkmark");
        setTimeout(() => this.particle3D?.morphTo("sphere"), 3000);
        if (submitted) {
          this.addMessage({
            id: `msg-${Date.now()}`,
            role: "assistant",
            content:
              "Form submitted successfully! Is there anything else I can help with?",
            timestamp: new Date(),
          });
        }
      });
      return "I've prepared a summary for you to review. Please confirm or cancel in the overlay.";
    }

    // "submit as is" / "submit anyway"
    if (
      lower.includes("as is") ||
      lower.includes("anyway") ||
      lower.includes("submit it")
    ) {
      this.formFiller.submitForm().then((submitted) => {
        this.particle3D?.morphTo("checkmark");
        setTimeout(() => this.particle3D?.morphTo("sphere"), 3000);
        if (submitted) {
          this.addMessage({
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: "Form submitted! Anything else?",
            timestamp: new Date(),
          });
        }
      });
      return "Please confirm the submission in the overlay.";
    }

    // Currently on a field — fill it with the user's answer
    const currentField = this.formFiller.getCurrentField();
    if (currentField) {
      const filled = this.formFiller.fillFieldByVoice(text);
      if (!filled) {
        const hint = this.getFieldHint(currentField);
        return `I didn't catch that for ${currentField.label}. Could you try again?${hint}`;
      }

      // Move to next
      const nextField = this.formFiller.nextField();
      if (nextField) {
        const progress = this.formFiller.getProgress();
        const required = nextField.required ? " (required)" : "";
        const hint = this.getFieldHint(nextField);
        this.particle3D?.morphTo("pencil");
        return `Got it (${progress.current}/${progress.total}). ${nextField.label}${required}${hint}`;
      }

      // All fields done — show summary
      const summary = this.formFiller.getSummary();
      const lines = summary.map((s, i) => `${i + 1}. ${s.label}: ${s.value}`);
      this.particle3D?.morphTo("checkmark");
      return `All done! Here's what I've filled:\n\n${lines.join("\n")}\n\nSay "submit", "change [field]", or "cancel".`;
    }

    return null; // Fall through to normal AI processing
  }

  /**
   * Get a short hint for a form field type (shown when asking user)
   */
  private getFieldHint(field: import("./types").FormField): string {
    if (
      field.type === "dropdown" &&
      field.element instanceof HTMLSelectElement
    ) {
      const opts = Array.from(field.element.options)
        .filter((o) => o.value && o.value !== "")
        .map((o) => o.text)
        .slice(0, 5);
      if (opts.length > 0) {
        const more = field.element.options.length - opts.length;
        return `\nOptions: ${opts.join(", ")}${more > 0 ? `, +${more} more` : ""}`;
      }
    }
    if (field.type === "checkbox") return '\nSay "yes" or "no".';
    if (field.type === "date") return "\nE.g. 15/06/2024";
    return "";
  }

  /**
   * Speak a response with Fish Audio or browser TTS
   */
  private speakResponse(response: string): void {
    if (!this.config.features.voice) return;
    this.stopAllSpeechAsync().then(() => {
      if (this.fishVoice) {
        const clean = this.cleanTextForDisplay(response);
        this.fishVoice
          .speakAndPlay(clean, this.currentPersona, this.currentLanguage.code)
          .catch((err) => console.error("[Ed] TTS error:", err));
      } else if (!this.config.disableBrowserTTS) {
        this.speak(response);
      }
    });
  }

  private async getAIResponse(text: string, image?: string): Promise<string> {
    const lowerText = text.toLowerCase();

    // Form filling intent detection (broad triggers)
    const formTriggers = [
      "fill",
      "form",
      "help me fill",
      "complete this",
      "fill this in",
      "fill out",
      "fill in",
      "help with this form",
      "i need to fill",
    ];
    if (formTriggers.some((t) => lowerText.includes(t))) {
      const forms = this.formFiller?.detectForms();
      if (forms && forms.length > 0 && this.formFiller) {
        const detected = forms[0];
        const field = this.formFiller.startFilling(detected.element);
        if (field) {
          this.particle3D?.morphTo("pencil");
          const progress = this.formFiller.getProgress();
          const required = field.required ? " (required)" : "";
          const hint = this.getFieldHint(field);
          return `Found "${detected.title}" with ${progress.total} fields. Let's go through them.\n\n${field.label}${required}${hint}`;
        }
      }
      if (this.mode === "support") {
        return "I don't see any forms on this page. If you're having trouble with the login form, I can help troubleshoot.";
      }
      return "I don't see any forms on this page. Would you like me to help you find something?";
    }

    // Use API client if available (preferred for Schoolgle)
    if (this.apiClient) {
      try {
        return await this.apiClient.chat(text, undefined, image);
      } catch (error) {
        console.error("[Ed] API client error:", error);
      }
    }

    // Try Gemini AI as fallback
    if (this.ai) {
      try {
        const persona = getPersona(this.currentPersona);

        // Extract page context for AI
        let pageContext: string | undefined;
        try {
          const pageContent = pageScanner.scan();
          pageContext = `Current page: ${pageContent.title}
URL: ${window.location.href}
Page type: ${pageContent.pageType}
Has forms: ${pageContent.forms > 0 ? "Yes" : "No"}
Key headings: ${pageContent.headings.slice(0, 5).join(", ")}
Summary: ${pageContent.mainContent.substring(0, 300)}`;
        } catch (error) {
          console.debug("[Ed] Could not extract page context:", error);
          // Fallback to basic page info
          pageContext = `Current page: ${document.title}
URL: ${window.location.href}`;
        }

        return await this.ai.chat(text, {
          persona,
          language: this.currentLanguage,
          schoolId: this.config.schoolId,
          toolContext: this.toolContext, // Pass tool context for Toolbox Workspace
          pageContext, // Pass page context so AI can see what user is viewing
        });
      } catch (error) {
        console.error("[Ed] AI error:", error);
      }
    }

    // Mode-based fallback responses
    if (this.mode === "website") {
      // Website mode - public visitors
      const websiteFallbacks = [
        "I'm happy to help with information about our school! What would you like to know?",
        "I can help with admissions, term dates, contact details, and general school information. What do you need?",
        "Welcome! How can I help you today? I can share information about our school.",
      ];
      return websiteFallbacks[
        Math.floor(Math.random() * websiteFallbacks.length)
      ];
    }

    if (this.mode === "support") {
      const supportFallbacks = [
        "I'm here to help with login issues! What problem are you having?",
        "I can help you log in, reset your password, or troubleshoot access issues. What do you need?",
        "For help with Schoolgle, I can assist with account access. What's the issue?",
      ];
      return supportFallbacks[
        Math.floor(Math.random() * supportFallbacks.length)
      ];
    }

    // School mode fallback
    const schoolFallbacks = [
      "I'm here to help with work tasks! What can I help you with?",
      "I can help with school improvement tasks, compliance, HR questions, and more. What do you need?",
      "I'm your school support assistant. What work task can I help with?",
    ];
    return schoolFallbacks[Math.floor(Math.random() * schoolFallbacks.length)];
  }

  private handleProactiveNudge(message: string): void {
    if (!this.isOpen) {
      // If closed, maybe show a notification badge or small popup
      // For now, just log it
      console.log("[Ed] Proactive nudge suppressed (closed):", message);
      return;
    }

    this.addMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: message,
      timestamp: new Date(),
      language: this.currentLanguage.code,
    });

    if (this.config.features.voice) {
      // Stop any ongoing speech first (async to prevent conflicts)
      this.stopAllSpeechAsync().then(() => {
        if (this.fishVoice) {
          const cleanMessage = this.cleanTextForDisplay(message);
          this.fishVoice
            .speakAndPlay(
              cleanMessage,
              this.currentPersona,
              this.currentLanguage.code,
            )
            .catch((error) => {
              console.error("[Ed] Fish Audio error in proactive nudge:", error);
              // Don't fallback to browser TTS - it causes dual audio
              console.warn(
                "[Ed] Skipping browser TTS fallback to prevent dual audio",
              );
            });
        } else {
          // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
          if (!this.config.disableBrowserTTS) {
            this.speak(message);
          }
        }
      });
    }

    this.particle3D?.morphTo("lightbulb");
    setTimeout(() => this.particle3D?.morphTo("sphere"), 2000);
  }

  /**
   * Clean text for chat display - removes emotion tags, pauses, and formatting
   */
  private cleanTextForDisplay(text: string): string {
    return (
      text
        // Remove emotion tags like (happy), (excited), etc.
        .replace(/\([^)]+\)/g, "")
        // Strip markdown: **bold** → bold, *italic* → italic
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/_(.+?)_/g, "$1")
        // Strip markdown headers: ### Heading → Heading
        .replace(/^#{1,6}\s+/gm, "")
        // Strip markdown bullet points: - item → item
        .replace(/^[-*]\s+/gm, "")
        // Remove emojis (keep text only for display)
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
        .replace(/[\u{2600}-\u{26FF}]/gu, "")
        .replace(/[\u{2700}-\u{27BF}]/gu, "")
        // Remove language codes
        .replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸\b/gi, "")
        .replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi, "")
        // Clean up extra whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  private addMessage(message: Message): void {
    // Clean AI response text (remove emotion tags, etc.) but leave system messages intact
    if (message.content && message.role !== "system") {
      message.content = this.cleanTextForDisplay(message.content);
    }
    this.messages.push(message);
    this.chat?.addMessage(message);
  }

  /**
   * Browser TTS fallback - ONLY use in emergency cases when Fish Audio is completely unavailable
   * DISABLED by default - only use if Fish Audio is not initialized at all
   */
  private speak(text: string): void {
    if (!this.config.features.voice) return;

    // If browser TTS is disabled, don't use it
    if (this.config.disableBrowserTTS) {
      console.warn("[Ed] ⚠️ Browser TTS disabled - skipping fallback");
      return;
    }

    // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
    // NOT as a fallback for errors - that causes both voices to play simultaneously
    if (this.fishVoice) {
      console.warn(
        "[Ed] ⚠️ Browser TTS called but Fish Audio is available - skipping to prevent dual audio",
      );
      return; // Don't use browser TTS if Fish Audio exists, even if it errors
    }

    // Stop any ongoing speech (both Fish Audio and browser TTS)
    this.stopAllSpeech();

    // Clean text before speaking - remove emojis, formatting, instructional text
    // For browser TTS, don't preserve Fish Audio tags (they would be read out)
    const cleanedText =
      this.fishVoice?.cleanTextForTTS(text, false) ||
      text
        .replace(/\([^)]+\)/g, "") // Remove emotion tags
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Remove emojis
        .replace(/[\u{2600}-\u{26FF}]/gu, "")
        .replace(/[\u{2700}-\u{27BF}]/gu, "")
        .replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸\b/gi, "") // Remove language codes
        .replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleanedText) return; // Don't speak empty text

    const persona = getPersona(this.currentPersona);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = this.currentLanguage.voiceLang;
    utterance.pitch = persona.voicePitch;
    utterance.rate = persona.voiceRate;

    speechSynthesis.speak(utterance);
  }

  /**
   * Stop all ongoing speech (Fish Audio and browser TTS)
   * Synchronous version - use stopAllSpeechAsync() when you need to wait
   */
  private stopAllSpeech(): void {
    // Stop browser TTS first (synchronous)
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    // Stop Fish Audio (async, but don't wait in sync version)
    this.fishVoice?.stop().catch(() => {
      // Ignore errors in sync version
    });
  }

  /**
   * Stop speech before starting new speech (with delay to prevent conflicts)
   * Ensures Fish Audio is fully stopped before any new audio starts
   * This prevents the "play() interrupted by pause()" error
   */
  private async stopAllSpeechAsync(): Promise<void> {
    // Stop browser TTS first (synchronous)
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      // Small delay to ensure browser TTS is fully stopped
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Stop Fish Audio and wait for it to fully stop
    if (this.fishVoice) {
      await this.fishVoice.stop(); // Now returns a promise, wait for it
      // Additional delay to ensure audio element is fully released
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  private handleDockAction(action: string): void {
    switch (action) {
      case "microphone":
        this.toggleListening();
        break;
      case "keyboard":
        this.toggleKeyboard();
        break;
      case "language":
        this.showLanguageSelector();
        break;
      case "persona":
        this.cyclePersona();
        break;
      case "settings":
        this.showSettings();
        break;
      case "magic-tools":
        this.showMagicTools();
        break;
      case "close":
        this.close();
        break;
    }
  }

  private toggleListening(): void {
    if (!this.voice) {
      // Show message even if chat is hidden
      const chatContainer = this.widget?.querySelector(
        ".chat-container",
      ) as HTMLElement;
      const wasHidden = chatContainer?.classList.contains("chat-hidden");
      if (wasHidden) {
        chatContainer?.classList.remove("chat-hidden");
      }
      this.addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: "🎤 Voice input not available. Please use text input instead.",
        timestamp: new Date(),
      });
      if (wasHidden) {
        setTimeout(() => chatContainer?.classList.add("chat-hidden"), 3000);
      }
      return;
    }

    if (this.isListening) {
      this.voice.stop();
      this.isListening = false;
      this.dock?.setListening(false);
      this.statusPill?.setState("ready");
      // Morph back to sphere
      this.particle3D?.morphTo("sphere");
    } else {
      // Show chat temporarily if hidden, so user can see responses
      const chatContainer = this.widget?.querySelector(
        ".chat-container",
      ) as HTMLElement;
      const wasHidden = chatContainer?.classList.contains("chat-hidden");
      if (wasHidden) {
        chatContainer?.classList.remove("chat-hidden");
        this.showKeyboard = false; // Reset toggle state
      }

      // Check for microphone permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(() => {
            this.voice?.start();
            this.isListening = true;
            this.dock?.setListening(true);
            this.statusPill?.setState("listening");
            // Morph to indicate listening
            this.particle3D?.morphTo("lightbulb");
          })
          .catch((error) => {
            console.error("[Ed] Microphone permission denied:", error);
            this.addMessage({
              id: crypto.randomUUID(),
              role: "system",
              content:
                "🎤 Microphone access denied. Please enable microphone permissions in your browser settings.",
              timestamp: new Date(),
            });
          });
      } else {
        this.voice.start();
        this.isListening = true;
        this.dock?.setListening(true);
        this.statusPill?.setState("listening");
        this.particle3D?.morphTo("lightbulb");
      }
    }
  }

  private toggleKeyboard(): void {
    this.showKeyboard = !this.showKeyboard;

    // Toggle chat container visibility (matching Gemini behavior)
    const chatContainer = this.widget?.querySelector(
      ".chat-container",
    ) as HTMLElement;
    if (chatContainer) {
      if (this.showKeyboard) {
        // Hide chat - show particle avatar only
        chatContainer.classList.add("chat-hidden");
        // Ensure particle avatar is visible and prominent
        const canvasContainer = this.widget?.querySelector(
          "#canvas-container",
        ) as HTMLElement;
        if (canvasContainer) {
          canvasContainer.style.opacity = "1";
          canvasContainer.style.visibility = "visible";
          canvasContainer.style.zIndex = "20"; // Above everything when chat is hidden
        }
        // Update status
        this.statusPill?.setState("ready");
        this.statusPill?.show();
      } else {
        // Show chat - particle avatar behind
        chatContainer.classList.remove("chat-hidden");
        // Particle avatar back to normal z-index
        const canvasContainer = this.widget?.querySelector(
          "#canvas-container",
        ) as HTMLElement;
        if (canvasContainer) {
          canvasContainer.style.zIndex = "10"; // Behind chat
        }
      }
    }

    console.log(
      "[Ed] Chat toggled:",
      this.showKeyboard ? "hidden (avatar visible)" : "visible",
    );
  }

  /**
   * Detect language from user input (simple keyword-based detection)
   */
  private detectLanguage(text: string): Language | null {
    const lowerText = text.toLowerCase().trim();

    // Common greetings and phrases in different languages
    const languagePatterns: Array<{ code: string; patterns: RegExp[] }> = [
      {
        code: "es",
        patterns: [
          /^hola/i,
          /^buenos días/i,
          /^buenas tardes/i,
          /^buenas noches/i,
          /^adiós/i,
        ],
      },
      {
        code: "fr",
        patterns: [/^bonjour/i, /^bonsoir/i, /^salut/i, /^au revoir/i],
      },
      {
        code: "pl",
        patterns: [
          /^cześć/i,
          /^dzień dobry/i,
          /^dobry wieczór/i,
          /^do widzenia/i,
        ],
      },
      { code: "ro", patterns: [/^bună/i, /^salut/i, /^la revedere/i] },
      {
        code: "pt",
        patterns: [/^olá/i, /^bom dia/i, /^boa tarde/i, /^tchau/i],
      },
      { code: "zh", patterns: [/^你好/i, /^再见/i] },
      { code: "ar", patterns: [/^مرحبا/i, /^السلام عليكم/i] },
      { code: "ur", patterns: [/^ہیلو/i, /^السلام علیکم/i] },
      { code: "bn", patterns: [/^হ্যালো/i, /^নমস্কার/i] },
      { code: "so", patterns: [/^salaan/i, /^nabad/i] },
      { code: "pa", patterns: [/^ਸਤ ਸ੍ਰੀ ਅਕਾਲ/i, /^ਨਮਸਕਾਰ/i] },
    ];

    for (const lang of languagePatterns) {
      if (lang.patterns.some((pattern) => pattern.test(lowerText))) {
        return getLanguage(lang.code);
      }
    }

    return null; // No language detected, keep current
  }

  private showLanguageSelector(): void {
    // Show language carousel
    const currentIndex = languages.findIndex(
      (l) => l.code === this.currentLanguage.code,
    );
    const nextIndex = (currentIndex + 1) % languages.length;
    this.setLanguage(languages[nextIndex].code);
  }

  public setLanguage(code: string, silent = false): void {
    this.currentLanguage = getLanguage(code);
    this.voice?.setLanguage(this.currentLanguage.voiceLang);

    // Morph to flag shape with flag colors and pattern
    this.particle3D?.morphToFlag(
      this.currentLanguage.flagColors,
      this.currentLanguage.code,
    );

    // Only announce language change if explicitly selected (not auto-detected)
    if (!silent) {
      const message = `${this.currentLanguage.nativeName} ${this.currentLanguage.flag}`;
      this.addMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: message,
        timestamp: new Date(),
      });
    }

    // Speak confirmation - use Fish Audio if available
    if (this.config.features.voice) {
      this.stopAllSpeechAsync().then(() => {
        if (this.fishVoice) {
          const cleanGreeting = this.cleanTextForDisplay(
            this.currentLanguage.greeting,
          );
          this.fishVoice
            .speakAndPlay(
              cleanGreeting,
              this.currentPersona,
              this.currentLanguage.code,
            )
            .catch((error) => {
              console.error("[Ed] Fish Audio error in setLanguage:", error);
              // Don't fallback to browser TTS - it causes dual audio
              console.warn(
                "[Ed] Skipping browser TTS fallback to prevent dual audio",
              );
            });
        } else {
          // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
          if (!this.config.disableBrowserTTS) {
            this.speak(this.currentLanguage.greeting);
          }
        }
      });
    }

    // Return to sphere after delay
    setTimeout(() => {
      this.particle3D?.morphTo("sphere");
    }, 2000);
  }

  private cyclePersona(): void {
    // Cycle through main chatbot voices first, then character voices
    const mainVoices: PersonaType[] = ["ed", "edwina"];
    const characterVoices: PersonaType[] = ["santa", "elf", "headteacher"];
    const allPersonas: PersonaType[] = [...mainVoices, ...characterVoices];

    const currentIndex = allPersonas.indexOf(this.currentPersona);
    const nextIndex = (currentIndex + 1) % allPersonas.length;
    this.setPersona(allPersonas[nextIndex]);
  }

  public setPersona(persona: PersonaType): void {
    this.currentPersona = persona;
    const p = getPersona(persona);

    // Update particle color (if supported)
    if (
      this.particle3D &&
      typeof (this.particle3D as any).setColor === "function"
    ) {
      (this.particle3D as any).setColor(p.color);
    }

    // Announce
    this.addMessage({
      id: crypto.randomUUID(),
      role: "system",
      content: `${p.icon} ${p.name} is here to help!`,
      timestamp: new Date(),
    });
  }

  private showSettings(): void {
    // Cycle through themes
    const themes = ["standard", "warm", "cool", "contrast"];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  public setTheme(theme: string): void {
    this.currentTheme = theme;
    // Update theme class on app-panel (matching original)
    this.widget?.classList.remove(
      "theme-standard",
      "theme-warm",
      "theme-cool",
      "theme-contrast",
    );
    this.widget?.classList.add(`theme-${theme}`);
  }

  /**
   * Set tool context for Toolbox Workspace integration
   * When a user selects a tool, Ed becomes aware of it and can provide contextual help
   */
  public setToolContext(
    tool: {
      name: string;
      category: string;
      url?: string;
      expertise: string[];
    } | null,
  ): void {
    this.toolContext = tool;

    if (tool) {
      // Show shape relevant to tool category
      const shapeMap: Record<string, ParticleShape> = {
        Finance: "calculator",
        Teaching: "book",
        SEND: "heart",
        Compliance: "document",
        HR: "phone",
        Data: "search",
        Admin: "calendar",
        Estates: "location",
      };
      const shape = shapeMap[tool.category] || "lightbulb";
      this.particle3D?.morphTo(shape);

      // Add contextual greeting message
      this.addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I see you're using ${tool.name}. I can help you with ${tool.expertise.slice(0, 3).join(", ")}. What would you like to know?`,
        timestamp: new Date(),
      });

      console.log("[Ed] Tool context set:", tool.name, "→", shape);
    } else {
      // Reset to default sphere
      this.particle3D?.morphTo("sphere");
      console.log("[Ed] Tool context cleared");
    }
  }

  /**
   * Get current tool context (for AI prompt building)
   */
  public getToolContext(): {
    name: string;
    category: string;
    url?: string;
    expertise: string[];
  } | null {
    return this.toolContext;
  }

  private showMagicTools(): void {
    // Morph to pencil for form fill mode
    this.particle3D?.morphTo("pencil");

    this.addMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "✨ Magic Tools activated! I can help you fill forms, summarize pages, or create quizzes. What would you like?",
      timestamp: new Date(),
    });
  }

  private handleToolAction(tool: string): void {
    switch (tool) {
      case "form-fill":
        this.particle3D?.morphTo("pencil");
        this.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "📝 Form Fill mode activated! I can help you fill out forms on this page. Just tell me what information you'd like to enter.",
          timestamp: new Date(),
        });
        break;
      case "page-scan":
        this.particle3D?.morphTo("lightbulb");
        this.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "🔍 Page Scan activated! I'm analyzing this page to help you understand its content.",
          timestamp: new Date(),
        });
        break;
      case "calendar":
        this.particle3D?.morphTo("star");
        this.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "📅 Calendar view activated! I can help you find important dates and events.",
          timestamp: new Date(),
        });
        break;
      case "emoji-tester":
        if (!this.emojiTester) {
          // Create a temporary container for the emoji tester
          const tempContainer = document.createElement("div");
          document.body.appendChild(tempContainer);
          this.emojiTester = new EmojiTester(tempContainer);
        }
        this.emojiTester.toggle();
        break;
    }
  }

  private checkForForms(): void {
    const forms = this.formFiller?.detectForms();
    if (forms && forms.length > 0) {
      // Will offer help when widget opens
      console.log("[Ed] Found forms on page:", forms.length);
    }
  }

  /**
   * Position the chat panel based on where the launcher button is on screen.
   * If launcher is on the right, panel opens to the left of it (and vice versa).
   * If launcher is near the bottom, panel grows upward. If near top, grows downward.
   */
  private positionChatPanel(): void {
    if (!this.launcherPosition) return; // Use default CSS positioning

    const pos = this.launcherPosition;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Panel dimensions
    const panelW = Math.min(400, vw - 40); // Responsive width
    const panelH = Math.min(600, vh - 40); // Responsive height

    // Determine which side to open on
    const onRightHalf = pos.x > vw / 2;
    const onBottomHalf = pos.y > vh / 2;

    let left: number;
    let top: number;

    if (onRightHalf) {
      // Panel opens to the left of the launcher
      left = Math.max(10, pos.x - panelW + 64);
    } else {
      // Panel opens to the right of the launcher
      left = Math.min(vw - panelW - 10, pos.x);
    }

    if (onBottomHalf) {
      // Panel grows upward from launcher
      top = Math.max(10, pos.y - panelH + 64);
    } else {
      // Panel grows downward from launcher
      top = Math.min(vh - panelH - 10, pos.y);
    }

    // Apply to container
    this.container.style.position = "fixed";
    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
    this.container.style.bottom = "auto";
    this.container.style.right = "auto";
    this.container.style.width = `${panelW}px`;
    this.container.style.height = `${panelH}px`;
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    if (this.isOpen) return;

    this.isOpen = true;

    // Render widget on first open
    if (!this.widget) {
      this.renderWidget();
    }

    // Position the chat panel relative to the launcher position
    this.positionChatPanel();

    // Add widget-active class to body (matching original)
    document.body.classList.add("widget-active");
    document.body.classList.add("view-chat");

    // Start particle animation and activate solar system → chaser transition
    if (this.particle3D) {
      // Start animation (isRunning check handled inside start method)
      this.particle3D.start();
      // Trigger transition to chaser formation (planets spiral in)
      this.particle3D.setActive(true);
    }

    // Update status
    this.statusPill?.setState("ready");

    // Show greeting after a brief delay
    setTimeout(() => {
      this.showGreeting();
    }, 300);
  }

  public close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Reset container position so launcher stays visible at its dragged position
    if (this.launcherPosition) {
      this.container.style.width = "";
      this.container.style.height = "";
      // Keep the container out of the way — the launcher is positioned independently
    }

    // Remove widget-active class from body
    document.body.classList.remove("widget-active");
    document.body.classList.remove("view-chat");

    // Stop listening if active
    if (this.isListening) {
      this.voice?.stop();
    }

    // Return particles to solar system formation
    if (this.particle3D) {
      this.particle3D.setActive(false);
    }

    // Update status
    this.statusPill?.setState("ready");
  }

  public destroy(): void {
    this.close();
    this.particle3D?.destroy();
    this.launcherParticle3D?.destroy();
    this.voice?.destroy();
    this.container.remove();
  }
}
