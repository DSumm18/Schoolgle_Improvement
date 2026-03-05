/**
 * Ed Hub API - Central access point for Ed's help
 *
 * The "go to" place for getting things done
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { openrouter } from '@/lib/ai-openrouter';

/**
 * GET /api/ed/hub
 *
 * Returns Ed's quick actions, recent questions, and help topics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const orgId = searchParams.get('org_id');

    switch (action) {
      case 'quick_actions':
        return await getQuickActions(orgId);
      case 'recent_questions':
        return await getRecentQuestions(orgId);
      case 'help_topics':
        return await getHelpTopics();
      case 'search':
        const query = searchParams.get('q');
        return await searchHelp(query);
      default:
        return await getHubContent(orgId);
    }
  } catch (error: any) {
    console.error('[Ed Hub] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load Ed Hub' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ed/hub
 *
 * Chat with Ed, submit a question, or trigger an action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message, orgId, userId, shortcut } = body;

    switch (action) {
      case 'chat':
        return await chatWithEd(message, orgId, userId);
      case 'submit_question':
        return await submitQuestion(message, orgId, userId);
      case 'execute_shortcut':
        return await executeShortcut(shortcut, orgId, userId);
      case 'trigger_automation':
        return await triggerAutomation(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Ed Hub] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Get Ed Hub main content
 */
async function getHubContent(orgId: string | null) {
  const quickActions = await getQuickActions(orgId);
  const recentQuestions = await getRecentQuestions(orgId);

  // Get school-specific actions
  let schoolActions = [];
  if (orgId) {
    schoolActions = await getSchoolActions(orgId);
  }

  return NextResponse.json({
    welcome: "Hi! I'm Ed. What can I help you with today?",
    quick_actions: quickActions,
    school_actions,
    recent_questions,
    popular_topics: [
      { id: 'safeguarding', title: 'How to report a concern', icon: '🛡️' },
      { id: 'absence', title: 'Report sickness absence', icon: '📅' },
      { id: 'riddor', title: 'RIDDOR reporting guide', icon: '⚠️' },
      { id: 'send', title: 'SEND/EHCP guidance', icon: '📚' },
      { id: 'free_meals', title: 'Free school meals eligibility', icon: '🍽️' },
      { id: 'policy', title: 'Find a school policy', icon: '📋' },
    ],
  });
}

/**
 * Get quick actions available to all users
 */
async function getQuickActions(orgId: string | null) {
  return [
    {
      id: 'fill_form',
      title: 'Fill a form with me',
      description: 'I can help fill in forms step by step',
      icon: '📝',
      shortcut: 'Ctrl+Shift+F',
      action: 'start_form_helper',
    },
    {
      id: 'search_knowledge',
      title: 'Search school knowledge',
      description: 'Find policies, procedures, guidance',
      icon: '🔍',
      shortcut: 'Ctrl+Shift+K',
      action: 'search_knowledge',
    },
    {
      id: 'draft_email',
      title: 'Draft an email/letter',
      description: 'I can help write professional communications',
      icon: '✉️',
      shortcut: 'Ctrl+Shift+E',
      action: 'draft_communication',
    },
    {
      id: 'check_compliance',
      title: 'Check compliance status',
      description: 'See what needs attention',
      icon: '✅',
      action: 'check_compliance',
    },
    {
      id: 'get_help',
      title: 'I don\'t know how to...',
      description: 'Get step-by-step guidance',
      icon: '💡',
      action: 'explain_process',
    },
  ];
}

/**
 * Get school-specific actions (from school's configuration)
 */
async function getSchoolActions(orgId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: shortcuts } = await supabase
    .from('ed_school_shortcuts')
    .select('id, name, description, icon, action, url')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('usage_count', { ascending: false })
    .limit(8);

  return shortcuts || [];
}

/**
 * Get recent questions from this school
 */
async function getRecentQuestions(orgId: string | null) {
  if (!orgId) return [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get questions asked in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: questions } = await supabase
    .from('ed_questions')
    .select('question, answer_preview, asked_at')
    .eq('organization_id', orgId)
    .gte('asked_at', sevenDaysAgo)
    .order('asked_at', { ascending: false })
    .limit(5);

  return (questions || []).map(q => ({
    question: q.question,
    preview: q.answer_preview?.substring(0, 100) + '...',
    time_ago: getRelativeTimeString(q.asked_at),
  }));
}

/**
 * Chat with Ed - answer questions
 */
async function chatWithEd(message: string, orgId: string | null, userId: string | null) {
  // Build system prompt with school context
  const systemPrompt = await buildEdContext(orgId);

  const response = await openrouter.chat.completions.create({
    model: 'deepseek/deepseek-chat',
    messages: [
      {
        role: 'system',
        content: systemPrompt + `

You are Ed, the helpful school assistant. Be:
- Friendly and approachable
- Knowledgeable about school processes
- Clear and practical in your guidance
- Never judgmental
- Happy to help with anything, no matter how small

Keep responses concise. If the task is complex, break it into steps.`
      },
      {
        role: 'user',
        content: message
      }
    ],
    });

  const answer = response.choices[0].message.content;

  // Log the question (anonymously)
  if (orgId) {
    await logQuestion(orgId, userId, message, answer);
  }

  return NextResponse.json({
    answer,
    sources: response.choices[0].message.sources || [],
    follow_up_suggestions: generateFollowUpSuggestions(message),
  });
}

/**
 * Build Ed's context about the school
 */
async function buildEdContext(orgId: string | null): Promise<string> {
  if (!orgId) {
    return `You are Ed, a helpful school assistant.
You help with general questions about school administration, forms, and processes.`;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get school info
  const { data: school } = await supabase
    .from('organizations')
    .select('name, urn, local_authority, phase, type')
    .eq('id', orgId)
    .single();

  // Get school's knowledge base
  const { data: knowledge } = await supabase
    .from('ed_website_knowledge')
    .select('page_title, page_url')
    .eq('organization_id', orgId)
    .limit(20);

  let context = `You are Ed, helping at ${school?.name || 'a school'}.`;

  if (school) {
    context += `
School details:
- URN: ${school.urn || 'Not set'}
- Local Authority: ${school.local_authority || 'Not set'}
- Phase: ${school.phase || 'Not set'}
- School type: ${school.type || 'Not set'}`;
  }

  if (knowledge && knowledge.length > 0) {
    context += `

Available school knowledge:
${knowledge.map(k => `- ${k.page_title} (${k.page_url})`).join('\n')}`;
  }

  return context;
}

/**
 * Generate follow-up suggestions
 */
function generateFollowUpSuggestions(message: string) {
  const suggestions = [];

  // Keyword-based suggestions
  if (message.toLowerCase().includes('safeguarding')) {
    suggestions.push('Would you like me to help you fill in the concern form?');
  }

  if (message.toLowerCase().includes('riddor')) {
    suggestions.push('Should I open the RIDDOR reporting portal for you?');
  }

  if (message.toLowerCase().includes('free school meals')) {
    suggestions.push('Do you need help with the eligibility criteria?');
  }

  return suggestions.slice(0, 3);
}

/**
 * Log question (anonymously) for analytics
 */
async function logQuestion(orgId: string, userId: string | null, question: string, answer: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase.from('ed_questions').insert({
    organization_id: orgId,
    user_id: userId,
    question,
    answer_preview: answer?.substring(0, 500),
    asked_at: new Date().toISOString(),
  });
}

/**
 * Search help knowledge
 */
async function searchHelp(query: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Search in website knowledge
  const { data: knowledge } = await supabase
    .from('ed_website_knowledge')
    .select('page_title, page_url, content')
    .textSearch('content', query)
    .limit(5);

  // Search in form templates
  const { data: templates } = await supabase
    .from('ed_form_templates')
    .select('form_key, form_name, description, form_category')
    .or('form_name.ilike.%keyword%,description.ilike.%keyword%')
    .limit(5);

  return NextResponse.json({
    knowledge: knowledge || [],
    templates: templates || [],
  });
}

/**
 * Helper: Get relative time string
 */
function getRelativeTimeString(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return 'Last week';
}
