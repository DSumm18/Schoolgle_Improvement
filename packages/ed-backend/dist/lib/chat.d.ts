import type { Message, EdContext } from '@schoolgle/shared';
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
export declare class EdChatHandler {
    private openRouter;
    constructor(apiKey: string);
    handleChat(request: EdChatRequest): Promise<EdChatResponse>;
}
//# sourceMappingURL=chat.d.ts.map