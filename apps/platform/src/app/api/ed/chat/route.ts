// Ed Chat API - Handles AI questions from browser extension

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Import Ed Orchestrator via webpack alias (see next.config.ts)
import { createOrchestrator } from '@schoolgle/ed-agents/orchestrator/orchestrator';
import type { OrchestratorConfig } from '@schoolgle/ed-agents/types';

interface ChatRequest {
  question: string;
  context: {
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
  pageState?: {
    screenshot: string;
    domSnapshot: string;
  };
}

interface ChatResponse {
  id: string;
  answer: string;
  suggestions?: string[];
  confidence: number;
  source: 'ai' | 'cache' | 'fallback' | 'automation';
  automation?: {
    sessionId: string;
    actions: number;
    success: boolean;
  };
}

// Tool-specific knowledge base for quick responses (retained for compatibility)
const QUICK_ANSWERS: Record<string, Record<string, string>> = {
  sims: {
    'add pupil': 'To add a new pupil in SIMS: Go to Focus > Pupil > Pupil Details, click New, fill in the required fields (surname, forename, DOB, gender), then Save.',
    'attendance report': 'To run an attendance report in SIMS: Go to Reports > Attendance Reports, select the report type, set your date range and year groups, then click Run Report.',
    'quick search': 'Use Ctrl+Q for quick search in SIMS. You can search for pupils, staff, or other records by name.',
  },
  arbor: {
    'mark attendance': 'To mark attendance in Arbor: Go to Students > Attendance > Mark Attendance, select your class, click each student to mark present or use quick mark buttons, then Save.',
    'send message': 'To send a message in Arbor: Go to Communications > Messages > New Message, select recipients, choose email/SMS, write your message and send.',
    'safeguarding': 'To log a safeguarding concern in Arbor: Find the student profile, click the Safeguarding tab, click New Concern, complete all fields, and submit for DSL review.',
  },
  cpoms: {
    'log incident': 'To log an incident in CPOMS: Click Add Incident (+), search for the student, choose the category, write a factual account, tag for DSL attention if urgent, then Submit.',
    'add action': 'To add an action in CPOMS: Open the incident, click Add Action, select the type, assign to a staff member, set a due date, and Save.',
  },
  'google-classroom': {
    'create assignment': 'To create an assignment in Google Classroom: Open your class, click Classwork tab, Create > Assignment, add title and instructions, set due date and points, then Assign.',
    'grade work': 'To grade in Google Classroom: Open the assignment, click a submission, review, add comments, enter the grade, then Return to student.',
  },
  canva: {
    'create poster': 'To create a poster in Canva: Click Create a Design, search "Poster", choose a template or start blank, add text/images, customise, then download or share.',
    'brand kit': 'Set up your school\'s Brand Kit in Settings to maintain consistent colours and fonts across all designs.',
  },
};

/**
 * POST /api/ed/chat
 * Handle chat messages from Ed browser extension
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { question, context, pageState } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Check if this is an automation request
    const needsAutomation = detectAutomationRequest(question);

    if (needsAutomation) {
      try {
        // Get API key from request body if provided (from extension)
        const geminiApiKey = (body as any).geminiApiKey;

        // Call automation API
        const automationResponse = await callAutomationAPI(question, context, pageState, geminiApiKey);

        if (automationResponse) {
          return NextResponse.json({
            id: crypto.randomUUID(),
            answer: automationResponse.answer,
            confidence: 0.9,
            source: 'automation',
            automation: {
              sessionId: automationResponse.sessionId,
              actions: automationResponse.actions,
              success: automationResponse.success,
            },
          });
        }
      } catch (error) {
        console.error('[Ed Chat API] Automation error:', error);
        // Fall through to regular AI response
      }
    }

    // Try quick answer first (for tool-specific questions)
    const quickAnswer = findQuickAnswer(question, context.tool?.id);
    if (quickAnswer) {
      const response: ChatResponse = {
        id: crypto.randomUUID(),
        answer: quickAnswer,
        confidence: 0.9,
        source: 'cache',
      };
      return NextResponse.json(response);
    }

    // Get user context from Supabase
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get user's organization and role
    let organization: any = null;
    let userRole: 'viewer' = 'viewer';
    let subscription = {
      plan: 'free' as const,
      features: [] as string[],
      creditsRemaining: 1000,
      creditsUsed: 0,
    };

    if (user) {
      // Fetch organization details
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*, role')
        .eq('user_id', user.id)
        .single();

      if (orgData) {
        organization = orgData;

        // Map role to our format
        const roleMap: Record<string, 'admin' | 'staff' | 'viewer'> = {
          'admin': 'admin',
          'slt': 'admin',
          'teacher': 'staff',
          'governor': 'staff',
          'viewer': 'viewer',
        };
        userRole = roleMap[orgData.role] || 'viewer';

        // Get subscription details (if available)
        subscription = {
          plan: (orgData.subscription_plan as any) || 'free',
          features: orgData.features || [],
          creditsRemaining: orgData.credits_remaining || 1000,
          creditsUsed: orgData.credits_used || 0,
        };
      }
    }

    // Determine active app based on context
    let activeApp: string | undefined;
    if (context.tool?.id) {
      const appMap: Record<string, string> = {
        'sims': 'schoolgle-platform',
        'arbor': 'schoolgle-platform',
        'cpoms': 'schoolgle-platform',
      };
      activeApp = appMap[context.tool.id];
    }

    // Create orchestrator config
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    console.log('[Ed Chat API] API Key present:', apiKey.length > 0 ? `YES (${apiKey.substring(0, 10)}...)` : 'NO');

    const orchestratorConfig: OrchestratorConfig = {
      supabase,
      userId: user?.id || 'anonymous',
      orgId: organization?.id || 'unknown',
      userRole,
      subscription,
      activeApp,
      enableMultiPerspective: true,
      enableBrowserAutomation: false,
      debug: process.env.NODE_ENV === 'development',
      openRouterApiKey: apiKey, // Pass API key explicitly
    };

    // Create orchestrator and process question
    const orchestrator = await createOrchestrator(orchestratorConfig);

    // Process through agent framework
    const edResponse = await orchestrator.processQuestion(question, {
      app: activeApp,
      page: context.title,
      screenshot: pageState?.screenshot,
    });

    // Map EdResponse to ChatResponse format
    const response: ChatResponse = {
      id: crypto.randomUUID(),
      answer: edResponse.response,
      confidence: edResponse.confidence === 'HIGH' ? 0.9 : edResponse.confidence === 'MEDIUM' ? 0.7 : 0.5,
      source: 'ai',
    };

    // Add suggestions if available
    if (edResponse.warnings && edResponse.warnings.length > 0) {
      response.suggestions = edResponse.warnings;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Ed Chat API] Error:', error);

    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        {
          id: crypto.randomUUID(),
          answer: "I'm having trouble connecting to my AI services. This might be an API configuration issue. Please try again or contact support.",
          confidence: 0,
          source: 'fallback',
        },
        { status: 503 }
      );
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        {
          id: crypto.randomUUID(),
          answer: "I'm receiving too many requests right now. Please wait a moment and try again.",
          confidence: 0.5,
          source: 'fallback',
        },
        { status: 429 }
      );
    }

    // Generic fallback
    const fallback: ChatResponse = {
      id: crypto.randomUUID(),
      answer: "I'm having trouble processing that right now. Could you try asking in a different way?",
      confidence: 0,
      source: 'fallback',
    };

    return NextResponse.json(fallback);
  }
}

/**
 * Find a quick answer from the knowledge base
 */
function findQuickAnswer(question: string, toolId?: string): string | null {
  const lowerQuestion = question.toLowerCase();

  // Search in tool-specific answers first
  if (toolId && QUICK_ANSWERS[toolId]) {
    for (const [key, answer] of Object.entries(QUICK_ANSWERS[toolId])) {
      if (lowerQuestion.includes(key)) {
        return answer;
      }
    }
  }

  // Search all tools
  for (const [, answers] of Object.entries(QUICK_ANSWERS)) {
    for (const [key, answer] of Object.entries(answers)) {
      if (lowerQuestion.includes(key)) {
        return answer;
      }
    }
  }

  return null;
}

/**
 * Detect if a request needs browser automation
 */
function detectAutomationRequest(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  const automationKeywords = [
    'fill',
    'click',
    'type',
    'select',
    'navigate',
    'go to',
    'open',
    'submit',
    'enter',
    'do this',
    'perform',
    'execute',
    'automate',
    'complete this',
    'fill in',
    'fill out',
  ];

  return automationKeywords.some(keyword => lowerQuestion.includes(keyword));
}

/**
 * Call automation API
 */
async function callAutomationAPI(
  question: string,
  context: ChatRequest['context'],
  pageState?: ChatRequest['pageState'],
  geminiApiKey?: string
): Promise<{ answer: string; sessionId: string; actions: number; success: boolean } | null> {
  try {
    // Get base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const body: any = {
      url: context.url,
      task: question,
    };

    // Add Gemini API key if provided (from extension config)
    if (geminiApiKey) {
      body.geminiApiKey = geminiApiKey;
    }

    // Add pageState if provided
    if (pageState) {
      body.screenshot = pageState.screenshot.replace(/^data:image\/\w+;base64,/, '');
      body.domSnapshot = pageState.domSnapshot;
    }

    const response = await fetch(`${baseUrl}/api/ed/automate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('[Automation API] Error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();

    if (data.success) {
      const completedCount = data.execution.completed.length;
      const failedCount = data.execution.failed.length;

      return {
        answer: `I've completed the task! Executed ${completedCount} action${completedCount !== 1 ? 's' : ''}${failedCount > 0 ? ` (${failedCount} failed)` : ''}.`,
        sessionId: data.sessionId,
        actions: data.actions.length,
        success: true,
      };
    } else {
      return {
        answer: `I tried to complete the task but encountered an error: ${data.error || 'Unknown error'}`,
        sessionId: data.sessionId || '',
        actions: 0,
        success: false,
      };
    }
  } catch (error) {
    console.error('[Automation API] Request error:', error);
    return null;
  }
}
