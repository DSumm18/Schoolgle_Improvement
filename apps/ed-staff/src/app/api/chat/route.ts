import { NextRequest, NextResponse } from 'next/server';
import { EdChatHandler } from '@schoolgle/ed-backend';
import type { EdContext, Message } from '@schoolgle/shared';

/**
 * Ed Staff Tools Chat API Route
 * Handles chat requests from staff members with MIS help and operational guidance
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
      messages: (Message & { imageData?: string })[];
      context: Partial<EdContext>;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Build context for staff tools
    const fullContext: EdContext = {
      organizationId: context.organizationId || 'demo',
      schoolName: context.schoolName || 'Demo School',
      product: 'staff-tools',
      userId: context.userId,
      userRole: 'staff',
      conversationId: context.conversationId,

      // Staff tools uses skills/capabilities context
      skills: {
        'arbor_navigation': {
          description: 'Help with Arbor MIS system navigation and common tasks',
          examples: [
            'How to mark attendance in Arbor',
            'How to record behaviour incidents',
            'How to generate reports in Arbor'
          ],
          category: 'MIS Systems'
        },
        'sims_navigation': {
          description: 'Guidance for SIMS MIS system operations',
          examples: [
            'Finding pupil records in SIMS',
            'Recording assessment data',
            'Setting up groups and classes'
          ],
          category: 'MIS Systems'
        },
        'attendance_codes': {
          description: 'Understanding UK attendance codes and when to use them',
          examples: [
            'When to use / vs \\ codes',
            'Medical appointment codes',
            'Unauthorised absence codes'
          ],
          category: 'Attendance'
        },
        'data_analysis': {
          description: 'Help analyzing pupil data and identifying trends',
          examples: [
            'Identifying underperforming groups',
            'Tracking progress over time',
            'Analyzing assessment gaps'
          ],
          category: 'Data & Assessment'
        },
        'safeguarding': {
          description: 'Safeguarding procedures and CPOMS guidance',
          examples: [
            'When to log a safeguarding concern',
            'Who to contact for different concerns',
            'Recording concern details properly'
          ],
          category: 'Safeguarding'
        },
        'curriculum_planning': {
          description: 'Research-based curriculum planning and sequencing',
          examples: [
            'Planning a knowledge-rich curriculum',
            'Ensuring progression across year groups',
            'Using retrieval practice effectively'
          ],
          category: 'Teaching & Learning'
        }
      }
    };

    // Check if latest message has screen capture
    const latestMessage = messages[messages.length - 1];
    const hasScreenCapture = latestMessage.role === 'user' && latestMessage.imageData;

    // If screen capture exists, enhance the prompt
    let enhancedMessages = [...messages];
    if (hasScreenCapture && latestMessage.imageData) {
      // Add system context about screen analysis
      enhancedMessages[enhancedMessages.length - 1] = {
        ...latestMessage,
        content: `[USER HAS SHARED A SCREENSHOT OF THEIR SCREEN]\n\nUser's question: ${latestMessage.content}\n\nPlease analyze the screenshot and provide step-by-step guidance to help them complete their task. Be specific about what buttons to click, where to navigate, and what information to enter.`
      };
    }

    // Initialize Ed chat handler
    const chatHandler = new EdChatHandler(apiKey);

    // Handle chat
    const response = await chatHandler.handleChat({
      messages: enhancedMessages.map(m => ({
        role: m.role,
        content: m.content
      })),
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
    console.error('[Ed Staff API] Error:', error);

    // Return fallback response
    return NextResponse.json({
      response: `I'm having a bit of trouble right now. For urgent IT support, please contact your school's IT team.\n\nIn the meantime, here are some helpful resources:\n\n📚 **MIS User Guides** - Check your MIS provider's documentation\n📞 **IT Support** - Contact your school's IT helpdesk\n💡 **Ed Skills** - Try one of the quick skills on the sidebar\n\nIs there something else I can help with?`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
