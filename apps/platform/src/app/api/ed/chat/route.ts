import { NextRequest, NextResponse } from 'next/server';
import { EdChatHandler } from '@schoolgle/ed-backend';
import type { EdContext, Message } from '@schoolgle/shared';

/**
 * Ed Chat API Route - Updated to use Ed Backend Package
 * Handles chat requests from Ed widget with full Schoolgle context
 */

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment (OpenRouter preferred, OpenAI fallback)
    const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { messages, context } = body as {
      messages: Message[];
      context: Partial<EdContext>;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Build full context
    const fullContext: EdContext = {
      organizationId: context.organizationId || 'demo',
      schoolName: context.schoolName || 'Demo School',
      product: 'schoolgle-platform',
      page: context.page,
      category: context.category,
      userId: context.userId,
      userRole: context.userRole,
      conversationId: context.conversationId,

      // TODO: Fetch actual Schoolgle context from database
      // For now, pass through what's provided
      schoolgleContext: context.schoolgleContext || {
        assessments: [],
        gaps: [],
        recentActivity: [],
        healthScore: undefined,
        evidenceSummary: undefined
      }
    };

    // Initialize Ed chat handler with OpenRouter
    const chatHandler = new EdChatHandler(apiKey);

    // Handle chat
    const response = await chatHandler.handleChat({
      messages,
      context: fullContext
    });

    // Return response (maintain compatibility with existing frontend)
    return NextResponse.json({
      response: response.message,  // Keep 'response' key for compatibility
      message: response.message,
      conversationId: response.conversationId,
      metadata: {
        model: response.model,
        tokens: response.usage.tokens,
        cost: response.usage.cost
      }
    });

  } catch (error) {
    console.error('[Ed API] Error:', error);
    
    // Return fallback response on error
    return NextResponse.json({
      response: `I'm having a bit of trouble connecting right now. Let me give you a quick answer based on what I know...\n\nI'm Ed, your AI School Improvement Partner. I can help you with:\n\n📚 **Understanding Ofsted** - What inspectors look for\n🔬 **EEF Research** - Evidence-based strategies\n📊 **Data Analysis** - Making sense of patterns\n🎯 **Action Planning** - Creating improvement actions\n\nWhat would you like to explore?`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
