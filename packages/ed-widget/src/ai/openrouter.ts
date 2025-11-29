/**
 * OpenRouter AI Client
 * Unified API for multiple AI models with best pricing
 */

import type { Persona, Language } from '../types';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatContext {
  persona: Persona;
  language: Language;
  schoolId: string;
  pageContext?: string;
}

// Available models on OpenRouter
export const MODELS = {
  // Recommended: Best balance of speed, quality, cost
  CLAUDE_HAIKU: 'anthropic/claude-3.5-haiku',
  
  // Budget: Cheapest, good quality
  DEEPSEEK_V3: 'deepseek/deepseek-chat',
  
  // Premium: Best general knowledge
  GPT4O_MINI: 'openai/gpt-4o-mini',
  
  // Alternative: Good European option
  MISTRAL_MEDIUM: 'mistralai/mistral-medium',
  
  // Fallback: If others fail
  GPT35_TURBO: 'openai/gpt-3.5-turbo',
} as const;

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model: string;
  private conversationHistory: OpenRouterMessage[] = [];

  constructor(apiKey: string, model: string = MODELS.CLAUDE_HAIKU) {
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Send a chat message and get AI response
   */
  public async chat(userMessage: string, context: ChatContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);

    // Build messages array
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...this.conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://schoolgle.co.uk',
          'X-Title': 'Ed Widget - School Assistant',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[OpenRouter] API Error:', error);
        throw new Error(`API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '';

      // Log usage for monitoring
      if (data.usage) {
        console.log('[OpenRouter] Tokens:', {
          prompt: data.usage.prompt_tokens,
          completion: data.usage.completion_tokens,
          total: data.usage.total_tokens,
        });
      }

      // Add to conversation history (keep last 10 messages)
      this.conversationHistory.push({ role: 'user', content: userMessage });
      this.conversationHistory.push({ role: 'assistant', content: assistantMessage });
      
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return assistantMessage;
    } catch (error) {
      console.error('[OpenRouter] Error:', error);
      throw error;
    }
  }

  /**
   * Build system prompt with context
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
- Help with admissions enquiries and application processes
- Guide parents through form filling step-by-step
- Explain school policies and procedures
- Provide information about term dates and events
- Answer questions about the school

IMPORTANT RULES:
- Be warm and supportive, especially with parents new to UK schools
- If you don't know specific school information, say so politely
- Never make up information about deadlines, fees, or policies
- Suggest contacting the school office for official matters
- Use emojis sparingly (only when adding genuine value)
`;

    // Add page context if available
    if (pageContext) {
      prompt += `\n\nCURRENT PAGE CONTEXT:
${pageContext}

Use this context to provide relevant, specific answers about what the user is viewing.`;
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
   * Change model on the fly
   */
  public setModel(model: string): void {
    this.model = model;
  }

  /**
   * Get current model
   */
  public getModel(): string {
    return this.model;
  }

  /**
   * Get conversation history
   */
  public getHistory(): OpenRouterMessage[] {
    return [...this.conversationHistory];
  }
}

