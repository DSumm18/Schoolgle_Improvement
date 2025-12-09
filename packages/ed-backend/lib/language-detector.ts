/**
 * Language Detection for Ed AI
 * Detects user's language and provides appropriate country flags and prompts
 */

export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
  prompt: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    prompt: 'Continue in English?'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    flag: '🇪🇸',
    prompt: '¿Continuar en español?'
  },
  fr: {
    code: 'fr',
    name: 'French',
    flag: '🇫🇷',
    prompt: 'Continuer en français?'
  },
  de: {
    code: 'de',
    name: 'German',
    flag: '🇩🇪',
    prompt: 'Auf Deutsch fortfahren?'
  },
  it: {
    code: 'it',
    name: 'Italian',
    flag: '🇮🇹',
    prompt: 'Continuare in italiano?'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    flag: '🇵🇹',
    prompt: 'Continuar em português?'
  },
  pl: {
    code: 'pl',
    name: 'Polish',
    flag: '🇵🇱',
    prompt: 'Kontynuować po polsku?'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    flag: '🇸🇦',
    prompt: 'هل تريد الاستمرار بالعربية؟'
  },
  ur: {
    code: 'ur',
    name: 'Urdu',
    flag: '🇵🇰',
    prompt: 'اردو میں جاری رکھیں؟'
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    flag: '🇨🇳',
    prompt: '继续使用中文？'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    flag: '🇮🇳',
    prompt: 'हिंदी में जारी रखें?'
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    flag: '🇧🇩',
    prompt: 'বাংলায় চালিয়ে যান?'
  },
  ro: {
    code: 'ro',
    name: 'Romanian',
    flag: '🇷🇴',
    prompt: 'Continuați în română?'
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    flag: '🇹🇷',
    prompt: 'Türkçe devam et?'
  }
};

/**
 * Simple language detection based on common words and patterns
 */
export function detectLanguage(text: string): LanguageInfo {
  const lowerText = text.toLowerCase();

  // Spanish detection
  if (lowerText.match(/\b(hola|qué|está|muy|para|con|como|español)\b/)) {
    return SUPPORTED_LANGUAGES.es;
  }

  // French detection
  if (lowerText.match(/\b(bonjour|merci|très|avec|français|comment|pour)\b/)) {
    return SUPPORTED_LANGUAGES.fr;
  }

  // German detection
  if (lowerText.match(/\b(hallo|wie|ist|sehr|deutsch|mit|für)\b/)) {
    return SUPPORTED_LANGUAGES.de;
  }

  // Italian detection
  if (lowerText.match(/\b(ciao|come|molto|italiano|per|con)\b/)) {
    return SUPPORTED_LANGUAGES.it;
  }

  // Portuguese detection
  if (lowerText.match(/\b(olá|muito|português|como|para|com)\b/)) {
    return SUPPORTED_LANGUAGES.pt;
  }

  // Polish detection
  if (lowerText.match(/\b(cześć|jak|bardzo|polski|dla|z)\b/)) {
    return SUPPORTED_LANGUAGES.pl;
  }

  // Arabic detection (Arabic script)
  if (text.match(/[\u0600-\u06FF]/)) {
    return SUPPORTED_LANGUAGES.ar;
  }

  // Urdu detection (Arabic script with Urdu specifics)
  if (text.match(/[\u0600-\u06FF]/) && lowerText.includes('اردو')) {
    return SUPPORTED_LANGUAGES.ur;
  }

  // Chinese detection (Chinese characters)
  if (text.match(/[\u4E00-\u9FFF]/)) {
    return SUPPORTED_LANGUAGES.zh;
  }

  // Hindi detection (Devanagari script)
  if (text.match(/[\u0900-\u097F]/)) {
    return SUPPORTED_LANGUAGES.hi;
  }

  // Bengali detection (Bengali script)
  if (text.match(/[\u0980-\u09FF]/)) {
    return SUPPORTED_LANGUAGES.bn;
  }

  // Romanian detection
  if (lowerText.match(/\b(bună|cum|foarte|română|pentru|cu)\b/)) {
    return SUPPORTED_LANGUAGES.ro;
  }

  // Turkish detection
  if (lowerText.match(/\b(merhaba|nasıl|çok|türkçe|için|ile)\b/)) {
    return SUPPORTED_LANGUAGES.tr;
  }

  // Default to English
  return SUPPORTED_LANGUAGES.en;
}

/**
 * Generate bilingual system prompt for multi-language support
 */
export function buildBilingualSystemPrompt(detectedLanguage: LanguageInfo, basePrompt: string): string {
  if (detectedLanguage.code === 'en') {
    return basePrompt;
  }

  return `${basePrompt}

LANGUAGE DETECTION: The user appears to be speaking ${detectedLanguage.name}. Please:
1. Respond FIRST in ${detectedLanguage.name}
2. Then provide the SAME response in English below it
3. Format as:

[${detectedLanguage.flag} ${detectedLanguage.name}]
[Your response in ${detectedLanguage.name}]

[🇬🇧 English]
[Same response in English]

This ensures accessibility for both the user and any English-speaking staff who may review the conversation.`;
}
