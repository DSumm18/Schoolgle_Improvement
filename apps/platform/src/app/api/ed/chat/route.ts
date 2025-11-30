import { NextRequest, NextResponse } from 'next/server';
import { EdChatHandler, getSchoolgleContext } from '@schoolgle/ed-backend';
import type { EdContext, Message } from '@schoolgle/shared';
import { supabase } from '@/lib/supabase';

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
    const { messages, context, stream } = body as {
      messages: Message[];
      context: Partial<EdContext>;
      stream?: boolean;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Fetch actual Schoolgle context from database
    let schoolgleContext;
    const orgId = context.organizationId;

    if (orgId && orgId !== 'demo' && supabase) {
      try {
        schoolgleContext = await getSchoolgleContext(supabase, orgId);
        console.log('[Ed API] Fetched Schoolgle context:', {
          assessments: schoolgleContext.assessments.length,
          gaps: schoolgleContext.gaps.length,
          activities: schoolgleContext.recentActivity.length,
          healthScore: schoolgleContext.healthScore
        });
      } catch (error) {
        console.error('[Ed API] Error fetching Schoolgle context:', error);
        // Continue with empty context on error
        schoolgleContext = {
          assessments: [],
          gaps: [],
          recentActivity: [],
          healthScore: undefined,
          evidenceSummary: undefined
        };
      }
    } else {
      // Demo mode or no Supabase
      schoolgleContext = context.schoolgleContext || {
        assessments: [],
        gaps: [],
        recentActivity: [],
        healthScore: undefined,
        evidenceSummary: undefined
      };
    }

    // Build full context
    const fullContext: EdContext = {
      organizationId: orgId || 'demo',
      schoolName: context.schoolName || 'Demo School',
      product: 'schoolgle-platform',
      page: context.page,
      category: context.category,
      userId: context.userId,
      userRole: context.userRole,
      conversationId: context.conversationId,
      schoolgleContext
    };

    // Initialize Ed chat handler with OpenRouter
    const chatHandler = new EdChatHandler(apiKey);

    // If streaming is requested, return SSE response
    if (stream) {
      const encoder = new TextEncoder();

      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of chatHandler.handleChatStream({
              messages,
              context: fullContext
            })) {
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            // Send done message
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[Ed API] Streaming error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Handle non-streaming chat (backward compatibility)
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
