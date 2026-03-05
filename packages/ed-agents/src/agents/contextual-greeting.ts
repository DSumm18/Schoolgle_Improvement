/**
 * Context-Aware Greeting System for Ed
 *
 * Provides personalized, context-aware greetings based on:
 * - User's authentication status
 * - Current page/screen they're on
 * - Active application/module
 * - Suggested actions based on context
 */

import type { AppContext } from '../types';

interface GreetingContext {
    isLoggedIn: boolean;
    userName?: string;
    userRole?: string;
    pageTitle?: string;
    pageUrl?: string;
    activeApp?: string;
    toolName?: string;
    toolCategory?: string;
}

interface GreetingSuggestions {
    icon: string;
    text: string;
    action?: string; // What the user could say/type
}

/**
 * Get context-aware greeting with suggestions
 */
export function getContextualGreeting(context: GreetingContext): {
    greeting: string;
    suggestions: GreetingSuggestions[];
} {
    const { isLoggedIn, userName, pageTitle, pageUrl, activeApp, toolName } = context;

    // Build suggestions based on context
    const suggestions: GreetingSuggestions[] = [];

    // Page-specific suggestions
    if (pageTitle) {
        if (pageTitle.toLowerCase().includes('staff')) {
            suggestions.push({
                icon: '👥',
                text: 'Add a staff member',
                action: 'Add teacher John Smith'
            }, {
                icon: '📋',
                text: 'View staff directory',
                action: 'Show all staff'
            });
        } else if (pageTitle.toLowerCase().includes('action') || pageTitle.toLowerCase().includes('improvement')) {
            suggestions.push({
                icon: '🎯',
                text: 'Create improvement action',
                action: 'Create action to improve maths'
            }, {
                icon: '💡',
                text: 'Get EEF strategy suggestion',
                action: 'Suggest EEF strategy for reading'
            });
        } else if (pageTitle.toLowerCase().includes('governance') || pageTitle.toLowerCase().includes('dashboard')) {
            suggestions.push({
                icon: '📊',
                text: 'View dashboard stats',
                action: 'What are our completion rates?'
            });
        }
    }

    // Add skill-based suggestions if logged in
    if (isLoggedIn) {
        suggestions.push({
            icon: '⚡',
            text: 'Ask about EEF strategies',
            action: 'What EEF strategies help with maths?'
        });
    }

    // Build greeting
    let greeting = '';

    if (!isLoggedIn) {
        // Not logged in - encourage login
        greeting = `Hi there! 👋

I'm **Ed**, your AI assistant for Schoolgle. I can help with:
• Staff directory management
• School improvement planning
• EEF research-backed strategies

**Log in** to access your school's data and I can help you with specific tasks.`;
    } else {
        const name = userName ? ` ${userName}` : '';

        if (pageTitle) {
            greeting = `Hi${name}! 👋

I can see you're on **${pageTitle}**.

How can I help here?`;
        } else {
            greeting = `Hi${name}! 👋

Ready to help! What can I do for you today?`;
        }

        // Add suggestions to greeting if available
        if (suggestions.length > 0) {
            greeting += '\n\n**Quick things I can help with:**';
            suggestions.forEach((s, i) => {
                greeting += `\n${i + 1}. ${s.icon} ${s.text}`;
                if (s.action) {
                    greeting += ` <em>"${s.action}"</em>`;
                }
            });
        }
    }

    return { greeting, suggestions };
}

/**
 * Get greeting for logged-in user (short version)
 */
export function getLoggedInGreeting(context: GreetingContext): string {
    const { userName, pageTitle } = context;
    const name = userName ? ` ${userName}` : '';

    if (pageTitle) {
        return `Hi${name}! 👋 I see you're on **${pageTitle}**. How can I help?`;
    }

    return `Hi${name}! 👋 What can I help you with?`;
}

/**
 * Enhanced work focus redirect with context awareness
 */
export function getContextualWorkRedirect(context: GreetingContext): string {
    const { isLoggedIn, userName, pageTitle } = context;
    const name = userName ? ` ${userName}` : '';

    // If logged in and on a specific page, provide contextual help
    if (isLoggedIn && pageTitle) {
        return `Hi${name}! 👋

I see you're on **${pageTitle}**.

**Things I can help you do here:**
`;
    }

    // Fallback to standard greeting for logged-in users
    if (isLoggedIn) {
        return `Hi${name}! 👋

I'm here to help! I can:
• **Manage staff** - Add team members, update roles
• **Create actions** - Track improvement goals
• **Get EEF strategies** - Research-backed recommendations
• **Answer questions** - About any school topic

What would you like to do?`;
    }

    // Fallback for logged out
    return `Hi! 👋

I'm **Ed**, your AI assistant for Schoolgle.

I can help with:
• School improvement planning
• Staff directory management
• EEF research-backed strategies
• Compliance and governance
• And much more...

**Log in** to access your school's data and I can help with specific tasks.`;
}

/**
 * Check if a greeting/introduction is needed (first message detection)
 */
export function isGreeting(query: string): boolean {
    const lowerQuery = query.toLowerCase().trim();

    // Explicit greetings
    const greetings = [
        'hi', 'hello', 'hey', 'good morning', 'good afternoon',
        'good evening', 'greetings', 'yo'
    ];

    // Check if query is ONLY a greeting (with optional whitespace/punctuation)
    const cleanedQuery = lowerQuery.replace(/[.,!?'"]/g, '').trim();

    if (greetings.includes(cleanedQuery)) {
        return true;
    }

    // Check if query is a greeting + nothing substantial
    if (cleanedQuery.length < 10 && greetings.some(g => cleanedQuery.includes(g))) {
        return true;
    }

    return false;
}

/**
 * Get friendly welcome message for logged-in users (platform-specific)
 */
export function getPlatformGreeting(
    userName?: string,
    organizationName?: string
): string {
    const name = userName || 'there';
    const org = organizationName ? ` at **${organizationName}**` : '';

    return `Hi ${name}! 👋

Welcome back to Schoolgle${org}.

I'm here to help you get things done. I can:
• **Create actions** - Track school improvement goals
• **Manage staff** - Add team members, update roles
• **Suggest EEF strategies** - Research-backed recommendations
• **Answer questions** - About any school topic

What would you like to work on today?`;
}

/**
 * Get suggestions based on current page/app
 */
export function getPageBasedSuggestions(pageTitle?: string, activeApp?: string): GreetingSuggestions[] {
    const suggestions: GreetingSuggestions[] = [];

    if (pageTitle) {
        const title = pageTitle.toLowerCase();

        // Staff/HR pages
        if (title.includes('staff') || title.includes('hr') || title.includes('people')) {
            suggestions.push({
                icon: '➕',
                text: 'Add a staff member',
                action: 'Add teacher John Smith'
            });
        }

        // Actions/Improvement pages
        if (title.includes('action') || title.includes('improvement') || title.includes('hub')) {
            suggestions.push({
                icon: '➕',
                text: 'Create improvement action',
                action: 'Create action to improve maths'
            });
        }

        // Dashboard pages
        if (title.includes('dashboard') || title.includes('governance')) {
            suggestions.push({
                icon: '📊',
                text: 'View summary stats',
                action: 'What needs attention?'
            });
        }
    }

    // Always available suggestions
    suggestions.push(
        {
            icon: '💡',
            text: 'Suggest an EEF strategy',
            action: 'Suggest EEF strategy for maths'
        },
        {
            icon: '❓',
            text: 'Ask a question',
            action: 'How do I mark attendance?'
        }
    );

    return suggestions;
}
