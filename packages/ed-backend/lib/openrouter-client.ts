import type { Message, ModelConfig, ModelUsage } from '@schoolgle/shared';

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: Message;
    finishReason: string;
  }>;
  usage: ModelUsage;
  model: string;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }
    this.apiKey = apiKey;
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://schoolgle.co.uk',
          'X-Title': 'Schoolgle Ed AI'
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1000,
          top_p: request.topP ?? 1.0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;

      return {
        id: data.id,
        choices: data.choices.map((choice: any) => ({
          message: {
            role: choice.message.role,
            content: choice.message.content
          },
          finishReason: choice.finish_reason
        })),
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        model: data.model
      };
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chatCompletion({
        model: 'google/gemini-2.0-flash-lite:free',
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 10
      });
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}
