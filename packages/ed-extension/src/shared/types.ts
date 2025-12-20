// Ed Extension Shared Types

/**
 * Page context extracted from the current tab
 */
export interface PageContext {
  url: string;
  hostname: string;
  pathname: string;
  title: string;
  headings: HeadingInfo[];
  visibleText: string;
  forms: FormInfo[];
  selectedText: string;
  detectedTool: ToolMatch | null;
  timestamp: number;
}

export interface HeadingInfo {
  level: number;
  text: string;
}

export interface FormInfo {
  id: string;
  name: string;
  action: string;
  fields: FormFieldInfo[];
}

export interface FormFieldInfo {
  type: string;
  name: string;
  id: string;
  label: string;
  placeholder: string;
  value: string;
  isPassword: boolean;
}

/**
 * Detected school tool
 */
export interface ToolMatch {
  id: string;
  name: string;
  category: ToolCategory;
  confidence: number;
  matchedOn: 'url' | 'dom' | 'title';
}

export type ToolCategory = 
  | 'MIS'        // SIMS, Arbor, Bromcom
  | 'Finance'    // PS Financials, FMS
  | 'Safeguarding' // CPOMS, MyConcern
  | 'HR'         // Every HR, The Key HR
  | 'Parents'    // ParentPay, ParentMail
  | 'Teaching'   // Google Classroom, Teams
  | 'Data'       // ASP, FFT
  | 'Admin'      // General admin tools
  | 'Unknown';

/**
 * Messages between content script and background worker
 */
export type ExtensionMessage = 
  | { type: 'GET_PAGE_CONTEXT'; tabId?: number }
  | { type: 'PAGE_CONTEXT_RESPONSE'; context: PageContext }
  | { type: 'ASK_ED'; question: string; context: PageContext }
  | { type: 'ED_RESPONSE'; response: EdResponse }
  | { type: 'TOGGLE_ED'; visible?: boolean }
  | { type: 'START_WATCH_MODE'; steps: WatchStep[] }
  | { type: 'START_ACT_MODE'; actions: AutomationAction[] }
  | { type: 'STOP_AUTOMATION' }
  | { type: 'AUTOMATION_COMPLETE'; success: boolean }
  | { type: 'USER_INTERRUPT' }
  | { type: 'CHECK_AUTH' }
  | { type: 'AUTH_STATUS'; status: AuthState; subscription: SubscriptionStatus | null }
  | { type: 'LOGIN'; token: string }
  | { type: 'LOGOUT' };

/**
 * Ed's response to a question
 */
export interface EdResponse {
  id: string;
  answer: string;
  suggestions?: string[];
  actions?: SuggestedAction[];
  confidence: number;
  source: 'ai' | 'cache' | 'fallback';
}

export interface SuggestedAction {
  label: string;
  type: 'click' | 'navigate' | 'fill' | 'copy';
  target?: string;
  value?: string;
}

/**
 * Watch mode - highlighting elements
 */
export interface WatchStep {
  id: string;
  instruction: string;
  selector: string;
  highlightType: 'pulse' | 'arrow' | 'box';
}

/**
 * Act mode - automation actions
 */
export interface AutomationAction {
  id: string;
  type: 'click' | 'type' | 'select' | 'scroll' | 'wait';
  selector: string;
  value?: string;
  delay?: number;
}

/**
 * Extension state
 */
export interface EdState {
  isVisible: boolean;
  isMinimized: boolean;
  currentTool: ToolMatch | null;
  automationActive: boolean;
  automationPaused: boolean;
}

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  ED_STATE: 'ed_state',
  USER_PREFERENCES: 'ed_user_prefs',
  RESPONSE_CACHE: 'ed_response_cache',
  TOOL_HISTORY: 'ed_tool_history',
  AUTH_TOKEN: 'ed_auth_token',
  SUBSCRIPTION: 'ed_subscription',
} as const;

/**
 * Subscription status from server
 */
export interface SubscriptionStatus {
  hasAccess: boolean;
  status: 'none' | 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  plan: {
    id: string;
    name: string;
    product: string;
    features: Record<string, boolean>;
  } | null;
  daysRemaining: number | null;
  trialEnds: string | null;
  periodEnds: string | null;
  school: {
    id: string;
    name: string;
    urn: string | null;
  } | null;
}

/**
 * Auth state
 */
export interface AuthState {
  userId: string | null;
  email: string | null;
  organizationId: string | null;
  isAuthenticated: boolean;
  lastChecked: number;
}

/**
 * User preferences
 */
export interface UserPreferences {
  enabled: boolean;
  showOnStartup: boolean;
  language: string;
  voiceEnabled: boolean;
  automationConsent: boolean;
  disabledSites: string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  enabled: true,
  showOnStartup: true,
  language: 'en-GB',
  voiceEnabled: false,
  automationConsent: false,
  disabledSites: [],
};

