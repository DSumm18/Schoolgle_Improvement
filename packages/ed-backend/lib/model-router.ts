import type { Message, ModelConfig, TaskType, ModelRoutingDecision } from '@schoolgle/shared';

/**
 * Routes tasks to optimal models based on complexity, cost, and requirements
 */
export class ModelRouter {
  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Determine task complexity
   */
  private analyzeTaskComplexity(messages: Message[]): {
    tokenCount: number;
    requiresReasoning: boolean;
    requiresVision: boolean;
  } {
    const lastMessage = messages[messages.length - 1];
    const tokenCount = this.estimateTokens(lastMessage.content);
    
    // Check for reasoning indicators
    const reasoningKeywords = ['explain', 'analyze', 'compare', 'evaluate', 'plan', 'strategy'];
    const requiresReasoning = reasoningKeywords.some(kw => 
      lastMessage.content.toLowerCase().includes(kw)
    );
    
    // Check for vision indicators (will implement with Product 2)
    const requiresVision = false;
    
    return { tokenCount, requiresReasoning, requiresVision };
  }

  /**
   * Determine task type from context
   */
  private determineTaskType(
    messages: Message[],
    context: any
  ): TaskType {
    // Vision analysis (Product 2)
    if (context?.screenshot) {
      return 'vision_analysis';
    }
    
    // OCR task
    if (context?.taskType === 'document_extract') {
      return 'ocr';
    }
    
    // Report generation
    if (context?.taskType === 'generate_report') {
      return 'report_generation';
    }
    
    // Chat complexity
    const { tokenCount, requiresReasoning } = this.analyzeTaskComplexity(messages);
    
    if (tokenCount > 500 || requiresReasoning) {
      return 'chat_complex';
    }
    
    return 'chat_simple';
  }

  /**
   * Select optimal model for task
   */
  route(
    messages: Message[],
    context: any = {}
  ): ModelRoutingDecision {
    const taskType = this.determineTaskType(messages, context);
    
    let selectedModel: ModelConfig;
    let reason: string;
    let estimatedCost: number;
    
    switch (taskType) {
      case 'vision_analysis':
        selectedModel = {
          model: 'qwen/qwen-2.5-vl-72b',
          provider: 'openrouter',
          maxTokens: 1500,
          temperature: 0.3
        };
        reason = 'UI screenshot analysis requires vision model';
        estimatedCost = 0.0008; // ~£0.0008 per request
        break;
        
      case 'ocr':
        selectedModel = {
          model: 'mistralai/pixtral-large-2411',
          provider: 'openrouter',
          maxTokens: 2000,
          temperature: 0.1
        };
        reason = 'OCR task requires specialized model';
        estimatedCost = 0.0004;
        break;
        
      case 'report_generation':
        selectedModel = {
          model: 'openai/gpt-4o-mini',
          provider: 'openrouter',
          maxTokens: 4000,
          temperature: 0.7
        };
        reason = 'Report writing benefits from GPT-4o-mini quality';
        estimatedCost = 0.002;
        break;
        
      case 'chat_complex':
        selectedModel = {
          model: 'deepseek/deepseek-chat',
          provider: 'openrouter',
          maxTokens: 2000,
          temperature: 0.7
        };
        reason = 'Complex reasoning task, using DeepSeek V3';
        estimatedCost = 0.0012;
        break;
        
      case 'chat_simple':
      default:
        selectedModel = {
          model: 'deepseek/deepseek-chat',
          provider: 'openrouter',
          maxTokens: 1000,
          temperature: 0.7
        };
        reason = 'Simple query, using DeepSeek (cost-effective & reliable)';
        estimatedCost = 0.0012;
        break;
    }
    
    return {
      taskType,
      selectedModel,
      reason,
      estimatedCost
    };
  }
}

// Export singleton instance
export const modelRouter = new ModelRouter();
