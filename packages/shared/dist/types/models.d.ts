/**
 * AI Model configuration and routing types
 */
export interface ModelConfig {
    model: string;
    provider: 'openrouter' | 'openai' | 'anthropic';
    maxTokens?: number;
    temperature?: number;
    topP?: number;
}
export interface ModelUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
}
export type TaskType = 'chat_simple' | 'chat_complex' | 'document_analysis' | 'vision_analysis' | 'ocr' | 'embedding' | 'report_generation';
export interface ModelRoutingDecision {
    taskType: TaskType;
    selectedModel: ModelConfig;
    reason: string;
    estimatedCost: number;
}
//# sourceMappingURL=models.d.ts.map