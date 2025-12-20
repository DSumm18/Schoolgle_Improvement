/**
 * Ed - Main Widget Class
 * Orchestrates all components and handles state
 */

import { Particle3D } from './components/Particle3D';
import { Dock } from './components/Dock';
import { Chat } from './components/Chat';
import { VoiceInput } from './components/VoiceInput';
import { StatusPill } from './components/StatusPill';
import { EmojiTester } from './components/EmojiTester';
import { GeminiClient } from './ai/gemini';
import { getPersona, personas } from './ai/prompts';
import { languages, getLanguage } from './utils/flags';
import { FormFiller } from './features/formFill';
import { ProactiveService } from './features/proactive';
import { FishAudioVoice } from './voice/fish-audio';
import { getIntroForPersona, processAIResponse } from './voice/intro-scripts';
import { pageScanner } from './features/pageScan';
import type { EdConfig, Message, ParticleShape, PersonaType, Language } from './types';

const DEFAULT_CONFIG: EdConfig = {
  schoolId: 'demo',
  theme: 'standard',
  position: 'bottom-right',
  language: 'en-GB',
  persona: 'ed',
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

  // Components
  private particle3D: Particle3D | null = null;
  private launcherParticle3D: Particle3D | null = null;
  private dock: Dock | null = null;
  private chat: Chat | null = null;
  private voice: VoiceInput | null = null;
  private ai: GeminiClient | null = null;
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
  private toolContext: { name: string; category: string; url?: string; expertise: string[] } | null = null;

  constructor(config: Partial<EdConfig> = {}) {
    // Read from window.ED_CONFIG if available (extension context)
    const edConfig = (window as any).ED_CONFIG;
    
    // Merge: window.ED_CONFIG (extension) > passed config > defaults
    const mergedConfig: Partial<EdConfig> = {
      ...DEFAULT_CONFIG,
      ...config,
      ...(edConfig ? {
        // Only override with ED_CONFIG if it exists
        geminiApiKey: edConfig.geminiApiKey || config.geminiApiKey,
        openRouterApiKey: edConfig.openRouterApiKey || config.openRouterApiKey,
        fishAudioApiKey: edConfig.fishAudioApiKey || config.fishAudioApiKey,
        provider: edConfig.provider || config.provider,
        enableAI: edConfig.enableAI !== undefined ? edConfig.enableAI : config.enableAI,
        enableTTS: edConfig.enableTTS !== undefined ? edConfig.enableTTS : config.enableTTS,
        ttsProvider: edConfig.ttsProvider || config.ttsProvider,
        schoolId: edConfig.schoolId || config.schoolId,
        language: edConfig.language || config.language,
        persona: edConfig.persona || config.persona,
      } : {}),
    };
    
    this.config = mergedConfig as EdConfig;
    this.currentLanguage = getLanguage(this.config.language);
    this.currentPersona = this.config.persona;
    this.currentTheme = this.config.theme;
    
    // Log configuration
    if (edConfig) {
      console.log('[Ed] Provider:', edConfig.provider || 'not set');
      console.log('[Ed] TTS:', edConfig.enableTTS ? (edConfig.ttsProvider || 'browser') : 'disabled');
      console.log('[Ed] Keys present:', {
        openrouter: !!(this.config as any).openRouterApiKey,
        gemini: !!this.config.geminiApiKey,
        fish: !!this.config.fishAudioApiKey,
      });
    }

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'ed-widget-container';
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

    console.log('[Ed] Widget initialized', this.config);
  }

  private initComponents(): void {
    const provider = (this.config as any).provider || 'gemini'; // Default to gemini for backward compat
    const enableAI = (this.config as any).enableAI !== false; // Default to true
    const enableTTS = (this.config as any).enableTTS !== false; // Default to true
    const ttsProvider = (this.config as any).ttsProvider || 'browser';
    
    // AI Client - only initialize if AI is enabled and provider is selected
    if (enableAI) {
      if (provider === 'gemini' && this.config.geminiApiKey) {
        try {
          this.ai = new GeminiClient(this.config.geminiApiKey);
          // Check available models (async, won't block)
          this.ai.listAvailableModels().then(models => {
            if (models.length > 0) {
              console.log(`[Ed] ✅ Gemini API connected. Available models: ${models.join(', ')}`);
            } else {
              console.warn('[Ed] ⚠️ Gemini API connected but no models found. Check your API key permissions.');
            }
          }).catch(err => {
            console.warn('[Ed] ⚠️ Could not list Gemini models:', err);
          });
        } catch (error) {
          console.error('[Ed] ❌ Gemini client initialization failed:', error);
        }
      } else if (provider === 'openrouter' && (this.config as any).openRouterApiKey) {
        // TODO: Initialize OpenRouter client when implemented
        console.log('[Ed] ✅ OpenRouter provider selected (client initialization pending)');
      } else {
        // Only warn if AI is enabled but provider/key not set
        if (provider === 'gemini' && !this.config.geminiApiKey) {
          console.debug('[Ed] Gemini provider selected but API key not set. AI features disabled.');
        } else if (provider === 'openrouter' && !(this.config as any).openRouterApiKey) {
          console.debug('[Ed] OpenRouter provider selected but API key not set. AI features disabled.');
        }
      }
    } else {
      console.log('[Ed] AI disabled in configuration');
    }

    // Fish Audio Voice - only initialize if TTS is enabled and provider is fish
    if (enableTTS && ttsProvider === 'fish') {
      if (this.config.fishAudioApiKey && this.config.fishAudioApiKey.trim() !== '') {
        try {
          this.fishVoice = new FishAudioVoice(
            this.config.fishAudioApiKey,
            this.config.fishAudioVoiceIds
          );
          console.log('[Ed] ✅ Fish Audio voice initialized', {
            hasApiKey: !!this.config.fishAudioApiKey,
            voiceIds: this.config.fishAudioVoiceIds,
          });
        } catch (error) {
          console.error('[Ed] ❌ Fish Audio initialization failed:', error);
        }
      } else {
        console.debug('[Ed] Fish Audio provider selected but API key not set. Falling back to browser TTS.');
      }
    } else if (enableTTS && ttsProvider === 'browser') {
      console.log('[Ed] Using browser TTS');
    } else {
      console.log('[Ed] TTS disabled in configuration');
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
    const launcherGroup = document.createElement('div');
    launcherGroup.id = 'launcher-group';
    launcherGroup.innerHTML = `
      <div class="launcher-label">Ask Ed</div>
      <div id="launcher-btn" title="Open Assistant">
        <div id="launcher-logo-container"></div>
      </div>
    `;

    const launcherBtn = launcherGroup.querySelector('#launcher-btn') as HTMLElement;
    launcherBtn.addEventListener('click', () => this.toggle());

    this.container.appendChild(launcherGroup);

    // Create Particle3D logo for launcher button (instead of CSS version)
    this.createParticle3DLogo();
  }

  private createParticle3DLogo(): void {
    const container = document.getElementById('launcher-logo-container');
    if (!container) return;

    // Create canvas container for Particle3D
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'launcher-particle3d-container';
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
      console.log('[Ed] Launcher Particle3D initialized');
    } catch (error) {
      console.error('[Ed] Failed to initialize launcher Particle3D:', error);
      // Fallback to simple circle if WebGL fails
      canvasContainer.innerHTML = '<div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>';
    }
  }

  private renderWidget(): void {
    if (this.widget) return;

    // Create app-panel matching original structure
    this.widget = document.createElement('div');
    this.widget.id = 'app-panel';
    this.widget.className = `theme-${this.currentTheme}`;
    this.widget.innerHTML = `
      <div class="status-pill" id="status-pill">Ready</div>
      
      <!-- Chat Container -->
      <div class="chat-container">
        <div id="chat-messages" class="chat-scroll scrollbar-hide"></div>
        <div class="input-bar">
          <input type="text" id="chat-input" placeholder="Ask about admissions..." class="bg-transparent border-none text-white text-sm placeholder-slate-400 flex-grow outline-none" autocomplete="off">
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
      document.body.classList.add('widget-active');
    }

    // Initialize 3D particle avatar (canvas-container)
    const canvasContainer = this.widget.querySelector('#canvas-container') as HTMLElement;
    if (canvasContainer) {
      console.log('[Ed] Initializing particle system in container:', canvasContainer);
      // Ensure container is visible and has dimensions
      canvasContainer.style.display = 'block';
      canvasContainer.style.visibility = 'visible';
      canvasContainer.style.opacity = '1';
      canvasContainer.style.width = '300px';
      canvasContainer.style.height = '300px';
      canvasContainer.style.position = 'absolute';
      canvasContainer.style.bottom = '60px';
      canvasContainer.style.right = '0';
      canvasContainer.style.zIndex = '10';
      this.particle3D = new Particle3D(canvasContainer);
      // Don't start here - will start when widget opens
    } else {
      console.error('[Ed] Canvas container not found!');
    }

    // Initialize chat (chat-messages container)
    const chatMessages = this.widget.querySelector('#chat-messages') as HTMLElement;
    this.chat = new Chat(chatMessages, (text: string) => {
      // Handle quick reply click - check if it's a language switch
      if (text.includes('🇬🇧') || text.includes('English')) {
        this.setLanguage('en-GB');
      } else if (text.includes('🇵🇱') || text.includes('Polski')) {
        this.setLanguage('pl');
      } else if (text.includes('🇷🇴') || text.includes('Română')) {
        this.setLanguage('ro');
      } else if (text.includes('🇪🇸') || text.includes('Español')) {
        this.setLanguage('es');
      } else {
        // Regular message
        this.handleUserInput(text);
      }
    });

    // Initialize status pill
    const statusPillEl = this.widget.querySelector('#status-pill') as HTMLElement;
    if (statusPillEl) {
      this.statusPill = new StatusPill(this.widget);
    }

    // Initialize dock
    const dockEl = this.widget.querySelector('#app-dock') as HTMLElement;
    this.dock = new Dock(dockEl, {
      onAction: (action) => this.handleDockAction(action),
      onToolAction: (tool: string) => this.handleToolAction(tool),
      onSettingChange: (theme: string) => this.setTheme(theme as any),
      onLanguageChange: (lang: string) => this.setLanguage(lang),
      onPersonaChange: (persona: string) => this.setPersona(persona as PersonaType),
    });

    // Bind input events (matching original IDs)
    const input = this.widget.querySelector('#chat-input') as HTMLInputElement;
    const sendBtn = this.widget.querySelector('#send-btn') as HTMLButtonElement;

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        this.handleUserInput(input.value.trim());
        input.value = '';
      }
    });

    sendBtn?.addEventListener('click', () => {
      if (input.value.trim()) {
        this.handleUserInput(input.value.trim());
        input.value = '';
      }
    });

    // Show greeting
    this.showGreeting();
  }

  private bindEvents(): void {
    // Listen for escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  private showGreeting(): void {
    const persona = getPersona(this.currentPersona);

    // Check if first visit
    const isFirstVisit = !localStorage.getItem('ed-visited');
    if (isFirstVisit) {
      localStorage.setItem('ed-visited', 'true');
    }

    // Detect page context
    const forms = this.formFiller?.detectForms() || [];
    const hasForm = forms.length > 0;
    const isAdmissionsPage = window.location.pathname.toLowerCase().includes('admission') ||
      window.location.pathname.toLowerCase().includes('apply') ||
      window.location.pathname.toLowerCase().includes('enrol');

    // Get engaging intro with emotions (if Fish Audio available)
    let greeting: string;
    if (this.fishVoice) {
      // Use emotion-rich intro script
      greeting = getIntroForPersona(this.currentPersona, {
        hasForm,
        isAdmissionsPage,
        isFirstVisit,
      });
    } else {
      // Fallback to simple greeting
      greeting = this.getLocalizedGreeting();
      if (hasForm) {
        greeting += ` I can see you're on an admissions page. Would you like help filling out the form?`;
      }
    }

    // Display greeting (clean for chat, but keep original for voice)
    const displayText = this.cleanTextForDisplay(greeting);

    this.addMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: displayText, // Clean text for display
      timestamp: new Date(),
      language: this.currentLanguage.code,
    });

    // Morph avatar based on context
    if (hasForm) {
      setTimeout(() => this.particle3D?.morphTo('pencil'), 1000);
      setTimeout(() => this.particle3D?.morphTo('sphere'), 3000);
    }

    // Speak greeting with emotions (Fish Audio) or fallback
    if (this.config.features.voice) {
      // Stop any ongoing speech first (async to prevent conflicts)
      this.stopAllSpeechAsync().then(() => {
        if (this.fishVoice) {
          // Use Fish Audio - REMOVE emotion tags as Fish Audio doesn't support them in text
          // Fish Audio uses voice cloning for emotion, not text tags
          const cleanGreeting = this.cleanTextForDisplay(greeting);
          console.log('[Ed] Using Fish Audio for greeting');
          this.fishVoice.speakAndPlay(cleanGreeting, this.currentPersona, this.currentLanguage.code)
            .then(() => {
              console.log('[Ed] Fish Audio greeting playback completed');
            })
            .catch((error) => {
              console.error('[Ed] Fish Audio error:', error);
              console.error('[Ed] Error details:', error.message);
              // Don't fallback to browser TTS - it causes dual audio
              // Only log the error and continue silently
              console.warn('[Ed] Skipping browser TTS fallback to prevent dual audio');
            });
        } else {
          // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
          // This is an emergency fallback only
          if (!this.config.disableBrowserTTS) {
            console.warn('[Ed] Fish Audio not available, using browser TTS for greeting (emergency fallback)');
            this.speak(displayText);
          } else {
            console.warn('[Ed] Fish Audio not available and browser TTS disabled - no voice output');
          }
        }
      });
    }
  }

  private getLocalizedGreeting(): string {
    const persona = getPersona(this.currentPersona);
    if (this.currentLanguage.code === 'en-GB') {
      return persona.greeting;
    }
    return this.currentLanguage.greeting;
  }

  private async handleUserInput(text: string): Promise<void> {
    // Auto-detect language from user input
    const detectedLang = this.detectLanguage(text);
    if (detectedLang && detectedLang.code !== this.currentLanguage.code) {
      // Switch language and morph to flag
      this.setLanguage(detectedLang.code);
    }

    // Check if we are in form filling mode
    if (this.formFiller?.getCurrentField()) {
      const filled = this.formFiller.fillFieldByVoice(text);
      if (filled) {
        // Add user message
        this.addMessage({
          id: crypto.randomUUID(),
          role: 'user',
          content: text,
          timestamp: new Date(),
          language: this.currentLanguage.code,
        });

        // Move to next field
        const nextField = this.formFiller.nextField();
        if (nextField) {
          const response = `Got it. Next is ${nextField.label}. What should I put?`;
          this.addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            language: this.currentLanguage.code,
          });

          // Use Fish Audio if available, otherwise browser TTS (fallback only)
          if (this.config.features.voice) {
            this.stopAllSpeechAsync().then(() => {
              if (this.fishVoice) {
                const cleanResponse = this.cleanTextForDisplay(response);
                this.fishVoice.speakAndPlay(cleanResponse, this.currentPersona, this.currentLanguage.code)
                  .catch((error) => {
                    console.error('[Ed] Fish Audio error in form fill:', error);
                    // Don't fallback to browser TTS - it causes dual audio
                    console.warn('[Ed] Skipping browser TTS fallback to prevent dual audio');
                  });
              } else {
                // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
                if (!this.config.disableBrowserTTS) {
                  this.speak(response);
                }
              }
            });
          }
          return; // CRITICAL: Prevent AI from responding during form filling
        } else {
          // Form complete
          const response = "That's the last field! Would you like me to submit the form now?";
          this.addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            language: this.currentLanguage.code,
          });

          // Use Fish Audio if available, otherwise browser TTS (fallback only)
          if (this.config.features.voice) {
            this.stopAllSpeechAsync().then(() => {
              if (this.fishVoice) {
                const cleanResponse = this.cleanTextForDisplay(response);
                this.fishVoice.speakAndPlay(cleanResponse, this.currentPersona, this.currentLanguage.code)
                  .catch((error) => {
                    console.error('[Ed] Fish Audio error in form fill:', error);
                    // Don't fallback to browser TTS - it causes dual audio
                    console.warn('[Ed] Skipping browser TTS fallback to prevent dual audio');
                  });
              } else {
                // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
                if (!this.config.disableBrowserTTS) {
                  this.speak(response);
                }
              }
            });
          }
          this.particle3D?.morphTo('checkmark');
          return; // CRITICAL: Prevent AI from responding during form completion
        }
      }
    }

    // Add user message with translation if needed
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      language: this.currentLanguage.code,
    };

    // If language is not English, add English translation
    if (this.currentLanguage.code !== 'en-GB') {
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
    if (lowerText.includes('excited') || lowerText.includes('wow') || lowerText.includes('yay') || 
        lowerText.includes('fantastic') || lowerText.includes('amazing') || lowerText.includes('brilliant') ||
        lowerText.includes('can\'t wait') || lowerText.includes('looking forward') || lowerText.includes('thrilled') ||
        lowerText.includes('delighted') || lowerText.includes('celebration') || lowerText.includes('celebrate') ||
        lowerText.includes('party') || lowerText.includes('special') || lowerText.includes('great news') ||
        lowerText.includes('wonderful news')) {
      this.particle3D?.morphTo('excited');
    } else if (lowerText.includes('fireworks') || lowerText.includes('🎆')) {
      this.particle3D?.morphTo('fireworks');
    } else if (lowerText.includes('confetti') || lowerText.includes('🎊')) {
      this.particle3D?.morphTo('confetti');
    } else if (lowerText.includes('trophy') || lowerText.includes('achievement') || lowerText.includes('award') ||
               lowerText.includes('won') || lowerText.includes('victory') || lowerText.includes('champion') ||
               lowerText.includes('first place') || lowerText.includes('top') || lowerText.includes('best') ||
               lowerText.includes('excellent work') || lowerText.includes('well done') || lowerText.includes('congratulations') ||
               lowerText.includes('accomplishment') || lowerText.includes('milestone') || lowerText.includes('record') ||
               lowerText.includes('result')) {
      this.particle3D?.morphTo('trophy');
    
    // Essential shapes
    } else if (lowerText.includes('information') || lowerText.includes('info') || lowerText.includes('details') ||
               lowerText.includes('tell me') || lowerText.includes('explain') || lowerText.includes('about') ||
               lowerText.includes('read') || lowerText.includes('learn') || lowerText.includes('know') ||
               lowerText.includes('understand') || lowerText.includes('what is') || lowerText.includes('what are') ||
               lowerText.includes('describe') || lowerText.includes('definition') || lowerText.includes('meaning') ||
               lowerText.includes('guide') || lowerText.includes('manual') || lowerText.includes('handbook') ||
               lowerText.includes('policy') || lowerText.includes('procedure') || lowerText.includes('rule') ||
               lowerText.includes('regulation')) {
      this.particle3D?.morphTo('book');
    } else if (lowerText.includes('time') || lowerText.includes('when') || lowerText.includes('schedule') ||
               lowerText.includes('timetable') || lowerText.includes('hours') || lowerText.includes('opening') ||
               lowerText.includes('closing') || lowerText.includes('deadline') || lowerText.includes('date') ||
               lowerText.includes('appointment') || lowerText.includes('meeting') || lowerText.includes('event') ||
               lowerText.includes('term dates') || lowerText.includes('holiday') || lowerText.includes('break') ||
               lowerText.includes('half term') || lowerText.includes('start') || lowerText.includes('finish') ||
               lowerText.includes('end') || lowerText.includes('duration') || lowerText.includes('how long') ||
               lowerText.includes('what time')) {
      this.particle3D?.morphTo('clock');
    } else if (lowerText.includes('important') || lowerText.includes('urgent') || lowerText.includes('critical') ||
               lowerText.includes('required') || lowerText.includes('must') || lowerText.includes('need to') ||
               lowerText.includes('essential') || lowerText.includes('mandatory') || lowerText.includes('notice') ||
               lowerText.includes('alert') || lowerText.includes('attention') || lowerText.includes('warning') ||
               lowerText.includes('caution') || lowerText.includes('deadline approaching') || lowerText.includes('late') ||
               lowerText.includes('overdue') || lowerText.includes('missing') || lowerText.includes('required field')) {
      this.particle3D?.morphTo('warning');
    } else if (lowerText.includes('ask') || lowerText.includes('question') || lowerText.includes('query') ||
               lowerText.includes('unsure') || lowerText.includes('unclear') || lowerText.includes('confused') ||
               lowerText.includes('don\'t understand') || lowerText.includes('what do you mean') ||
               lowerText.includes('can you clarify') || lowerText.includes('explain again') || lowerText.includes('repeat') ||
               lowerText.includes('sorry') || lowerText.includes('pardon') || lowerText.includes('excuse me') ||
               lowerText.includes('what') || lowerText.includes('how') || lowerText.includes('why') ||
               lowerText.includes('where') || lowerText.includes('who') || lowerText.includes('which')) {
      this.particle3D?.morphTo('question');
    } else if (lowerText.includes('calendar') || lowerText.includes('event') || lowerText.includes('date') ||
               lowerText.includes('schedule') || lowerText.includes('term') || lowerText.includes('holiday') ||
               lowerText.includes('break') || lowerText.includes('half term') || lowerText.includes('inset day') ||
               lowerText.includes('open day') || lowerText.includes('tour') || lowerText.includes('visit') ||
               lowerText.includes('meeting') || lowerText.includes('appointment') || lowerText.includes('deadline') ||
               lowerText.includes('when is') || lowerText.includes('what date') || lowerText.includes('school calendar') ||
               lowerText.includes('academic year') || lowerText.includes('term dates')) {
      this.particle3D?.morphTo('calendar');
    } else if (lowerText.includes('search') || lowerText.includes('find') || lowerText.includes('look for') ||
               lowerText.includes('locate') || lowerText.includes('where is') || lowerText.includes('where can i find') ||
               lowerText.includes('show me') || lowerText.includes('find me') || lowerText.includes('look up') ||
               lowerText.includes('search for') || lowerText.includes('discover') || lowerText.includes('browse')) {
      this.particle3D?.morphTo('search');
    } else if (lowerText.includes('phone') || lowerText.includes('call') || lowerText.includes('telephone') ||
               lowerText.includes('contact') || lowerText.includes('number') || lowerText.includes('ring') ||
               lowerText.includes('speak to') || lowerText.includes('talk to') || lowerText.includes('reach') ||
               lowerText.includes('get in touch') || lowerText.includes('contact details') || lowerText.includes('phone number') ||
               lowerText.includes('mobile') || lowerText.includes('landline') || lowerText.includes('call me') ||
               lowerText.includes('ring me')) {
      this.particle3D?.morphTo('phone');
    } else if (lowerText.includes('address') || lowerText.includes('location') || lowerText.includes('where') ||
               lowerText.includes('find') || lowerText.includes('directions') || lowerText.includes('map') ||
               lowerText.includes('postcode') || lowerText.includes('post code') || lowerText.includes('street') ||
               lowerText.includes('road') || lowerText.includes('building') || lowerText.includes('site') ||
               lowerText.includes('campus') || lowerText.includes('how to get') || lowerText.includes('directions to') ||
               lowerText.includes('where is the school') || lowerText.includes('address of')) {
      this.particle3D?.morphTo('location');
    
    // Core shapes (existing)
    } else if (lowerText.includes('form') || lowerText.includes('fill') || lowerText.includes('write') ||
               lowerText.includes('type') || lowerText.includes('enter') || lowerText.includes('input') ||
               lowerText.includes('complete') || lowerText.includes('application') || lowerText.includes('submit') ||
               lowerText.includes('document') || lowerText.includes('sign') || lowerText.includes('paperwork')) {
      this.particle3D?.morphTo('pencil');
    } else if (lowerText.includes('help') || lowerText.includes('how') || lowerText.includes('what') ||
               lowerText.includes('why') || lowerText.includes('explain') || lowerText.includes('understand') ||
               lowerText.includes('idea') || lowerText.includes('suggest') || lowerText.includes('advice') ||
               lowerText.includes('guidance') || lowerText.includes('tip') || lowerText.includes('hint')) {
      this.particle3D?.morphTo('lightbulb');
    } else if (lowerText.includes('thank') || lowerText.includes('thanks') || lowerText.includes('appreciate') ||
               lowerText.includes('grateful') || lowerText.includes('love') || lowerText.includes('lovely') ||
               lowerText.includes('wonderful') || lowerText.includes('kind') || lowerText.includes('caring') ||
               lowerText.includes('sweet')) {
      this.particle3D?.morphTo('heart');
    } else if (lowerText.includes('yes') || lowerText.includes('please') || lowerText.includes('sure') ||
               lowerText.includes('okay') || lowerText.includes('ok') || lowerText.includes('agree') ||
               lowerText.includes('confirm') || lowerText.includes('accept') || lowerText.includes('correct') ||
               lowerText.includes('right') || lowerText.includes('exactly')) {
      this.particle3D?.morphTo('thumbsup');
    } else if (lowerText.includes('great') || lowerText.includes('perfect') || lowerText.includes('excellent') ||
               lowerText.includes('amazing') || lowerText.includes('fantastic') || lowerText.includes('brilliant') ||
               lowerText.includes('outstanding') || lowerText.includes('superb') || lowerText.includes('wonderful') ||
               lowerText.includes('awesome')) {
      this.particle3D?.morphTo('star');
    } else if (lowerText.includes('👍') || lowerText.includes('✓') || lowerText.includes('ok') ||
               lowerText.includes('done') || lowerText.includes('complete') || lowerText.includes('finished') ||
               lowerText.includes('ready') || lowerText.includes('confirmed') || lowerText.includes('submitted') ||
               lowerText.includes('success') || lowerText.includes('accomplished') || lowerText.includes('achieved')) {
      this.particle3D?.morphTo('checkmark');
    } else if (lowerText.includes('happy') || lowerText.includes('glad') || lowerText.includes('pleased') ||
               lowerText.includes('smile') || lowerText.includes('joy') || lowerText.includes('cheerful') ||
               lowerText.includes('delighted') || lowerText.includes('excited') || lowerText.includes('thrilled') ||
               lowerText.includes('wonderful') || lowerText.includes('😊') || lowerText.includes(':)')) {
      this.particle3D?.morphTo('smiley');
    
    // Additional shapes
    } else if (lowerText.includes('let me think') || lowerText.includes('considering') || lowerText.includes('hmm') ||
               lowerText.includes('um') || lowerText.includes('well') || lowerText.includes('actually') ||
               lowerText.includes('perhaps') || lowerText.includes('maybe') || lowerText.includes('might') ||
               lowerText.includes('could') || lowerText.includes('possibly') || lowerText.includes('not sure') ||
               lowerText.includes('let me see') || lowerText.includes('give me a moment') || lowerText.includes('thinking about') ||
               lowerText.includes('considering')) {
      this.particle3D?.morphTo('thinking');
    } else if (lowerText.includes('confused') || lowerText.includes('don\'t understand') || lowerText.includes('unclear') ||
               lowerText.includes('lost') || lowerText.includes('not sure') || lowerText.includes('puzzled') ||
               lowerText.includes('bewildered') || lowerText.includes('what') || lowerText.includes('huh') ||
               lowerText.includes('sorry') || lowerText.includes('pardon') || lowerText.includes('excuse me') ||
               lowerText.includes('repeat') || lowerText.includes('say again') || lowerText.includes('what do you mean') ||
               lowerText.includes('i don\'t get it')) {
      this.particle3D?.morphTo('confused');
    } else if (lowerText.includes('error') || lowerText.includes('problem') || lowerText.includes('issue') ||
               lowerText.includes('broken') || lowerText.includes('not working') || lowerText.includes('failed') ||
               lowerText.includes('mistake') || lowerText.includes('wrong') || lowerText.includes('incorrect') ||
               lowerText.includes('sorry there was an error') || lowerText.includes('something went wrong') ||
               lowerText.includes('unable to') || lowerText.includes('can\'t') || lowerText.includes('cannot')) {
      this.particle3D?.morphTo('error');
    } else if (lowerText.includes('message') || lowerText.includes('chat') || lowerText.includes('talk') ||
               lowerText.includes('speak') || lowerText.includes('conversation') || lowerText.includes('discuss') ||
               lowerText.includes('tell me') || lowerText.includes('say') || lowerText.includes('mention') ||
               lowerText.includes('communicate') || lowerText.includes('dialogue') || lowerText.includes('speak to') ||
               lowerText.includes('talk to') || lowerText.includes('have a chat')) {
      this.particle3D?.morphTo('speech');
    } else if (lowerText.includes('document') || lowerText.includes('form') || lowerText.includes('file') ||
               lowerText.includes('pdf') || lowerText.includes('download') || lowerText.includes('print') ||
               lowerText.includes('application') || lowerText.includes('letter') || lowerText.includes('report') ||
               lowerText.includes('certificate') || lowerText.includes('transcript') || lowerText.includes('record') ||
               lowerText.includes('paperwork') || lowerText.includes('document needed') || lowerText.includes('required document')) {
      this.particle3D?.morphTo('document');
    } else if (lowerText.includes('calculate') || lowerText.includes('math') || lowerText.includes('maths') ||
               lowerText.includes('number') || lowerText.includes('count') || lowerText.includes('add') ||
               lowerText.includes('subtract') || lowerText.includes('multiply') || lowerText.includes('divide') ||
               lowerText.includes('total') || lowerText.includes('sum') || lowerText.includes('cost') ||
               lowerText.includes('price') || lowerText.includes('fee') || lowerText.includes('payment') ||
               lowerText.includes('amount') || lowerText.includes('calculate') || lowerText.includes('work out') ||
               lowerText.includes('figure out')) {
      this.particle3D?.morphTo('calculator');
    } else if (lowerText.includes('notification') || lowerText.includes('alert') || lowerText.includes('reminder') ||
               lowerText.includes('notify') || lowerText.includes('inform') || lowerText.includes('tell me when') ||
               lowerText.includes('let me know') || lowerText.includes('alert me') || lowerText.includes('remind me') ||
               lowerText.includes('notification') || lowerText.includes('announcement') || lowerText.includes('update') ||
               lowerText.includes('news')) {
      this.particle3D?.morphTo('bell');
    } else if (lowerText.includes('graduation') || lowerText.includes('graduate') || lowerText.includes('leaving') ||
               lowerText.includes('year 6') || lowerText.includes('year 11') || lowerText.includes('year 13') ||
               lowerText.includes('a-levels') || lowerText.includes('gcse') || lowerText.includes('results') ||
               lowerText.includes('exam results') || lowerText.includes('certificate') || lowerText.includes('diploma') ||
               lowerText.includes('qualification') || lowerText.includes('finish school') || lowerText.includes('move on')) {
      this.particle3D?.morphTo('graduation');
    } else {
      this.particle3D?.morphTo('lightbulb');
    }

    // Show typing indicator
    const typingId = this.chat?.showTyping() || '';

    // Get AI response
    const response = await this.getAIResponse(text);

    // Hide typing
    this.chat?.hideTyping(typingId);

    // Morph back to sphere
    setTimeout(() => this.particle3D?.morphTo('sphere'), 500);

    // Add assistant message with translation if needed
    // Note: response is clean text from AI, we'll add emotion tags only for voice
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response, // Clean text for chat display
      timestamp: new Date(),
      language: this.currentLanguage.code,
    };

    // If language is not English, add English translation
    if (this.currentLanguage.code !== 'en-GB') {
      // In production, use proper translation API
      // For now, we'll add quick reply buttons for language switching
      assistantMessage.quickReplies = [
        `${this.currentLanguage.nativeName} ${this.currentLanguage.flag}`,
        'English 🇬🇧',
      ];
    } else {
      // Add language quick reply buttons for English
      assistantMessage.quickReplies = [
        'Polski PL 🇵🇱',
        'Română RO 🇷🇴',
        'Español ES 🇪🇸',
      ];
    }

    this.addMessage(assistantMessage);

    // Emoji reaction based on response
    const responseLower = response.toLowerCase();
    if (responseLower.includes('great!') || responseLower.includes('perfect!')) {
      setTimeout(() => {
        this.particle3D?.morphTo('thumbsup');
        setTimeout(() => this.particle3D?.morphTo('sphere'), 2000);
      }, 1000);
    } else if (responseLower.includes('happy to help') || responseLower.includes('glad')) {
      setTimeout(() => {
        this.particle3D?.morphTo('smiley');
        setTimeout(() => this.particle3D?.morphTo('sphere'), 2000);
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
          console.log('[Ed] Using Fish Audio for response');
          this.fishVoice.speakAndPlay(cleanResponse, this.currentPersona, this.currentLanguage.code)
            .then(() => {
              console.log('[Ed] Fish Audio playback completed');
            })
            .catch((error) => {
              console.error('[Ed] Fish Audio error:', error);
              console.error('[Ed] Error details:', error.message);
              // Don't fallback to browser TTS - it causes dual audio
              // Only log the error and continue silently
              console.warn('[Ed] Skipping browser TTS fallback to prevent dual audio');
            });
        } else {
          // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
          // This is an emergency fallback only
          if (!this.config.disableBrowserTTS) {
            console.warn('[Ed] Fish Audio not available, using browser TTS (emergency fallback)');
            this.speak(response);
          } else {
            console.warn('[Ed] Fish Audio not available and browser TTS disabled - no voice output');
          }
        }
      });
    }
  }

  private async getAIResponse(text: string): Promise<string> {
    // Smart fallback responses based on context
    const lowerText = text.toLowerCase();

    // Form filling intent
    if (lowerText.includes('form') || lowerText.includes('fill')) {
      const forms = this.formFiller?.detectForms();
      if (forms && forms.length > 0 && this.formFiller) {
        const field = this.formFiller.startFilling(forms[0]);
        if (field) {
          return `Great! I've found a form. I'll help you fill it out. The first field is ${field.label}. What should I type?`;
        }
      }
      return "I don't see any forms on this page. Are you looking for the admissions form?";
    }

    // Admissions queries
    if (lowerText.includes('admission') || lowerText.includes('enrol') || lowerText.includes('apply')) {
      return "I can help with admissions! This school typically has deadlines in January for Reception class. You can fill out the enquiry form on this page, or I can guide you through the local authority application process. What would you like to know?";
    }

    // Open days
    if (lowerText.includes('open day') || lowerText.includes('visit') || lowerText.includes('tour')) {
      return "According to the page, the next virtual tour is on Saturday, 12th December at 10:00 AM. Would you like me to help you register for it?";
    }

    // Contact info
    if (lowerText.includes('contact') || lowerText.includes('phone') || lowerText.includes('email')) {
      return "You can contact the school at:\n📧 admin@greenwoodhigh.edu\n📞 +44 (0) 20 7946 0123\n\nWould you like me to help you draft an email?";
    }

    // Try AI if available
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
Has forms: ${pageContent.forms > 0 ? 'Yes' : 'No'}
Key headings: ${pageContent.headings.slice(0, 5).join(', ')}
Summary: ${pageContent.mainContent.substring(0, 300)}`;
        } catch (error) {
          console.debug('[Ed] Could not extract page context:', error);
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
        console.error('[Ed] AI error:', error);
      }
    }

    // Generic fallback
    const fallbacks = [
      "I'm here to help! Could you tell me more about what you're looking for?",
      "That's a great question. I can help with admissions, forms, open days, and general school information. What would you like to know?",
      "I'd be happy to assist! You can ask me about admissions, filling out forms, term dates, or contacting the school.",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  private handleProactiveNudge(message: string): void {
    if (!this.isOpen) {
      // If closed, maybe show a notification badge or small popup
      // For now, just log it
      console.log('[Ed] Proactive nudge suppressed (closed):', message);
      return;
    }

    this.addMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: message,
      timestamp: new Date(),
      language: this.currentLanguage.code,
    });

    if (this.config.features.voice) {
      // Stop any ongoing speech first (async to prevent conflicts)
      this.stopAllSpeechAsync().then(() => {
        if (this.fishVoice) {
          const cleanMessage = this.cleanTextForDisplay(message);
          this.fishVoice.speakAndPlay(cleanMessage, this.currentPersona, this.currentLanguage.code)
            .catch((error) => {
              console.error('[Ed] Fish Audio error in proactive nudge:', error);
              // Don't fallback to browser TTS - it causes dual audio
              console.warn('[Ed] Skipping browser TTS fallback to prevent dual audio');
            });
        } else {
          // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
          if (!this.config.disableBrowserTTS) {
            this.speak(message);
          }
        }
      });
    }

    this.particle3D?.morphTo('lightbulb');
    setTimeout(() => this.particle3D?.morphTo('sphere'), 2000);
  }

  /**
   * Clean text for chat display - removes emotion tags, pauses, and formatting
   */
  private cleanTextForDisplay(text: string): string {
    return text
      // Remove emotion tags like (happy), (excited), etc.
      .replace(/\([^)]+\)/g, '')
      // Remove emojis (keep text only for display)
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      // Remove language codes
      .replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸\b/gi, '')
      .replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  private addMessage(message: Message): void {
    // Ensure message content is clean for display (no emotion tags)
    if (message.content) {
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
      console.warn('[Ed] ⚠️ Browser TTS disabled - skipping fallback');
      return;
    }

    // Only use browser TTS if Fish Audio is completely unavailable (not initialized)
    // NOT as a fallback for errors - that causes both voices to play simultaneously
    if (this.fishVoice) {
      console.warn('[Ed] ⚠️ Browser TTS called but Fish Audio is available - skipping to prevent dual audio');
      return; // Don't use browser TTS if Fish Audio exists, even if it errors
    }

    // Stop any ongoing speech (both Fish Audio and browser TTS)
    this.stopAllSpeech();

    // Clean text before speaking - remove emojis, formatting, instructional text
    // For browser TTS, don't preserve Fish Audio tags (they would be read out)
    const cleanedText = this.fishVoice?.cleanTextForTTS(text, false) || text
      .replace(/\([^)]+\)/g, '') // Remove emotion tags
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸\b/gi, '') // Remove language codes
      .replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi, '')
      .replace(/\s+/g, ' ')
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
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Stop Fish Audio and wait for it to fully stop
    if (this.fishVoice) {
      await this.fishVoice.stop(); // Now returns a promise, wait for it
      // Additional delay to ensure audio element is fully released
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private handleDockAction(action: string): void {
    switch (action) {
      case 'microphone':
        this.toggleListening();
        break;
      case 'keyboard':
        this.toggleKeyboard();
        break;
      case 'language':
        this.showLanguageSelector();
        break;
      case 'persona':
        this.cyclePersona();
        break;
      case 'settings':
        this.showSettings();
        break;
      case 'magic-tools':
        this.showMagicTools();
        break;
      case 'close':
        this.close();
        break;
    }
  }

  private toggleListening(): void {
    if (!this.voice) {
      // Show message even if chat is hidden
      const chatContainer = this.widget?.querySelector('.chat-container') as HTMLElement;
      const wasHidden = chatContainer?.classList.contains('chat-hidden');
      if (wasHidden) {
        chatContainer?.classList.remove('chat-hidden');
      }
      this.addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: '🎤 Voice input not available. Please use text input instead.',
        timestamp: new Date(),
      });
      if (wasHidden) {
        setTimeout(() => chatContainer?.classList.add('chat-hidden'), 3000);
      }
      return;
    }

    if (this.isListening) {
      this.voice.stop();
      this.isListening = false;
      this.dock?.setListening(false);
      this.statusPill?.setState('ready');
      // Morph back to sphere
      this.particle3D?.morphTo('sphere');
    } else {
      // Show chat temporarily if hidden, so user can see responses
      const chatContainer = this.widget?.querySelector('.chat-container') as HTMLElement;
      const wasHidden = chatContainer?.classList.contains('chat-hidden');
      if (wasHidden) {
        chatContainer?.classList.remove('chat-hidden');
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
            this.statusPill?.setState('listening');
            // Morph to indicate listening
            this.particle3D?.morphTo('lightbulb');
          })
          .catch((error) => {
            console.error('[Ed] Microphone permission denied:', error);
            this.addMessage({
              id: crypto.randomUUID(),
              role: 'system',
              content: '🎤 Microphone access denied. Please enable microphone permissions in your browser settings.',
              timestamp: new Date(),
            });
          });
      } else {
        this.voice.start();
        this.isListening = true;
        this.dock?.setListening(true);
        this.statusPill?.setState('listening');
        this.particle3D?.morphTo('lightbulb');
      }
    }
  }

  private toggleKeyboard(): void {
    this.showKeyboard = !this.showKeyboard;
    
    // Toggle chat container visibility (matching Gemini behavior)
    const chatContainer = this.widget?.querySelector('.chat-container') as HTMLElement;
    if (chatContainer) {
      if (this.showKeyboard) {
        // Hide chat - show particle avatar only
        chatContainer.classList.add('chat-hidden');
        // Ensure particle avatar is visible and prominent
        const canvasContainer = this.widget?.querySelector('#canvas-container') as HTMLElement;
        if (canvasContainer) {
          canvasContainer.style.opacity = '1';
          canvasContainer.style.visibility = 'visible';
          canvasContainer.style.zIndex = '20'; // Above everything when chat is hidden
        }
        // Update status
        this.statusPill?.setState('ready');
        this.statusPill?.show();
      } else {
        // Show chat - particle avatar behind
        chatContainer.classList.remove('chat-hidden');
        // Particle avatar back to normal z-index
        const canvasContainer = this.widget?.querySelector('#canvas-container') as HTMLElement;
        if (canvasContainer) {
          canvasContainer.style.zIndex = '10'; // Behind chat
        }
      }
    }
    
    console.log('[Ed] Chat toggled:', this.showKeyboard ? 'hidden (avatar visible)' : 'visible');
  }

  /**
   * Detect language from user input (simple keyword-based detection)
   */
  private detectLanguage(text: string): Language | null {
    const lowerText = text.toLowerCase().trim();

    // Common greetings and phrases in different languages
    const languagePatterns: Array<{ code: string; patterns: RegExp[] }> = [
      { code: 'es', patterns: [/^hola/i, /^buenos días/i, /^buenas tardes/i, /^buenas noches/i, /^adiós/i] },
      { code: 'fr', patterns: [/^bonjour/i, /^bonsoir/i, /^salut/i, /^au revoir/i] },
      { code: 'pl', patterns: [/^cześć/i, /^dzień dobry/i, /^dobry wieczór/i, /^do widzenia/i] },
      { code: 'ro', patterns: [/^bună/i, /^salut/i, /^la revedere/i] },
      { code: 'pt', patterns: [/^olá/i, /^bom dia/i, /^boa tarde/i, /^tchau/i] },
      { code: 'zh', patterns: [/^你好/i, /^再见/i] },
      { code: 'ar', patterns: [/^مرحبا/i, /^السلام عليكم/i] },
      { code: 'ur', patterns: [/^ہیلو/i, /^السلام علیکم/i] },
      { code: 'bn', patterns: [/^হ্যালো/i, /^নমস্কার/i] },
      { code: 'so', patterns: [/^salaan/i, /^nabad/i] },
      { code: 'pa', patterns: [/^ਸਤ ਸ੍ਰੀ ਅਕਾਲ/i, /^ਨਮਸਕਾਰ/i] },
    ];

    for (const lang of languagePatterns) {
      if (lang.patterns.some(pattern => pattern.test(lowerText))) {
        return getLanguage(lang.code);
      }
    }

    return null; // No language detected, keep current
  }

  private showLanguageSelector(): void {
    // Show language carousel
    const currentIndex = languages.findIndex((l) => l.code === this.currentLanguage.code);
    const nextIndex = (currentIndex + 1) % languages.length;
    this.setLanguage(languages[nextIndex].code);
  }

  public setLanguage(code: string): void {
    this.currentLanguage = getLanguage(code);
    this.voice?.setLanguage(this.currentLanguage.voiceLang);

    // Morph to flag shape with flag colors and pattern
    this.particle3D?.morphToFlag(this.currentLanguage.flagColors, this.currentLanguage.code);

    // Announce language change
    const message = `${this.currentLanguage.nativeName} ${this.currentLanguage.flag}`;
    this.addMessage({
      id: crypto.randomUUID(),
      role: 'system',
      content: message,
      timestamp: new Date(),
    });

    // Speak confirmation - use Fish Audio if available
    if (this.config.features.voice) {
      this.stopAllSpeechAsync().then(() => {
        if (this.fishVoice) {
          const cleanGreeting = this.cleanTextForDisplay(this.currentLanguage.greeting);
          this.fishVoice.speakAndPlay(cleanGreeting, this.currentPersona, this.currentLanguage.code)
            .catch((error) => {
              console.error('[Ed] Fish Audio error in setLanguage:', error);
              // Don't fallback to browser TTS - it causes dual audio
              console.warn('[Ed] Skipping browser TTS fallback to prevent dual audio');
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
      this.particle3D?.morphTo('sphere');
    }, 2000);
  }

  private cyclePersona(): void {
    // Cycle through main chatbot voices first, then character voices
    const mainVoices: PersonaType[] = ['ed', 'edwina'];
    const characterVoices: PersonaType[] = ['santa', 'elf', 'headteacher'];
    const allPersonas: PersonaType[] = [...mainVoices, ...characterVoices];
    
    const currentIndex = allPersonas.indexOf(this.currentPersona);
    const nextIndex = (currentIndex + 1) % allPersonas.length;
    this.setPersona(allPersonas[nextIndex]);
  }

  public setPersona(persona: PersonaType): void {
    this.currentPersona = persona;
    const p = getPersona(persona);

    // Update particle color
    this.particle3D?.setColor(p.color);

    // Announce
    this.addMessage({
      id: crypto.randomUUID(),
      role: 'system',
      content: `${p.icon} ${p.name} is here to help!`,
      timestamp: new Date(),
    });
  }

  private showSettings(): void {
    // Cycle through themes
    const themes = ['standard', 'warm', 'cool', 'contrast'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  public setTheme(theme: string): void {
    this.currentTheme = theme;
    // Update theme class on app-panel (matching original)
    this.widget?.classList.remove('theme-standard', 'theme-warm', 'theme-cool', 'theme-contrast');
    this.widget?.classList.add(`theme-${theme}`);
  }

  /**
   * Set tool context for Toolbox Workspace integration
   * When a user selects a tool, Ed becomes aware of it and can provide contextual help
   */
  public setToolContext(tool: { name: string; category: string; url?: string; expertise: string[] } | null): void {
    this.toolContext = tool;
    
    if (tool) {
      // Show shape relevant to tool category
      const shapeMap: Record<string, ParticleShape> = {
        'Finance': 'calculator',
        'Teaching': 'book',
        'SEND': 'heart',
        'Compliance': 'document',
        'HR': 'phone',
        'Data': 'search',
        'Admin': 'calendar',
        'Estates': 'location',
      };
      const shape = shapeMap[tool.category] || 'lightbulb';
      this.particle3D?.morphTo(shape);
      
      // Add contextual greeting message
      this.addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I see you're using ${tool.name}. I can help you with ${tool.expertise.slice(0, 3).join(', ')}. What would you like to know?`,
        timestamp: new Date(),
      });
      
      console.log('[Ed] Tool context set:', tool.name, '→', shape);
    } else {
      // Reset to default sphere
      this.particle3D?.morphTo('sphere');
      console.log('[Ed] Tool context cleared');
    }
  }

  /**
   * Get current tool context (for AI prompt building)
   */
  public getToolContext(): { name: string; category: string; url?: string; expertise: string[] } | null {
    return this.toolContext;
  }

  private showMagicTools(): void {
    // Morph to pencil for form fill mode
    this.particle3D?.morphTo('pencil');

    this.addMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: "✨ Magic Tools activated! I can help you fill forms, summarize pages, or create quizzes. What would you like?",
      timestamp: new Date(),
    });
  }

  private handleToolAction(tool: string): void {
    switch (tool) {
      case 'form-fill':
        this.particle3D?.morphTo('pencil');
        this.addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "📝 Form Fill mode activated! I can help you fill out forms on this page. Just tell me what information you'd like to enter.",
          timestamp: new Date(),
        });
        break;
      case 'page-scan':
        this.particle3D?.morphTo('lightbulb');
        this.addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "🔍 Page Scan activated! I'm analyzing this page to help you understand its content.",
          timestamp: new Date(),
        });
        break;
      case 'calendar':
        this.particle3D?.morphTo('star');
        this.addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "📅 Calendar view activated! I can help you find important dates and events.",
          timestamp: new Date(),
        });
        break;
      case 'emoji-tester':
        if (!this.emojiTester) {
          // Create a temporary container for the emoji tester
          const tempContainer = document.createElement('div');
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
      console.log('[Ed] Found forms on page:', forms.length);
    }
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

    // Add widget-active class to body (matching original)
    document.body.classList.add('widget-active');
    document.body.classList.add('view-chat');

    // Start particle animation and activate solar system → chaser transition
    if (this.particle3D) {
      // Start animation (isRunning check handled inside start method)
      this.particle3D.start();
      // Trigger transition to chaser formation (planets spiral in)
      this.particle3D.setActive(true);
    }

    // Update status
    this.statusPill?.setState('ready');

    // Show greeting after a brief delay
    setTimeout(() => {
      this.showGreeting();
    }, 300);
  }

  public close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Remove widget-active class from body
    document.body.classList.remove('widget-active');
    document.body.classList.remove('view-chat');

    // Stop listening if active
    if (this.isListening) {
      this.voice?.stop();
    }

    // Return particles to solar system formation
    if (this.particle3D) {
      this.particle3D.setActive(false);
    }

    // Update status
    this.statusPill?.setState('ready');
  }

  public destroy(): void {
    this.close();
    this.particle3D?.destroy();
    this.launcherParticle3D?.destroy();
    this.voice?.destroy();
    this.container.remove();
  }
}

