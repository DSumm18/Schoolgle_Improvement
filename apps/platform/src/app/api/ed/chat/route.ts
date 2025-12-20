// Ed Chat API - Handles AI questions from browser extension

import { NextRequest, NextResponse } from 'next/server';

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

// Tool-specific knowledge base for quick responses
const QUICK_ANSWERS: Record<string, Record<string, string>> = {
  sims: {
    'add pupil': 'To add a new pupil in SIMS: Go to Focus > Pupil > Pupil Details, click New, fill in the required fields (surname, forename, DOB, gender), then Save.',
    'attendance report': 'To run an attendance report: Go to Reports > Attendance Reports, select the report type, set your date range and year groups, then click Run Report.',
    'quick search': 'Use Ctrl+Q for quick search in SIMS. You can search for pupils, staff, or other records by name.',
  },
  arbor: {
    'mark attendance': 'To mark attendance in Arbor: Go to Students > Attendance > Mark Attendance, select your class, click each student to mark present or use quick mark buttons, then Save.',
    'send message': 'To send a message: Go to Communications > Messages > New Message, select recipients, choose email/SMS, write your message and send.',
    'safeguarding': 'To log a safeguarding concern: Find the student profile, click the Safeguarding tab, click New Concern, complete all fields, and submit for DSL review.',
  },
  cpoms: {
    'log incident': 'To log an incident in CPOMS: Click Add Incident (+), search for the student, choose the category, write a factual account, tag for DSL attention if urgent, then Submit.',
    'add action': 'To add an action: Open the incident, click Add Action, select the type, assign to a staff member, set a due date, and Save.',
  },
  'google-classroom': {
    'create assignment': 'To create an assignment: Open your class, click Classwork tab, Create > Assignment, add title and instructions, set due date and points, then Assign.',
    'grade work': 'To grade: Open the assignment, click a submission, review, add comments, enter the grade, then Return to student.',
  },
  canva: {
    'create poster': 'To create a poster: Click Create a Design, search "Poster", choose a template or start blank, add text/images, customise, then download or share.',
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
        // Get Gemini API key from request body if provided (from extension)
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
    
    // Try quick answer first
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
    
    // Build AI prompt with context
    const prompt = buildPrompt(question, context);
    
    // Try AI response
    const aiResponse = await getAIResponse(prompt, context);
    
    return NextResponse.json(aiResponse);
    
  } catch (error) {
    console.error('[Ed Chat API] Error:', error);
    
    // Fallback response
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
 * Build prompt for AI
 */
function buildPrompt(question: string, context: ChatRequest['context']): string {
  let prompt = `You are Ed, a friendly AI assistant helping school staff use their software tools. 
Be concise, helpful, and practical. Use British English spelling.

CONTEXT:
- User is viewing: ${context.title}
- URL: ${context.url}
`;
  
  if (context.tool) {
    prompt += `- Currently using: ${context.tool.name} (${context.tool.category})
`;
  }
  
  if (context.headings.length > 0) {
    prompt += `- Page sections: ${context.headings.slice(0, 5).map(h => h.text).join(', ')}
`;
  }
  
  if (context.selectedText) {
    prompt += `- User has selected: "${context.selectedText}"
`;
  }
  
  prompt += `
USER QUESTION: ${question}

Provide a helpful, step-by-step answer. If you're not sure about something specific to the tool, say so and suggest where to find help.`;
  
  return prompt;
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

/**
 * Get AI response (placeholder for actual AI integration)
 */
async function getAIResponse(prompt: string, context: ChatRequest['context']): Promise<ChatResponse> {
  // Check for Gemini API key
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (answer) {
          return {
            id: crypto.randomUUID(),
            answer,
            confidence: 0.85,
            source: 'ai',
          };
        }
      }
    } catch (error) {
      console.error('[Ed Chat API] AI error:', error);
    }
  }
  
  // Fallback to generic helpful response
  const toolName = context.tool?.name || 'this tool';
  
  return {
    id: crypto.randomUUID(),
    answer: `I can see you're working in ${toolName}. While I don't have specific information about that right now, here are some general tips:

1. Look for a Help or ? icon in the interface
2. Check if there's a menu option for tutorials or guides
3. Try right-clicking on the element you're unsure about

Would you like to tell me more specifically what you're trying to do?`,
    confidence: 0.5,
    source: 'fallback',
  };
}
