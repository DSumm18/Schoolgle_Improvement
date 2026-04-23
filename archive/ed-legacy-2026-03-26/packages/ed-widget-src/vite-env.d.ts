/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly MODE?: string;
  readonly VITE_FISH_AUDIO_API_KEY?: string;
  readonly VITE_FISH_AUDIO_VOICE_ID_ED?: string;
  readonly VITE_FISH_AUDIO_VOICE_ID_EDWINA?: string;
  readonly VITE_FISH_AUDIO_VOICE_ID_SANTA?: string;
  readonly VITE_FISH_AUDIO_VOICE_ID_ELF?: string;
  readonly VITE_FISH_AUDIO_VOICE_ID_HEADTEACHER?: string;
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

