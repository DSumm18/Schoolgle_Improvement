/**
 * Translation Service - Handle bidirectional translation between native language and English
 *
 * This service provides:
 * - Language detection from user messages
 * - Bidirectional translation (native ↔ English)
 * - Translation caching for performance
 * - Context-aware translation with form-specific glossaries
 * - Quality validation
 *
 * NOTE: This is a mock implementation. For production, integrate with:
 * - OpenAI GPT-4o (via OpenRouter): Better for form contexts
 * - Google Translate API: Faster, cheaper
 * - DeepL API: Best quality for European languages
 */

import { createClient } from "@supabase/supabase-js";

// ============================================================================
// TYPES
// ============================================================================

export type LanguageCode =
  | "en"
  | "pl"
  | "ur"
  | "bn"
  | "pa"
  | "gu"
  | "so"
  | "ro"
  | "pt"
  | "zh"
  | "ar"
  | "fr"
  | "es";

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
}

export interface TranslationResult {
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  confidence: number;
  cached: boolean;
}

export interface TranslatedField {
  field: string;
  label: string;
  placeholder?: string;
  translatedLabel: string;
  translatedPlaceholder?: string;
}

export interface FormField {
  ref: string;
  name: string;
  role: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

export interface TranslationQuality {
  score: number; // 0-1
  issues: string[];
  needsReview: boolean;
}

// ============================================================================
// SUPPORTED LANGUAGES
// ============================================================================

export const SUPPORTED_LANGUAGES: Record<LanguageCode, Language> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr",
  },
  pl: {
    code: "pl",
    name: "Polish",
    nativeName: "Polski",
    direction: "ltr",
  },
  ur: {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    direction: "rtl",
  },
  bn: {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    direction: "ltr",
  },
  pa: {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    direction: "ltr",
  },
  gu: {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    direction: "ltr",
  },
  so: {
    code: "so",
    name: "Somali",
    nativeName: "Soomaali",
    direction: "ltr",
  },
  ro: {
    code: "ro",
    name: "Romanian",
    nativeName: "Română",
    direction: "ltr",
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    direction: "ltr",
  },
  zh: {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    direction: "ltr",
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    direction: "ltr",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    direction: "ltr",
  },
};

// ============================================================================
// FORM-SPECIFIC GLOSSARIES
// ============================================================================

const FORM_GLOSSARIES: Record<
  string,
  Record<string, Record<string, string>>
> = {
  pupil_premium: {
    en: {
      income: "income",
      benefits: "benefits",
      free_school_meals: "free school meals",
      pupil_premium: "pupil premium",
      household_income: "household income",
      employment_status: "employment status",
    },
    pl: {
      income: "dochód",
      benefits: "zasiłki",
      free_school_meals: "darmowe posiłki",
      pupil_premium: "premia dla ucznia",
      household_income: "dochód gospodarstwa domowego",
      employment_status: "status zatrudnienia",
    },
    ur: {
      income: "آمدنی",
      benefits: "فوائد",
      free_school_meals: "مفت اسکول کے کھانے",
      pupil_premium: "طالب علم پریمیم",
      household_income: "گھریلی آمدنی",
      employment_status: "ملازمت کی حیثیت",
    },
    bn: {
      income: "আয",
      benefits: "সুবিধা",
      free_school_meals: "বিনামূল্যে স্কুলের খাবার",
      pupil_premium: "ছাত্র প্রিমিয়াম",
      household_income: "পরিবারের আয়",
      employment_status: "কর্মসংস্থান অবস্থা",
    },
  },
  riddor: {
    en: {
      injury: "injury",
      witness: "witness",
      first_aid: "first aid",
      incident_report: "incident report",
      dangerous_occurrence: "dangerous occurrence",
      work_related: "work related",
    },
    pl: {
      injury: "uraz",
      witness: "świadek",
      first_aid: "pierwsza pomoc",
      incident_report: "zgłoszenie incydentu",
      dangerous_occurrence: "niebezpieczne zdarzenie",
      work_related: "związane z pracą",
    },
    ur: {
      injury: "چوٹ",
      witness: "گواہ",
      first_aid: "پہلی امداد",
      incident_report: "حادثے کی رپورٹ",
      dangerous_occurrence: "خطرناک واقعہ",
      work_related: "کام سے متعلق",
    },
  },
};

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

const LANGUAGE_PATTERNS: Array<{
  languages: LanguageCode[];
  patterns: RegExp[];
  sampleWords: string[];
}> = [
  {
    languages: ["pl"],
    patterns: [/[ąćęłńóśźż]/i, /\b(a|w|z|ze|do|na|od|przez|pod|za|o|do)\b/i],
    sampleWords: ["jest", "nie", "się", "z", "w", "to", "na"],
  },
  {
    languages: ["ur"],
    patterns: [
      /[\u0600-\u06FF]/, // Arabic script range (includes Urdu)
    ],
    sampleWords: ["ہے", "کے", "میں", "کی", "کا", "ہوں"],
  },
  {
    languages: ["ar"],
    patterns: [/[\u0600-\u06FF]/, /\b(في|من|على|إلى|عن|مع|هذا|هذه|ذلك)\b/i],
    sampleWords: ["في", "هذا", "هذه", "ذلك", "ال"],
  },
  {
    languages: ["bn"],
    patterns: [
      /[\u0980-\u09FF]/, // Bengali script
    ],
    sampleWords: ["হয়", "এবং", "যে", "এই", "সঙ্গে", "আমি"],
  },
  {
    languages: ["pa"],
    patterns: [
      /[\u0A00-\u0A7F]/, // Gurmukhi script
    ],
    sampleWords: ["ਹੈ", "ਅਤੇ", "ਜੋ", "ਇਹ", "ਨਾਲ", "ਮੈਂ"],
  },
  {
    languages: ["gu"],
    patterns: [
      /[\u0A80-\u0AFF]/, // Gujarati script
    ],
    sampleWords: ["છે", "અને", "કે", "આ", "સાથે", "હું"],
  },
  {
    languages: ["so"],
    patterns: [/\b(ayaa|waa|ayu|waxa|ku|la|u|ka)\b/i],
    sampleWords: ["ayaa", "waa", "ayu", "waxa", "ku", "la"],
  },
  {
    languages: ["ro"],
    patterns: [/[ăâîșț]/i, /\b(sunt|este|am|un|o|cu|de|la|pentru|care)\b/i],
    sampleWords: ["sunt", "este", "am", "un", "o", "cu", "de"],
  },
  {
    languages: ["pt"],
    patterns: [/\b(o|a|os|as|um|uma|de|em|para|por|com|não|sim)\b/i],
    sampleWords: ["o", "a", "é", "de", "em", "para", "com"],
  },
  {
    languages: ["zh"],
    patterns: [
      /[\u4E00-\u9FFF]/, // Chinese characters
    ],
    sampleWords: ["的", "是", "我", "有", "和", "在"],
  },
  {
    languages: ["fr"],
    patterns: [/\b(le|la|les|un|une|de|à|pour|dans|avec|sur|et)\b/i],
    sampleWords: ["le", "la", "les", "de", "un", "une", "et"],
  },
  {
    languages: ["es"],
    patterns: [/\b(el|la|los|las|un|una|de|en|para|por|con|sobre|y)\b/i],
    sampleWords: ["el", "la", "de", "en", "por", "para", "con"],
  },
];

// ============================================================================
// TRANSLATION SERVICE CLASS
// ============================================================================

class TranslationService {
  private supabase: ReturnType<typeof createClient>;
  private openrouterApiKey: string | undefined;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY;
  }

  // ==========================================================================
  // LANGUAGE DETECTION
  // ==========================================================================

  /**
   * Detect language from text
   * Uses pattern matching for common scripts and words
   */
  async detectLanguage(text: string): Promise<LanguageCode> {
    if (!text || text.trim().length === 0) {
      return "en";
    }

    // Check each language pattern
    for (const { languages, patterns, sampleWords } of LANGUAGE_PATTERNS) {
      // Check for script patterns
      const hasScript = patterns.some((pattern) => pattern.test(text));

      // Check for common words
      const words = text.toLowerCase().split(/\s+/);
      const hasWords = sampleWords.some((word) => words.includes(word));

      if (hasScript || hasWords) {
        return languages[0] as LanguageCode;
      }
    }

    // Default to English
    return "en";
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): Language[] {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  /**
   * Get language info by code
   */
  getLanguage(code: LanguageCode): Language | undefined {
    return SUPPORTED_LANGUAGES[code];
  }

  // ==========================================================================
  // TRANSLATION
  // ==========================================================================

  /**
   * Translate text to target language
   * Uses cache first, then falls back to API
   */
  async translate(
    text: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode,
    context?: string,
  ): Promise<TranslationResult> {
    // No translation needed if same language
    if (sourceLanguage === targetLanguage) {
      return {
        text,
        sourceLanguage,
        targetLanguage,
        confidence: 1,
        cached: false,
      };
    }

    // Check cache first
    const cached = await this.checkCache(text, sourceLanguage, targetLanguage);
    if (cached) {
      // Update access count
      await this.updateCacheAccess(cached.id);
      return {
        text: cached.translated_text,
        sourceLanguage,
        targetLanguage,
        confidence: cached.quality_score || 0.9,
        cached: true,
      };
    }

    // Perform translation
    const translatedText = await this.performTranslation(
      text,
      sourceLanguage,
      targetLanguage,
      context,
    );

    // Store in cache
    await this.storeCache(text, sourceLanguage, targetLanguage, translatedText);

    return {
      text: translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: 0.85,
      cached: false,
    };
  }

  /**
   * Translate to English (for form submission)
   */
  async translateToEnglish(
    text: string,
    sourceLang: LanguageCode,
    context?: string,
  ): Promise<string> {
    const result = await this.translate(text, sourceLang, "en", context);
    return result.text;
  }

  /**
   * Translate from English (for display)
   */
  async translateFromEnglish(
    text: string,
    targetLang: LanguageCode,
    context?: string,
  ): Promise<string> {
    const result = await this.translate(text, "en", targetLang, context);
    return result.text;
  }

  /**
   * Translate form field labels
   */
  async translateFieldLabels(
    fields: FormField[],
    targetLanguage: LanguageCode,
    formType?: string,
  ): Promise<TranslatedField[]> {
    const results: TranslatedField[] = [];

    for (const field of fields) {
      // Check glossary first
      const glossary = this.getGlossaryTranslation(
        field.name,
        "en",
        targetLanguage,
        formType,
      );

      const translatedLabel =
        glossary ||
        (await this.translateFromEnglish(field.name, targetLanguage, formType));

      const translatedField: TranslatedField = {
        field: field.ref,
        label: field.name,
        translatedLabel,
      };

      if (field.placeholder) {
        translatedField.placeholder = field.placeholder;
        translatedField.translatedPlaceholder = glossary
          ? undefined // Don't translate placeholders from glossary
          : await this.translateFromEnglish(field.placeholder, targetLanguage);
      }

      results.push(translatedField);
    }

    return results;
  }

  // ==========================================================================
  // QUALITY VALIDATION
  // ==========================================================================

  /**
   * Validate translation quality
   */
  async validateTranslation(
    original: string,
    translated: string,
  ): Promise<TranslationQuality> {
    const issues: string[] = [];
    let score = 1;

    // Check length ratio (should be similar)
    const ratio = translated.length / original.length;
    if (ratio < 0.3 || ratio > 3) {
      issues.push("Significant length difference");
      score -= 0.2;
    }

    // Check for untranslated content
    if (original === translated) {
      issues.push("No translation performed");
      score -= 0.5;
    }

    // Check for placeholder preservation
    const placeholders = original.match(/\{[^}]+\}/g);
    if (placeholders) {
      const translatedPlaceholders = translated.match(/\{[^}]+\}/g);
      if (
        !translatedPlaceholders ||
        translatedPlaceholders.length !== placeholders.length
      ) {
        issues.push("Placeholders not preserved");
        score -= 0.3;
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      needsReview: score < 0.7,
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Perform actual translation (mock implementation)
   * TODO: Integrate with OpenRouter/OpenAI
   */
  private async performTranslation(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode,
    context?: string,
  ): Promise<string> {
    // Check glossary first
    const glossaryTranslation = this.getGlossaryTranslation(
      text,
      sourceLang,
      targetLang,
      context,
    );
    if (glossaryTranslation) {
      return glossaryTranslation;
    }

    // TODO: Replace with actual API call
    // if (this.openrouterApiKey) {
    //   return await this.translateViaOpenRouter(text, sourceLang, targetLang, context);
    // }

    // Mock translation for testing
    return this.mockTranslate(text, targetLang);
  }

  /**
   * Mock translation for testing
   */
  private mockTranslate(text: string, targetLang: LanguageCode): string {
    // In production, this would call an actual translation API
    // For now, return a placeholder
    const lang = SUPPORTED_LANGUAGES[targetLang];
    if (lang) {
      return `[${lang.nativeName}] ${text}`;
    }
    return text;
  }

  /**
   * Get translation from glossary
   */
  private getGlossaryTranslation(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode,
    formType?: string,
  ): string | null {
    if (!formType) return null;

    const key = text.toLowerCase().replace(/\s+/g, "_");

    // Get source language glossary
    const sourceGlossary = FORM_GLOSSARIES[formType]?.[sourceLang];
    if (!sourceGlossary) return null;

    // Get target language glossary
    const targetGlossary = FORM_GLOSSARIES[formType]?.[targetLang];
    if (!targetGlossary) return null;

    // Find the key in source and get target value
    const sourceKey = Object.keys(sourceGlossary).find((k) => k === key);
    if (sourceKey) {
      return targetGlossary[sourceKey] || null;
    }

    return null;
  }

  /**
   * Check cache for existing translation
   */
  private async checkCache(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode,
  ): Promise<any | null> {
    const hash = this.generateCacheHash(text, sourceLang, targetLang);

    const { data, error } = await this.supabase
      .from("translation_cache")
      .select("*")
      .eq("hash", hash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    return data || null;
  }

  /**
   * Store translation in cache
   */
  private async storeCache(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode,
    translatedText: string,
  ): Promise<void> {
    const hash = this.generateCacheHash(text, sourceLang, targetLang);

    await (this.supabase.from("translation_cache") as any).insert({
      source_text: text,
      source_language: sourceLang,
      target_language: targetLang,
      translated_text: translatedText,
      quality_score: 0.85,
      hash,
    });
  }

  /**
   * Update cache access count
   */
  private async updateCacheAccess(id: string): Promise<void> {
    await (this.supabase.rpc as any)("increment", {
      table_name: "translation_cache",
      row_id: id,
      column_name: "access_count",
    });
  }

  /**
   * Generate cache hash
   */
  private generateCacheHash(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode,
  ): string {
    const crypto = require("crypto");
    const content = `${sourceLang}|${targetLang}|${text}`;
    return crypto.createHash("md5").update(content).digest("hex");
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let translationServiceInstance: TranslationService | null = null;

export function getTranslationService(): TranslationService {
  if (!translationServiceInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    translationServiceInstance = new TranslationService(
      supabaseUrl,
      supabaseKey,
    );
  }

  return translationServiceInstance;
}

export default TranslationService;
