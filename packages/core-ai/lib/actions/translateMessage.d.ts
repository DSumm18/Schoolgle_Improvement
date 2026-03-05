export interface TranslationDetails {
    text: string;
    targetLanguage: string;
    sourceLanguage?: string;
}
/**
 * Translates text from one language to another.
 * This is a placeholder implementation that would integrate with a translation service.
 */
export declare function translateMessage(details: TranslationDetails): Promise<{
    success: boolean;
    message: string;
}>;
