import type { EdContext } from '@schoolgle/shared';

/**
 * Build system prompt based on context
 */
export function buildSystemPrompt(context: EdContext): string {
  const basePrompt = `You are Ed, an AI school assistant created by Schoolgle.

PERSONALITY:
- Warm, supportive, and honest - like a trusted colleague
- Practical and action-oriented, not theoretical
- Use UK education terminology
- Acknowledge pressures on school staff
- Light humour is welcome but stay professional

EXPERTISE:
- Ofsted Education Inspection Framework (November 2025)
- SIAMS framework (for church schools)
- EEF Teaching & Learning Toolkit
- School improvement and self-evaluation
- UK school operations and compliance`;

  // Add product-specific context
  if (context.product === 'schoolgle-platform') {
    return basePrompt + `

CURRENT CONTEXT:
School: ${context.schoolName}
${context.schoolType ? `Type: ${context.schoolType}` : ''}
${context.isChurchSchool ? 'This is a church school (both Ofsted and SIAMS apply)' : ''}
${context.page ? `Current page: ${context.page}` : ''}
${context.category ? `Focus area: ${context.category}` : ''}

${buildSchoolgleContext(context)}

GUIDELINES:
- Always cite EEF research when making recommendations
- Link advice to specific Ofsted framework requirements
- Be specific and actionable (not generic advice)
- If you see evidence gaps, proactively suggest how to fill them
- If actions are overdue, gently remind without being pushy
- Celebrate progress and strengths`;
  }

  if (context.product === 'parent-chat') {
    return basePrompt + `

CURRENT CONTEXT:
School: ${context.schoolName}

GUIDELINES FOR PARENT QUERIES:
- Be friendly and welcoming
- Provide accurate school information
- If you don't know something, say so clearly
- Direct parents to contact school for specific queries
- Never make up information about the school`;
  }

  if (context.product === 'staff-tools') {
    return basePrompt + `

CURRENT CONTEXT:
Helping with: ${context.page || 'MIS system navigation'}
${context.screenshot ? 'Analyzing screenshot of school system' : ''}

GUIDELINES FOR STAFF SUPPORT:
- Provide step-by-step instructions
- Be patient and clear
- Explain why each step matters
- Offer shortcuts and tips
- If stuck, suggest contacting system support`;
  }

  return basePrompt;
}

/**
 * Build Schoolgle-specific context from platform data
 */
function buildSchoolgleContext(context: EdContext): string {
  if (!context.schoolgleContext) {
    return '';
  }

  const parts: string[] = [];

  // Health score
  if (context.schoolgleContext.healthScore !== undefined) {
    const score = context.schoolgleContext.healthScore;
    let status = 'good';
    if (score < 40) status = 'critical';
    else if (score < 60) status = 'at risk';
    else if (score < 75) status = 'neutral';

    parts.push(`School improvement health: ${score}/100 (${status})`);
  }

  // Evidence gaps
  if (context.schoolgleContext.gaps && context.schoolgleContext.gaps.length > 0) {
    parts.push(`\nEVIDENCE GAPS (${context.schoolgleContext.gaps.length}):`);
    context.schoolgleContext.gaps.slice(0, 5).forEach(gap => {
      parts.push(`- ${gap.area}/${gap.subcategory}: ${gap.description || 'Missing evidence'} [${gap.severity}]`);
    });
    if (context.schoolgleContext.gaps.length > 5) {
      parts.push(`  ... and ${context.schoolgleContext.gaps.length - 5} more`);
    }
  }

  // Recent activity
  if (context.schoolgleContext.recentActivity && context.schoolgleContext.recentActivity.length > 0) {
    parts.push(`\nRECENT ACTIVITY:`);
    context.schoolgleContext.recentActivity.slice(0, 3).forEach(activity => {
      parts.push(`- ${activity.type}: ${activity.summary}`);
    });
  }

  // Evidence summary
  if (context.schoolgleContext.evidenceSummary) {
    const summary = context.schoolgleContext.evidenceSummary;
    parts.push(`\nEVIDENCE SUMMARY:`);
    parts.push(`- Total documents scanned: ${summary.totalDocuments}`);
    parts.push(`- Evidence matches found: ${summary.evidenceMatches}`);
  }

  return parts.length > 0 ? '\n' + parts.join('\n') : '';
}
