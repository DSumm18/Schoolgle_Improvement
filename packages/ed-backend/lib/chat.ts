import type { Message, EdContext } from '@schoolgle/shared';
import { OpenRouterClient } from './openrouter-client';
import { modelRouter } from './model-router';
import { buildSystemPrompt } from './prompt-builder';

export interface EdChatRequest {
  messages: Message[];
  context: EdContext;
}

export interface EdChatResponse {
  message: string;
  conversationId: string;
  model: string;
  usage: {
    tokens: number;
    cost: number;
  };
}

export class EdChatHandler {
  private openRouter: OpenRouterClient;

  constructor(apiKey: string) {
    this.openRouter = new OpenRouterClient(apiKey);
  }

  async handleChat(request: EdChatRequest): Promise<EdChatResponse> {
    try {
      // Route to optimal model
      const routing = modelRouter.route(request.messages, request.context);

      console.log(`[Ed] Routing decision:`, {
        taskType: routing.taskType,
        model: routing.selectedModel.model,
        reason: routing.reason
      });

      // Build system prompt with context
      const systemPrompt = buildSystemPrompt(request.context);

      // Prepare messages with system context
      const messagesWithSystem: Message[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...request.messages
      ];

      // Call OpenRouter
      const response = await this.openRouter.chatCompletion({
        model: routing.selectedModel.model,
        messages: messagesWithSystem,
        temperature: routing.selectedModel.temperature,
        maxTokens: routing.selectedModel.maxTokens,
        topP: routing.selectedModel.topP
      });

      const assistantMessage = response.choices[0]?.message?.content || '';

      return {
        message: assistantMessage,
        conversationId: request.context.conversationId || response.id,
        model: response.model,
        usage: {
          tokens: response.usage.totalTokens,
          cost: routing.estimatedCost
        }
      };

    } catch (error) {
      console.error('[Ed] Chat error:', error);
      throw new Error(`Ed chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
