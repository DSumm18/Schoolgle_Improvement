import { NextRequest, NextResponse } from 'next/server';
import { EdChatHandler } from '@schoolgle/ed-backend';
import type { EdContext, Message } from '@schoolgle/shared';

/**
 * Ed Parent Chat API Route
 * Handles chat requests from parents with school knowledge base
 */

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment
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

    // Build context for parent chat
    // TODO: Fetch school knowledge base from database
    const fullContext: EdContext = {
      organizationId: context.organizationId || 'demo',
      schoolName: context.schoolName || 'Demo School',
      product: 'parent-chat',
      userId: context.userId,
      userRole: 'parent',
      conversationId: context.conversationId,

      // Parent chat uses knowledge base instead of Schoolgle context
      knowledge: {
        'term_dates_2024_spring': {
          value: 'Spring Term: Monday 8 January - Friday 22 March 2024 (half term 12-16 Feb)',
          source: 'manual',
          lastVerified: new Date('2024-01-01'),
          confidence: 1.0
        },
        'term_dates_2024_summer': {
          value: 'Summer Term: Monday 15 April - Friday 19 July 2024 (half term 27-31 May)',
          source: 'manual',
          lastVerified: new Date('2024-01-01'),
          confidence: 1.0
        },
        'school_start_time': {
          value: 'School starts at 8:45am. Gates open at 8:30am.',
          source: 'manual',
          lastVerified: new Date('2024-01-01'),
          confidence: 1.0
        },
        'absence_reporting': {
          value: 'Please phone the school office on 01223 123456 before 9:00am if your child is absent.',
          source: 'manual',
          lastVerified: new Date('2024-01-01'),
          confidence: 1.0
        },
        'uniform_policy': {
          value: 'School uniform: Grey trousers/skirt, white polo shirt, green jumper with school logo. PE kit: White t-shirt, black shorts, trainers.',
          source: 'manual',
          lastVerified: new Date('2024-01-01'),
          confidence: 1.0
        }
      }
    };

    // Initialize Ed chat handler
    const chatHandler = new EdChatHandler(apiKey);

    // Handle chat
    const response = await chatHandler.handleChat({
      messages,
      context: fullContext
    });

    // Return response
    return NextResponse.json({
      response: response.message,
      metadata: {
        model: response.model,
        tokens: response.usage.tokens,
        cost: response.usage.cost
      }
    });

  } catch (error) {
    console.error('[Ed Parent API] Error:', error);

    // Return fallback response
    return NextResponse.json({
      response: `I'm having a bit of trouble right now. For urgent matters, please contact the school office directly.\n\nIn the meantime, here are some helpful links:\n\n📅 **Term Dates** - Check our website\n📞 **School Office** - 01223 123456\n✉️ **Email** - office@school.sch.uk\n\nIs there something else I can help with?`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
