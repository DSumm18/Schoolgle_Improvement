/**
 * Gemini AI Client
 * Handles communication with Google's Gemini API
 */

import type { Persona, Language } from '../types';

interface ChatContext {
  persona: Persona;
  language: Language;
  schoolId: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export class GeminiClient {
  private apiKey: string;
  private model: string;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  // Models to try in order (most reliable first)
  // Based on available models from API
  private readonly modelsToTry = [
    'gemini-2.5-flash',     // Fast and reliable - RECOMMENDED
    'gemini-pro-latest',    // Latest stable version of gemini-pro
    'gemini-2.0-flash',     // Alternative flash model
    'gemini-flash-latest',  // Latest flash
  ];

  constructor(apiKey: string, model?: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Gemini API key is required. Set VITE_GEMINI_API_KEY in .env.local');
    }
    this.apiKey = apiKey;
    // Default to gemini-2.5-flash (fast, reliable, widely available)
    this.model = model || 'gemini-2.5-flash';
    
    // Log API key info (masked for security)
    const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
    console.log(`[Gemini] Initialized with API key: ${maskedKey}, model: ${this.model}`);
  }

  private getBaseUrl(model: string): string {
    // All current models use v1beta API
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  }

  private getBaseUrlV1(model: string): string {
    // Fallback to v1 API
    return `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
  }

  /**
   * Check what models are available with this API key
   */
  public async listAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[Gemini] Failed to list models:', error);
        return [];
      }
      
      const data = await response.json();
      const models = data.models?.map((m: any) => m.name?.replace('models/', '') || '') || [];
      console.log('[Gemini] Available models:', models);
      return models;
    } catch (error) {
      console.error('[Gemini] Error listing models:', error);
      return [];
    }
  }

  /**
   * Send a chat message and get a response
   */
  public async chat(message: string, context: ChatContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);

    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: message });

    // Try current model first, then fallback models
    const modelsToTry = [this.model, ...this.modelsToTry.filter(m => m !== this.model)];
    
    for (const model of modelsToTry) {
      try {
        // All models use v1beta API now
        let response = await this.tryRequest(model, systemPrompt, true);
        
        // If v1beta fails with 404, try v1 API
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 404 || errorData.error?.message?.includes('not found')) {
            console.log(`[Gemini] Model ${model} not found in v1beta, trying v1 API...`);
            response = await this.tryRequest(model, systemPrompt, false);
          }
        }

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

          if (!text) {
            console.warn(`[Gemini] Empty response from ${model}:`, data);
            continue; // Try next model
          }

          // Update current model if we used a different one
          if (model !== this.model) {
            console.log(`[Gemini] ✅ Using model: ${model}`);
            this.model = model;
          }

          // Add assistant response to history
          this.conversationHistory.push({ role: 'assistant', content: text });

          return text;
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
          console.error(`[Gemini] Model ${model} failed:`, {
            model,
            status: response.status,
            error: errorMessage,
            url: baseUrl.split('?')[0], // Log URL without key
          });
          
          // If it's an authentication/authorization error, stop trying
          if (response.status === 401 || response.status === 403) {
            throw new Error(`API key authentication failed (${response.status}). Check your API key is valid.`);
          }
          
          continue; // Try next model
        }
      } catch (error) {
        console.warn(`[Gemini] Error with model ${model}:`, error);
        continue; // Try next model
      }
    }

    // All models failed - provide diagnostic info
    const errorDetails = [
      'All Gemini models failed.',
      '',
      'Possible issues:',
      '1. API key may be invalid or expired',
      '2. API key may not have Gemini API enabled in Google Cloud Console',
      '3. Project may not have billing enabled',
      '4. Models may not be available in your region',
      '',
      'To diagnose:',
      '- Check your API key is valid at https://ai.google.dev/',
      '- Ensure Gemini API is enabled in Google Cloud Console',
      '- Check that billing is enabled for your project',
      '- Try calling listAvailableModels() to see what models you have access to',
    ].join('\n');
    
    console.error('[Gemini]', errorDetails);
    throw new Error(errorDetails);
  }

  private async tryRequest(model: string, systemPrompt: string, useV1Beta: boolean): Promise<Response> {
    const baseUrl = useV1Beta ? this.getBaseUrl(model) : this.getBaseUrlV1(model);
    
    console.log(`[Gemini] Attempting ${model} via ${useV1Beta ? 'v1beta' : 'v1'} API...`);
    
    return await fetch(`${baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              ...this.conversationHistory.map((msg) => ({
                text: `${msg.role}: ${msg.content}`,
              })),
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });
  }

  private buildSystemPrompt(context: ChatContext): string {
    const { persona, language, schoolId } = context;

    return `You are ${persona.name}, a friendly AI assistant for ${schoolId} school. 
Your personality: ${persona.greeting}
Current language: ${language.name} (${language.code})

IMPORTANT GUIDELINES:
- Be helpful, friendly, and professional
- Keep responses concise (2-3 sentences for simple questions)
- If asked about admissions, forms, or school procedures, offer to help
- Always be supportive of parents, especially those for whom English isn't their first language
- If you don't know specific school information, politely say so and suggest contacting the school office
- Respond in ${language.name} when the user speaks in ${language.name}

When helping with forms:
- Offer to guide through each field
- Explain what information is needed
- Be patient and encouraging

You can help with:
- Admissions enquiries
- Form filling assistance
- General school information
- Explaining school procedures
- Translating between languages`;
  }

  /**
   * Clear conversation history
   */
  public clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  public getHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }
}

