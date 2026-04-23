/**
 * Translator - Multi-language handling
 */

import { getLanguage } from '../utils/flags';

interface TranslationCache {
  [key: string]: string;
}

export class Translator {
  private cache: TranslationCache = {};
  private currentLanguage = 'en-GB';

  /**
   * Set the target language
   */
  public setLanguage(code: string): void {
    this.currentLanguage = code;
  }

  /**
   * Get current language
   */
  public getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Translate text (using browser translation API or fallback)
   */
  public async translate(
    text: string,
    _from: string,
    to: string
  ): Promise<string> {
    // Check cache
    const cacheKey = `${text}:${_from}:${to}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    // For now, return original text
    // In production, this would call a translation API
    console.log(`[Translator] Would translate "${text}" from ${_from} to ${to}`);

    // Cache result
    this.cache[cacheKey] = text;
    return text;
  }

  /**
   * Detect language of text
   */
  public detectLanguage(_text: string): string {
    // Simple detection based on character sets
    // In production, use a proper language detection API

    // Check for Arabic
    if (/[\u0600-\u06FF]/.test(_text)) return 'ar';

    // Check for Chinese
    if (/[\u4E00-\u9FFF]/.test(_text)) return 'zh';

    // Check for Bengali
    if (/[\u0980-\u09FF]/.test(_text)) return 'bn';

    // Check for Punjabi (Gurmukhi)
    if (/[\u0A00-\u0A7F]/.test(_text)) return 'pa';

    // Check for Urdu (similar to Arabic but with specific chars)
    if (/[\u0600-\u06FF]/.test(_text)) return 'ur';

    // Default to English
    return 'en-GB';
  }

  /**
   * Get common UI strings in current language
   */
  public getUIStrings(): Record<string, string> {
    const lang = getLanguage(this.currentLanguage);
    
    // Base English strings
    const strings: Record<string, string> = {
      greeting: lang.greeting,
      speak: 'Tap to speak',
      type: 'Type a message...',
      send: 'Send',
      close: 'Close',
      language: 'Language',
      settings: 'Settings',
      magicTools: 'Magic Tools',
      formHelp: 'I can help fill out this form',
      yes: 'Yes',
      no: 'No',
      next: 'Next',
      back: 'Back',
      confirm: 'Confirm',
      cancel: 'Cancel',
      error: 'Something went wrong',
      retry: 'Try again',
      voiceNotAvailable: 'Voice not available for this language',
    };

    return strings;
  }

  /**
   * Clear translation cache
   */
  public clearCache(): void {
    this.cache = {};
  }
}

// Singleton instance
export const translator = new Translator();

