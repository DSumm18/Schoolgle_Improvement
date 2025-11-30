/**
 * Gemini 2.0 Flash - FREE TIER
 * 
 * Limits:
 * - 15 requests per minute
 * - 1,500 requests per day
 * - 1 million requests per month
 * 
 * Cost: £0 🎉
 */

import type { Persona, Language } from '../types';

export interface ChatContext {
  persona: Persona;
  language: Language;
  schoolId: string;
  pageContext?: string;
}

export class GeminiFreeClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  
  // Rate limiting
  private requestCount = 0;
  private dailyCount = 0;
  private lastResetTime = Date.now();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Check if we're within rate limits
   */
  private checkRateLimits(): boolean {
    const now = Date.now();
    
    // Reset daily counter (every 24 hours)
    if (now - this.lastResetTime > 24 * 60 * 60 * 1000) {
      this.dailyCount = 0;
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    // Reset per-minute counter (every minute)
    if (now - this.lastResetTime > 60 * 1000) {
      this.requestCount = 0;
    }
    
    // Check limits
    if (this.requestCount >= 15) {
      console.warn('[Gemini Free] Rate limit: 15/min reached');
      return false;
    }
    
    if (this.dailyCount >= 1500) {
      console.warn('[Gemini Free] Daily limit: 1500/day reached');
      return false;
    }
    
    return true;
  }

  /**
   * Send chat message to Gemini 2.0 Flash (FREE)
   */
  public async chat(userMessage: string, context: ChatContext): Promise<string> {
    // Check rate limits
    if (!this.checkRateLimits()) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    const systemPrompt = this.buildSystemPrompt(context);
    
    // Build contents array for Gemini
    const contents: any[] = [];
    
    // Add system instruction as first user message
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });
    
    // Add conversation history
    contents.push(...this.conversationHistory);
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 500,
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
            ],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Gemini Free] API Error:', error);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update rate limit counters
      this.requestCount++;
      this.dailyCount++;
      
      console.log('[Gemini Free] Usage:', {
        requestsThisMinute: this.requestCount,
        requestsToday: this.dailyCount,
        remainingToday: 1500 - this.dailyCount,
        cost: '£0 🎉',
      });

      const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Add to conversation history (keep last 10 exchanges)
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: assistantMessage }],
      });

      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return assistantMessage;
    } catch (error) {
      console.error('[Gemini Free] Error:', error);
      throw error;
    }
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(context: ChatContext): string {
    const { persona, language, schoolId, pageContext } = context;

    let prompt = `You are ${persona.name}, a helpful AI assistant for ${schoolId} school.

PERSONALITY:
${persona.greeting}

LANGUAGE:
- Respond in ${language.name} (${language.code})
- Use friendly, conversational tone
- Keep responses concise (2-3 sentences for simple questions)

CAPABILITIES:
- Help with admissions enquiries
- Guide parents through forms
- Explain school policies
- Provide term dates and events
- Answer questions about the school

IMPORTANT:
- Be warm and supportive
- If you don't know specific information, say so politely
- Never make up deadlines, fees, or policies
- Suggest contacting the school office for official matters
`;

    if (pageContext) {
      prompt += `\n\nCURRENT PAGE CONTEXT:\n${pageContext}\n\nUse this to provide relevant answers.`;
    }

    return prompt;
  }

  /**
   * Clear conversation history
   */
  public clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(): {
    requestsThisMinute: number;
    requestsToday: number;
    remainingToday: number;
    percentUsed: number;
  } {
    return {
      requestsThisMinute: this.requestCount,
      requestsToday: this.dailyCount,
      remainingToday: 1500 - this.dailyCount,
      percentUsed: (this.dailyCount / 1500) * 100,
    };
  }

  /**
   * Check if approaching limits
   */
  public isApproachingLimit(): boolean {
    return this.dailyCount > 1200; // 80% of daily limit
  }
}

