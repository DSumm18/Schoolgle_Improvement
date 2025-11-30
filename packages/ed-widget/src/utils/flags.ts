/**
 * Flag Data - Languages and their flag colors
 * Priority languages for UK schools
 */

import type { Language } from '../types';

export const languages: Language[] = [
  {
    code: 'en-GB',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    flagColors: ['#012169', '#FFFFFF', '#C8102E'], // Blue, white, red
    voiceLang: 'en-GB',
    greeting: "Hello! I'm Ed, your school assistant.",
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    flagColors: ['#FFFFFF', '#DC143C'], // White, red
    voiceLang: 'pl-PL',
    greeting: 'Cześć! Jestem Ed, asystent szkolny.',
  },
  {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    flag: '🇷🇴',
    flagColors: ['#002B7F', '#FCD116', '#CE1126'], // Blue, yellow, red
    voiceLang: 'ro-RO',
    greeting: 'Bună! Sunt Ed, asistentul școlii.',
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇵🇰',
    flagColors: ['#01411C', '#FFFFFF'], // Green, white
    voiceLang: 'ur-PK',
    greeting: 'ہیلو! میں ایڈ ہوں، آپ کا اسکول اسسٹنٹ۔',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇧🇩',
    flagColors: ['#006A4E', '#F42A41'], // Green, red
    voiceLang: 'bn-BD',
    greeting: 'হ্যালো! আমি এড, আপনার স্কুল সহকারী।',
  },
  {
    code: 'so',
    name: 'Somali',
    nativeName: 'Soomaali',
    flag: '🇸🇴',
    flagColors: ['#4189DD', '#FFFFFF'], // Blue, white star
    voiceLang: 'so-SO',
    greeting: 'Salaan! Waxaan ahay Ed, kaaliyaha dugsiga.',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    flagColors: ['#AA151B', '#F1BF00', '#AA151B'], // Red, yellow, red
    voiceLang: 'es-ES',
    greeting: '¡Hola! Soy Ed, tu asistente escolar.',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    flagColors: ['#006600', '#FF0000'], // Green, red
    voiceLang: 'pt-PT',
    greeting: 'Olá! Sou o Ed, o assistente da escola.',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    flagColors: ['#002395', '#FFFFFF', '#ED2939'], // Blue, white, red
    voiceLang: 'fr-FR',
    greeting: "Bonjour! Je suis Ed, l'assistant scolaire.",
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    flagColors: ['#DE2910', '#FFDE00'], // Red, yellow
    voiceLang: 'zh-CN',
    greeting: '你好！我是Ed，您的学校助手。',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    flagColors: ['#006C35', '#FFFFFF'], // Green, white
    voiceLang: 'ar-SA',
    greeting: 'مرحبا! أنا إد، مساعد المدرسة.',
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    flag: '🇮🇳',
    flagColors: ['#FF9933', '#FFFFFF', '#138808'], // Saffron, white, green
    voiceLang: 'pa-IN',
    greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਐਡ ਹਾਂ, ਤੁਹਾਡਾ ਸਕੂਲ ਸਹਾਇਕ।',
  },
];

/**
 * Get language by code
 */
export function getLanguage(code: string): Language {
  return languages.find((l) => l.code === code) || languages[0];
}

/**
 * Get all available language codes
 */
export function getLanguageCodes(): string[] {
  return languages.map((l) => l.code);
}

/**
 * Check if language has voice support
 */
export function hasVoiceSupport(code: string): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  
  const lang = getLanguage(code);
  const voices = speechSynthesis.getVoices();
  return voices.some((v) => v.lang.startsWith(lang.voiceLang.split('-')[0]));
}

