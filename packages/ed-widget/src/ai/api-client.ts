/**
 * API Client for Ed Widget
 * Calls the /api/ed/chat endpoint which uses the Ed Agents Orchestrator
 * This provides the correct school support prompts for logged-in users
 */

import type { ChatContext } from './types';

interface ChatRequest {
  question: string;
  context?: {
    url: string;
    hostname: string;
    title: string;
    tool?: {
      id: string;
      name: string;
      category: string;
    };
    visibleText: string;
    headings: Array<{ level: number; text: string }>;
    selectedText?: string;
  };
  organizationId?: string;
  userId?: string;
}

interface ChatResponse {
  id: string;
  answer: string;
  suggestions?: string[];
  confidence: number;
  source: 'ai' | 'cache' | 'fallback' | 'automation';
}

interface WebsiteKnowledgeQuery {
  question: string;
  organizationId: string;
}

interface WebsiteKnowledgeResponse {
  answer: string;
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
  confidence: number;
}

export class EdAPIClient {
  private baseUrl: string;
  private organizationId?: string;
  private userId?: string;
  private mode: 'website' | 'support' | 'school' = 'school';

  constructor(baseUrl: string = '/api/ed/chat', organizationId?: string, userId?: string) {
    this.baseUrl = baseUrl;
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Set the mode for this client
   */
  setMode(mode: 'website' | 'support' | 'school'): void {
    this.mode = mode;
  }

  /**
   * Query website knowledge base for visitor questions
   */
  async queryWebsiteKnowledge(question: string): Promise<WebsiteKnowledgeResponse | null> {
    if (!this.organizationId || this.mode !== 'website') {
      return null;
    }

    try {
      const response = await fetch('/api/ed/website-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          organizationId: this.organizationId,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('[EdAPIClient] Website knowledge query error:', error);
    }

    return null;
  }

  /**
   * Send chat message to /api/ed/chat endpoint
   * This uses the Ed Agents Orchestrator with proper school support prompts
   */
  async chat(userMessage: string, context?: ChatContext): Promise<string> {
    try {
      // Build page context
      const pageContext = {
        url: window.location.href,
        hostname: window.location.hostname,
        title: document.title,
        visibleText: document.body?.innerText?.substring(0, 5000) || '',
        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({
            level: parseInt(h.tagName[1]),
            text: h.textContent?.trim() || ''
          }))
          .filter(h => h.text)
          .slice(0, 20),
      };

      const requestBody: ChatRequest = {
        question: userMessage,
        context: pageContext,
        organizationId: this.organizationId,
        userId: this.userId,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      return data.answer || "I'm sorry, I couldn't get a response. Please try again.";

    } catch (error) {
      console.error('[EdAPIClient] Error:', error);

      // Fallback responses based on mode
      if (this.organizationId) {
        // School mode - logged in user
        return "I'm having trouble connecting right now. As your school support assistant, I can help with tasks once I'm back online. Please try again in a moment.";
      } else {
        // Support mode - pre-login
        return "I'm having trouble connecting. For help logging in, please try refreshing the page or contact support if the problem persists.";
      }
    }
  }

  /**
   * Get greeting based on mode (website, support, or school)
   */
  getGreeting(mode: 'website' | 'support' | 'school' = 'school', userName?: string): string {
    if (mode === 'website') {
      // Website mode - public visitors (parents, students)
      return `Hi! Welcome to our school. I'm Ed, here to help.

I can help you with:
• School information and contact details
• Term dates and calendar events
• Admissions and enrolment enquiries
• General questions about our school

What can I help you find today?`;
    }

    if (mode === 'support') {
      // Pre-login greeting - support mode
      return `Hi! I'm Ed, the Schoolgle support assistant.

I can help you:
• Log in to your account
• Reset your password
• Troubleshoot access issues
• Learn about Schoolgle

What do you need help with?`;
    }

    // Post-login greeting - school support mode
    const name = userName ? ` ${userName}` : '';
    return `Hi${name}! I'm Ed, your Schoolgle assistant.

I can help you with:
• School improvement tasks
• Compliance guidance
• HR questions
• Staff directory
• Using Schoolgle features

What work task can I help you with today?`;
  }

  /**
   * Update user context (called when user logs in)
   */
  setContext(organizationId: string, userId: string): void {
    this.organizationId = organizationId;
    this.userId = userId;
  }
}
