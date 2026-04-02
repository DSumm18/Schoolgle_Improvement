/**
 * Ed Widget Type Definitions
 */

export interface EdConfig {
  schoolId: string;
  apiKey?: string;
  theme: 'standard' | 'warm' | 'cool' | 'contrast' | 'auto';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  language: string;
  persona: PersonaType;
  mode?: 'website' | 'support' | 'school'; // Mode: website (public visitors), support (login help), or school (logged-in staff)
  apiBaseUrl?: string; // Base URL for API calls (e.g., /api/ed/chat)
  features: {
    admissions: boolean;
    policies: boolean;
    calendar: boolean;
    staffDirectory: boolean;
    formFill: boolean;
    voice: boolean;
  };
  customKnowledge?: string[];
  geminiApiKey?: string;
  openRouterApiKey?: string; // OpenRouter API key
  fishAudioApiKey?: string;
  fishAudioVoiceIds?: Record<PersonaType, string>;
  disableBrowserTTS?: boolean; // Disable browser TTS fallback (only use Fish Audio)
  provider?: 'openrouter' | 'gemini' | 'api'; // LLM provider selection (api = use /api/ed/chat endpoint)
  enableAI?: boolean; // Enable/disable AI features
  enableTTS?: boolean; // Enable/disable TTS features
  ttsProvider?: 'browser' | 'fish'; // TTS provider selection
  organizationId?: string; // User's organization ID (for logged-in users)
  userId?: string; // User ID (for logged-in users)
}

export type PersonaType = 'ed' | 'edwina' | 'santa' | 'elf' | 'headteacher' | 'custom';

export interface Persona {
  id: PersonaType;
  name: string;
  color: string;
  voicePitch: number;
  voiceRate: number;
  greeting: string;
  icon: string;
}

export interface ConfirmationAction {
  id: string;
  description: string;          // "I can take you to the Energy Dashboard"
  confirmLabel?: string;        // "Yes, take me there" (default: "Yes")
  declineLabel?: string;        // "No thanks" (default: "No thanks")
  action: string;               // serialized action type: "navigate:/dashboard/estates/energy"
  resolved?: boolean;           // true once user responds
  choice?: 'confirmed' | 'declined';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language?: string;
  translation?: string; // For dual-language display
  quickReplies?: string[]; // Quick reply button options
  confirmation?: ConfirmationAction; // Confirmation card with Yes/No buttons
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  flagColors: string[];
  voiceLang: string;
  greeting: string;
}

export type ParticleShape = 
  // Core shapes
  | 'sphere' | 'pencil' | 'lightbulb' | 'flag' | 'heart' | 'star' | 'logo' | 'thumbsup' | 'checkmark' | 'smiley'
  // Essential new shapes
  | 'book' | 'clock' | 'warning' | 'question' | 'loading' | 'calendar' | 'search' | 'phone' | 'location'
  // Celebration shapes
  | 'fireworks' | 'party' | 'confetti' | 'trophy' | 'excited'
  // Additional shapes
  | 'thinking' | 'confused' | 'error' | 'speech' | 'document' | 'calculator' | 'bell' | 'graduation';

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
}

export interface FormField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

export type DockAction =
  | 'magic-tools'
  | 'settings'
  | 'language'
  | 'persona'
  | 'microphone'
  | 'keyboard'
  | 'close';

export interface SchoolgleConfig {
  schoolId: string;
  apiKey: string;
  features: {
    admissions: boolean;
    policies: boolean;
    calendar: boolean;
    staffDirectory: boolean;
  };
  customKnowledge?: string[];
}

