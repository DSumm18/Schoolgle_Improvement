import type { Message, ModelRoutingDecision } from '@schoolgle/shared';
/**
 * Routes tasks to optimal models based on complexity, cost, and requirements
 */
export declare class ModelRouter {
    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens;
    /**
     * Determine task complexity
     */
    private analyzeTaskComplexity;
    /**
     * Determine task type from context
     */
    private determineTaskType;
    /**
     * Select optimal model for task
     */
    route(messages: Message[], context?: any): ModelRoutingDecision;
}
export declare const modelRouter: ModelRouter;
//# sourceMappingURL=model-router.d.ts.map