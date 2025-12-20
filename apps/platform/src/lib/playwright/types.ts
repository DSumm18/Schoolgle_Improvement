/**
 * TypeScript types for Playwright automation
 */

export type AutomationActionType = 
  | 'click'
  | 'type'
  | 'select'
  | 'navigate'
  | 'wait'
  | 'scroll'
  | 'screenshot';

export interface BaseAutomationAction {
  type: AutomationActionType;
  description: string;
  id?: string;
}

export interface ClickAction extends BaseAutomationAction {
  type: 'click';
  selector: string;
  delay?: number;
}

export interface TypeAction extends BaseAutomationAction {
  type: 'type';
  selector: string;
  value: string;
  delay?: number;
}

export interface SelectAction extends BaseAutomationAction {
  type: 'select';
  selector: string;
  value: string;
}

export interface NavigateAction extends BaseAutomationAction {
  type: 'navigate';
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
}

export interface WaitAction extends BaseAutomationAction {
  type: 'wait';
  duration: number;
}

export interface ScrollAction extends BaseAutomationAction {
  type: 'scroll';
  direction: 'up' | 'down' | 'left' | 'right';
  amount?: number;
}

export interface ScreenshotAction extends BaseAutomationAction {
  type: 'screenshot';
  fullPage?: boolean;
}

export type AutomationAction = 
  | ClickAction
  | TypeAction
  | SelectAction
  | NavigateAction
  | WaitAction
  | ScrollAction
  | ScreenshotAction;

export interface ActionExecutionResult {
  action: AutomationAction;
  success: boolean;
  error?: string;
  duration?: number;
  screenshot?: string; // base64
}

export interface AutomationSession {
  sessionId: string;
  url: string;
  actions: AutomationAction[];
  results: ActionExecutionResult[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationRequest {
  url: string;
  task: string;
  screenshot?: string; // base64
  domSnapshot?: string;
  sessionId?: string;
  geminiApiKey?: string; // Optional - can be passed from extension
}

export interface AutomationResponse {
  success: boolean;
  sessionId: string;
  actions: AutomationAction[];
  execution: {
    completed: ActionExecutionResult[];
    failed: ActionExecutionResult[];
  };
  screenshot?: string; // base64, final state
  error?: string;
}

