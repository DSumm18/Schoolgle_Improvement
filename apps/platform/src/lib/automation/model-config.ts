/**
 * Model Configuration for Automation
 * 
 * Centralized configuration for LLM models used in automation
 * Using Google's Gemini API directly
 */

export const AUTOMATION_MODELS = {
  /**
   * Gemini 3 Flash - Fast, cost-effective vision model for screen analysis
   * Using Google's Gemini API directly
   */
  VISION: 'gemini-3-flash',
  
  /**
   * Gemini 3 Flash - Fast, cost-effective model for action planning
   * Using Google's Gemini API directly
   */
  PLANNING: 'gemini-3-flash',
} as const;

export const MODEL_SETTINGS = {
  /**
   * Temperature for deterministic outputs (lower = more consistent)
   */
  TEMPERATURE: 0.1,
  
  /**
   * Maximum tokens for responses
   */
  MAX_TOKENS: 2000,
} as const;

