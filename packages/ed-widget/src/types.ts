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
  fishAudioApiKey?: string;
  fishAudioVoiceIds?: Record<PersonaType, string>;
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

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language?: string;
  translation?: string; // For dual-language display
  quickReplies?: string[]; // Quick reply button options
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

