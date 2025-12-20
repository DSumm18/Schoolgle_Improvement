/**
 * Action Executor - Executes automation actions and tracks results
 */

import { getPlaywrightClient } from './playwright-client';
import type { AutomationAction, ActionExecutionResult } from './types';

export interface ExecutionOptions {
  sessionId?: string;
  maxActions?: number;
  timeout?: number;
  onProgress?: (result: ActionExecutionResult) => void;
}

export class ActionExecutor {
  private client = getPlaywrightClient();

  /**
   * Execute a list of actions
   */
  async executeActions(
    actions: AutomationAction[],
    options: ExecutionOptions = {}
  ): Promise<ActionExecutionResult[]> {
    const {
      sessionId,
      maxActions = 50,
      timeout = 60000,
      onProgress,
    } = options;

    if (actions.length > maxActions) {
      throw new Error(`Too many actions: ${actions.length} (max: ${maxActions})`);
    }

    const results: ActionExecutionResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const actionStartTime = Date.now();

      // Check timeout
      if (Date.now() - startTime > timeout) {
        results.push({
          action,
          success: false,
          error: 'Execution timeout',
          duration: Date.now() - actionStartTime,
        });
        break;
      }

      try {
        const success = await this.client.executeAction(action, sessionId);

        const result: ActionExecutionResult = {
          action,
          success,
          duration: Date.now() - actionStartTime,
        };

        if (!success) {
          result.error = `Action ${action.type} failed`;
        }

        results.push(result);
        onProgress?.(result);

        // Small delay between actions
        if (i < actions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        const result: ActionExecutionResult = {
          action,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - actionStartTime,
        };
        results.push(result);
        onProgress?.(result);
      }
    }

    return results;
  }

  /**
   * Take a screenshot after execution
   */
  async takeScreenshot(sessionId?: string, fullPage = true): Promise<string> {
    const screenshot = await this.client.screenshot(sessionId, fullPage);
    return screenshot.toString('base64');
  }

  /**
   * Get current page content
   */
  async getPageContent(sessionId?: string): Promise<string> {
    return await this.client.getContent(sessionId);
  }
}

