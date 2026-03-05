// /lib/ai/providers/gemini.ts

import { GoogleGenAI } from "@google/genai";
import type { AIProvider, AIResponse, ChatContext, UsageStats, AudioBlob } from '../types';
import { logger } from '../utils/logger';

export class GeminiProvider implements AIProvider {
  public readonly providerName = 'gemini';
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set for GeminiProvider.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async chat(prompt: string, context?: ChatContext): Promise<AIResponse> {
    const model = 'gemini-2.5-pro'; // Upgraded model for better reasoning
    const startTime = Date.now();
    
    logger.aiRequest(this.providerName, model, prompt, context);
    
    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
        ...(context?.systemInstruction && { config: { systemInstruction: context.systemInstruction } }),
      });
      const latency = Date.now() - startTime;
      
      // Gemini API v1 does not provide token counts in the standard response.
      const usage: UsageStats = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      const result = {
        success: true,
        text: response.text || 'No response generated',
        provider: this.providerName,
        model: model,
        latency: latency,
        usage: usage
      };

      logger.aiResponse(this.providerName, model, latency, usage);
      return result;
    } catch (error: any) {
      logger.error('Gemini chat request failed', { error: error.message, model }, this.providerName);
      return this.createErrorResponse(error, startTime);
    }
  }
  
  async transcribe(audioBlob: AudioBlob): Promise<AIResponse> {
      const model = 'gemini-2.5-pro'; // Upgraded model
      const startTime = Date.now();
      try {
          const base64Audio = audioBlob.data;
          const audioPart = {
              inlineData: {
                  mimeType: audioBlob.mimeType,
                  data: base64Audio,
              },
          };
          const textPart = {
              text: "Transcribe this audio message from a parent reporting their child's absence from school. Capture the child's name, class, and the reason for absence clearly.",
          };

          const response = await this.ai.models.generateContent({
              model,
              contents: { parts: [audioPart, textPart] },
          });
          const latency = Date.now() - startTime;

          return {
              success: true,
              text: response.text || 'No transcription available',
              provider: this.providerName,
              model,
              latency,
              usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
          };
      } catch (error: any) {
          return this.createErrorResponse(error, startTime);
      }
  }

  private createErrorResponse(error: any, startTime: number): AIResponse {
    const latency = Date.now() - startTime;
    return {
      success: false,
      text: '',
      provider: this.providerName,
      latency: latency,
      error: error.message || `An unknown error occurred with the ${this.providerName} API.`,
      usage: null,
      raw: error,
    };
  }

  /**
   * Performs a health check on the Gemini provider
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple test request to verify the API is working
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: 'Hello',
      });
      return response.text !== undefined;
    } catch (error) {
      logger.warn('Gemini health check failed', { error: (error as Error).message }, this.providerName);
      return false;
    }
  }
}
