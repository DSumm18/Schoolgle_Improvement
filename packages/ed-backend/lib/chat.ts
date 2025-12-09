import type { Message, EdContext } from '@schoolgle/shared';
import { OpenRouterClient } from './openrouter-client';
import { modelRouter } from './model-router';
import { buildSystemPrompt } from './prompt-builder';
import { detectLanguage, buildBilingualSystemPrompt, type LanguageInfo } from './language-detector';

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
  detectedLanguage?: LanguageInfo;
}

export class EdChatHandler {
  private openRouter: OpenRouterClient;

  constructor(apiKey: string) {
    this.openRouter = new OpenRouterClient(apiKey);
  }

  async *handleChatStream(request: EdChatRequest): AsyncGenerator<string> {
    try {
      // Detect language from the latest user message
      const lastUserMessage = request.messages.filter(m => m.role === 'user').pop();
      const detectedLanguage = lastUserMessage ? detectLanguage(lastUserMessage.content) : undefined;

      // Route to optimal model
      const routing = modelRouter.route(request.messages, request.context);

      console.log(`[Ed] Streaming - Routing decision:`, {
        taskType: routing.taskType,
        model: routing.selectedModel.model,
        reason: routing.reason,
        detectedLanguage: detectedLanguage?.name
      });

      // Build system prompt with context and language support
      let systemPrompt = buildSystemPrompt(request.context);
      if (detectedLanguage && detectedLanguage.code !== 'en') {
        systemPrompt = buildBilingualSystemPrompt(detectedLanguage, systemPrompt);
      }

      // Prepare messages with system context
      const messagesWithSystem: Message[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...request.messages
      ];

      // Stream from OpenRouter
      for await (const chunk of this.openRouter.chatCompletionStream({
        model: routing.selectedModel.model,
        messages: messagesWithSystem,
        temperature: routing.selectedModel.temperature,
        maxTokens: routing.selectedModel.maxTokens,
        topP: routing.selectedModel.topP
      })) {
        yield chunk;
      }

    } catch (error) {
      console.error('[Ed] Streaming error:', error);
      throw new Error(`Ed streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleChat(request: EdChatRequest): Promise<EdChatResponse> {
    try {
      // Detect language from the latest user message
      const lastUserMessage = request.messages.filter(m => m.role === 'user').pop();
      const detectedLanguage = lastUserMessage ? detectLanguage(lastUserMessage.content) : undefined;

      // Route to optimal model
      const routing = modelRouter.route(request.messages, request.context);

      console.log(`[Ed] Routing decision:`, {
        taskType: routing.taskType,
        model: routing.selectedModel.model,
        reason: routing.reason,
        detectedLanguage: detectedLanguage?.name
      });

      // Build system prompt with context and language support
      let systemPrompt = buildSystemPrompt(request.context);
      if (detectedLanguage && detectedLanguage.code !== 'en') {
        systemPrompt = buildBilingualSystemPrompt(detectedLanguage, systemPrompt);
      }

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
        },
        detectedLanguage
      };

    } catch (error) {
      console.error('[Ed] Chat error:', error);
      throw new Error(`Ed chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
