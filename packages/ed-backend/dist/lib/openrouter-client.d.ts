import type { Message, ModelUsage } from '@schoolgle/shared';
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
export declare class OpenRouterClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=openrouter-client.d.ts.map