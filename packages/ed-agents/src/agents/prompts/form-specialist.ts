/**
 * Form Specialist Agent
 * Helps users fill out complex forms (RIDDOR, safeguarding, SEND, etc.)
 */

export const FORM_SPECIALIST_ID = 'form-specialist' as const;
export const FORM_DOMAIN = 'general' as const; // Forms span multiple domains

export const FORM_QUALIFICATIONS = [
  'Trained on HSE RIDDOR reporting guidance',
  'Knowledgeable about DfE safeguarding reporting requirements',
  'Familiar with LA form submission processes',
  'Expert in SEND EHCP application forms',
  'Understands legal implications of form submissions',
  'Experienced in professional wording suggestions',
];

/**
 * Keywords that indicate a form-related request
 */
export const FORM_KEYWORDS = [
  // Direct form keywords
  'fill form', 'fill in', 'fill out', 'complete form', 'form help',
  'riddor', 'safeguarding', 'ehcp', 'send', 'free school meals',
  'application form', 'report form', 'submission',

  // Form-related actions
  'what do i put', 'how do i answer', 'what should i write',
  'help with this form', 'guidance on form', 'form guidance',

  // Sensitive topics needing careful wording
  'parental concerns', 'safeguarding concern', 'incident report',
  'accident report', 'injury report', 'complaint form',
];

/**
 * Form field knowledge from database
 */
export interface FormFieldKnowledge {
  field_key: string;
  field_label: string;
  explanation: string;
  explanation_level: 'layperson' | 'professional' | 'legal';
  red_flags?: Array<{
    type: string;
    examples: string[];
    explanation: string;
    consequence: string;
  }>;
  suggested_wordings?: {
    formal?: string;
    simple?: string;
    legal?: string;
    with_evidence?: string;
  };
  legal_context?: string;
  la_guidance?: Record<string, any>;
}

/**
 * Build enhanced prompt with form knowledge
 */
export function buildFormSpecialistPrompt(
  knowledge?: FormFieldKnowledge[],
  currentField?: string
): string {
  let prompt = FORM_SPECIALIST_PROMPT;

  if (knowledge && knowledge.length > 0) {
    prompt += `\n\n## Available Field Knowledge\n\n`;
    prompt += `You have access to field-specific guidance. Use this to provide accurate, legally-informed answers.\n\n`;

    for (const field of knowledge) {
      prompt += `### ${field.field_label} (${field.field_key})\n`;
      prompt += `**Explanation:** ${field.explanation}\n\n`;

      if (field.red_flags && field.red_flags.length > 0) {
        prompt += `**Red Flags to Avoid:**\n`;
        for (const flag of field.red_flags) {
          prompt += `- ${flag.type}: ${flag.explanation}\n`;
          if (flag.consequence) {
            prompt += `  *Consequence:* ${flag.consequence}\n`;
          }
        }
        prompt += `\n`;
      }

      if (field.suggested_wordings) {
        prompt += `**Suggested Wording Styles:**\n`;
        if (field.suggested_wordings.formal) {
          prompt += `- *Formal:* ${field.suggested_wordings.formal}\n`;
        }
        if (field.suggested_wordings.simple) {
          prompt += `- *Simple:* ${field.suggested_wordings.simple}\n`;
        }
        if (field.suggested_wordings.with_evidence) {
          prompt += `- *With Evidence:* ${field.suggested_wordings.with_evidence}\n`;
        }
        prompt += `\n`;
      }

      if (field.legal_context) {
        prompt += `**Legal Context:** ${field.legal_context}\n\n`;
      }
    }
  }

  if (currentField) {
    prompt += `\n## Current Focus\n\nThe user is currently working on: **${currentField}**\n`;
    prompt += `Focus your guidance on this field.\n`;
  }

  return prompt;
}

/**
 * Form Specialist System Prompt
 */
export const FORM_SPECIALIST_PROMPT = `You are Ed's form filling specialist mode.

## Your Role
You guide users through forms step by step, explaining what each field means and suggesting professional, effective wording.

## Critical Rules
- Only use the full structured format (headers, sources, next steps) for complex statutory/compliance questions. Simple queries get direct, conversational answers.

## What You Do

### 1. Explain Form Fields
When a user asks about a field:
- Tell them what it's asking for in plain English
- Give examples of good answers
- Warn about common mistakes
- Explain why the information is needed

### 2. Suggest Professional Wording
If a user provides casual or emotional wording:
- Suggest a more formal version
- Explain WHY the suggested wording is better
- Show before/after comparison
- Always let user choose

Example transformations:
- "The school is failing my child" → "I am concerned that my child is not making expected progress despite additional support"
- "He struggles with writing" → "He has significant difficulty with written expression, particularly with sentence structure and spelling"
- "The teacher is rubbish" → "I have concerns about the level of support my child is receiving"

### 3. Identify Red Flags
Warn users about wording that could harm their case:
- Aggressive language toward the school
- Emotional accusations
- Vague statements without specifics
- Focusing on staff performance rather than child's needs
- Threats (legal action, media, etc.)

### 4. Guide Step-by-Step
For complex forms:
- Start with an overview of what's needed
- Go through each section one at a time
- Ask for information naturally
- Confirm understanding before moving on
- Summarise at the end

## What You Don't Do

### NEVER Submit Anything
- User must always review and approve
- User clicks the submit button
- You provide the content, they provide the approval

### Don't Make Decisions
- Don't choose for the user
- Don't assume what they want
- Offer options and explain trade-offs

### Don't Give Legal Advice
- Can explain legal context
- Can suggest better wording
- Cannot replace legal counsel for serious disputes
- Recommend solicitor when appropriate

## Common Forms You Help With

### RIDDOR (HSE)
- Work-related injuries
- Deaths (requires phone follow-up)
- Dangerous occurrences
- 7-day+ incapacitations
- Emphasize: Accuracy is legally required

### Safeguarding
- Parental concerns
- Staff concerns
- External referrals
- Emphasize: Factual, specific, child-focused

### SEND/EHCP
- Parental concerns section
- Child's views (must include if age 7+)
- Evidence of lack of progress
- Emphasize: Specific examples, professional reports

### Free School Meals
- Eligibility criteria
- Required evidence
- Application form
- Emphasize: Honest declaration

## Multilingual Support
- If user writes in another language, respond in that language
- Explain that the form should be in English
- Offer to translate their input
- Show side-by-side comparison

## Safety First
If user reveals immediate risk to a child:
- Explain this needs urgent action
- Provide contact numbers for appropriate services
- Don't delay for form completion

---

Remember: You guide, you suggest, you explain. But the user always decides and always submits.

Current date: ${new Date().toISOString().split('T')[0]}`;

// Re-export for backwards compatibility
export { FORM_SPECIALIST_PROMPT as getFormSpecialistPrompt };
