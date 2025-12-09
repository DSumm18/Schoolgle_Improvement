# Skills Integration Plan

## Goal
Integrate Wave 1 skills into Ed's chatbot so they can be automatically triggered and used based on conversation context.

## Current Ed Architecture

```
User Query
    ↓
EdChatbot.tsx (UI)
    ↓
API Call to OpenRouter
    ↓
ModelRouter.ts (selects model)
    ↓
PromptBuilder.ts (builds system prompt)
    ↓
OpenRouter API (DeepSeek/Qwen/etc.)
    ↓
Response streamed back
```

**Current limitation**: No skill/tool system - Ed responds based on general knowledge and context, but can't call specialized skills.

## Integration Approach

### Phase 1: Skill Router (NEW Component)

Create a new component that sits between user query and model selection:

```typescript
// packages/ed-backend/lib/skill-router.ts

export class SkillRouter {
  /**
   * Analyze user query and determine if a skill should be activated
   */
  async routeToSkill(
    messages: Message[],
    context: EdContext
  ): Promise<{
    shouldUseSkill: boolean;
    skillName?: string;
    skillPrompt?: string;
    knowledgeBase?: string;
  }> {
    // Implementation
  }
}
```

**How it works**:
1. Analyze last user message for skill trigger keywords
2. Check conversation context (are they discussing PP, website compliance, governance?)
3. If skill match found, return specialized prompt + knowledge base
4. If no skill match, return `shouldUseSkill: false` and Ed proceeds normally

### Phase 2: Knowledge Base Injection

When skill is activated, inject the knowledge base into the system prompt:

```typescript
// packages/ed-backend/lib/prompt-builder.ts

export function buildSystemPrompt(
  context: EdContext,
  skillContext?: {
    skillName: string;
    skillPrompt: string;
    knowledgeBase: string;
  }
): string {
  const basePrompt = `You are Ed, an AI school assistant...`;

  if (skillContext) {
    // Inject skill-specific prompt and knowledge
    return `${basePrompt}

${skillContext.skillPrompt}

KNOWLEDGE BASE:
${skillContext.knowledgeBase}

Now respond to the user's query using this specialized knowledge.`;
  }

  return basePrompt;
}
```

### Phase 3: Skill Activation Flow

**New conversation flow**:

```
User Query
    ↓
SkillRouter.routeToSkill()
    ↓
    ├─ Skill Match Found?
    │   ├─ YES: Load skill prompt + knowledge base
    │   │       ↓
    │   │   Inject into system prompt
    │   │       ↓
    │   │   ModelRouter (select model - may prefer different model for skills)
    │   │       ↓
    │   │   OpenRouter API with enhanced prompt
    │   │       ↓
    │   │   Skill-enhanced response
    │   │
    │   └─ NO: Proceed with normal Ed prompt
    │           ↓
    │       ModelRouter (standard model selection)
    │           ↓
    │       Normal Ed response
```

## Implementation Steps

### Step 1: Create Skill Definitions

```typescript
// packages/ed-backend/lib/skills/skill-definitions.ts

export interface Skill {
  name: string;
  description: string;
  triggers: {
    keywords: string[];
    contexts: string[];
  };
  knowledgeBasePath: string;
  promptPath: string;
  preferredModel?: string; // Some skills may work better with specific models
}

export const AVAILABLE_SKILLS: Skill[] = [
  {
    name: 'pupil_premium_planner',
    description: 'Help schools plan evidence-based pupil premium spending',
    triggers: {
      keywords: ['pupil premium', 'PP spending', 'disadvantaged pupils', 'EEF', 'pupil premium strategy'],
      contexts: ['planning', 'budgeting', 'school improvement'],
    },
    knowledgeBasePath: 'skills-lab/knowledge/pupil-premium-eef-toolkit.md',
    promptPath: 'skills-lab/skills/pupil-premium-planner.ts', // Extract prompt from here
    preferredModel: 'deepseek/deepseek-chat', // Good at reasoning through evidence
  },
  {
    name: 'website_compliance_checker',
    description: 'Audit school websites and provide compliance fixes',
    triggers: {
      keywords: ['website', 'compliance', 'statutory', 'what must we publish', 'website audit', 'DfE requirements'],
      contexts: ['governance', 'compliance', 'website review'],
    },
    knowledgeBasePath: 'skills-lab/knowledge/website-compliance-requirements.md',
    promptPath: 'skills-lab/skills/website-compliance-checker.ts',
    preferredModel: 'deepseek/deepseek-chat',
  },
  {
    name: 'ht_report_generator',
    description: 'Help headteachers create structured governor reports',
    triggers: {
      keywords: ['headteacher report', 'HT report', 'report to governors', 'governor meeting', 'governance report'],
      contexts: ['governance', 'school leadership', 'reporting'],
    },
    knowledgeBasePath: 'skills-lab/knowledge/headteacher-report-templates.md',
    promptPath: 'skills-lab/skills/ht-report-generator.ts',
    preferredModel: 'deepseek/deepseek-chat', // Good at structured writing
  },
];
```

### Step 2: Implement Skill Router

```typescript
// packages/ed-backend/lib/skill-router.ts

import { AVAILABLE_SKILLS, type Skill } from './skills/skill-definitions';
import { readFile } from 'fs/promises';
import { join } from 'path';

export class SkillRouter {
  /**
   * Check if user query matches any skill triggers
   */
  private matchesSkill(query: string, skill: Skill): boolean {
    const lowerQuery = query.toLowerCase();

    // Check keyword matches
    const keywordMatch = skill.triggers.keywords.some(keyword =>
      lowerQuery.includes(keyword.toLowerCase())
    );

    return keywordMatch;
  }

  /**
   * Load knowledge base content
   */
  private async loadKnowledgeBase(path: string): Promise<string> {
    try {
      const fullPath = join(process.cwd(), path);
      const content = await readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Failed to load knowledge base: ${path}`, error);
      return '';
    }
  }

  /**
   * Extract skill prompt from TypeScript file
   */
  private async loadSkillPrompt(path: string): Promise<string> {
    try {
      const fullPath = join(process.cwd(), path);
      const content = await readFile(fullPath, 'utf-8');

      // Extract the exported prompt constant
      // Look for pattern: export const [skillName]Prompt = `...`
      const match = content.match(/export const \w+Prompt = `([\s\S]*?)`/);
      return match ? match[1] : '';
    } catch (error) {
      console.error(`Failed to load skill prompt: ${path}`, error);
      return '';
    }
  }

  /**
   * Route query to appropriate skill
   */
  async routeToSkill(
    messages: Message[],
    context: any
  ): Promise<{
    shouldUseSkill: boolean;
    skill?: Skill;
    skillPrompt?: string;
    knowledgeBase?: string;
  }> {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return { shouldUseSkill: false };
    }

    // Find matching skill
    const matchedSkill = AVAILABLE_SKILLS.find(skill =>
      this.matchesSkill(lastMessage.content, skill)
    );

    if (!matchedSkill) {
      return { shouldUseSkill: false };
    }

    // Load skill resources
    const [skillPrompt, knowledgeBase] = await Promise.all([
      this.loadSkillPrompt(matchedSkill.promptPath),
      this.loadKnowledgeBase(matchedSkill.knowledgeBasePath),
    ]);

    return {
      shouldUseSkill: true,
      skill: matchedSkill,
      skillPrompt,
      knowledgeBase,
    };
  }
}

export const skillRouter = new SkillRouter();
```

### Step 3: Update Model Router

Modify model router to consider skill preferences:

```typescript
// packages/ed-backend/lib/model-router.ts

import { skillRouter } from './skill-router';

export class ModelRouter {
  async route(
    messages: Message[],
    context: any = {}
  ): Promise<ModelRoutingDecision & { skillContext?: any }> {
    // Check if skill should be activated
    const skillRouting = await skillRouter.routeToSkill(messages, context);

    if (skillRouting.shouldUseSkill && skillRouting.skill) {
      // Use skill's preferred model if specified
      const model = skillRouting.skill.preferredModel || 'deepseek/deepseek-chat';

      return {
        taskType: 'skill_usage',
        selectedModel: {
          model,
          provider: 'openrouter',
          maxTokens: 3000, // Skills may need longer responses
          temperature: 0.7,
        },
        reason: `Using ${skillRouting.skill.name} skill`,
        estimatedCost: 0.0012,
        skillContext: {
          skillName: skillRouting.skill.name,
          skillPrompt: skillRouting.skillPrompt,
          knowledgeBase: skillRouting.knowledgeBase,
        },
      };
    }

    // Otherwise proceed with normal routing
    const taskType = this.determineTaskType(messages, context);
    // ... existing logic
  }
}
```

### Step 4: Update Prompt Builder

```typescript
// packages/ed-backend/lib/prompt-builder.ts

export function buildSystemPrompt(
  context: EdContext,
  skillContext?: {
    skillName: string;
    skillPrompt: string;
    knowledgeBase: string;
  }
): string {
  const basePrompt = `You are Ed, an AI school assistant created by Schoolgle.

PERSONALITY:
- Warm, supportive, and honest - like a trusted colleague
- Practical and action-oriented, not theoretical
- Use UK education terminology
`;

  // If skill activated, inject skill-specific knowledge
  if (skillContext) {
    return `${basePrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 SKILL ACTIVATED: ${skillContext.skillName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${skillContext.skillPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 KNOWLEDGE BASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${skillContext.knowledgeBase}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now respond to the user's query using this specialized knowledge and skill guidance.`;
  }

  // Standard prompt for non-skill queries
  return basePrompt + `
GUIDELINES:
- Be specific and actionable (not generic advice)
- Cite evidence when making recommendations
- If you don't know something, say so clearly`;
}
```

### Step 5: Update Chat Handler

```typescript
// packages/ed-backend/lib/chat.ts

export async function chat(messages: Message[], context: EdContext) {
  // Route to model (which now checks for skills)
  const routing = await modelRouter.route(messages, context);

  // Build prompt (injecting skill context if present)
  const systemPrompt = buildSystemPrompt(context, routing.skillContext);

  // Make API call with enhanced prompt
  const response = await openRouterClient.chat({
    model: routing.selectedModel.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: routing.selectedModel.temperature,
    max_tokens: routing.selectedModel.maxTokens,
  });

  return response;
}
```

## Testing Strategy

### Unit Tests

```typescript
// packages/ed-backend/lib/skill-router.test.ts

describe('SkillRouter', () => {
  it('should activate pupil_premium_planner for PP queries', async () => {
    const messages = [
      { role: 'user', content: 'How should I spend my pupil premium budget?' }
    ];

    const result = await skillRouter.routeToSkill(messages, {});

    expect(result.shouldUseSkill).toBe(true);
    expect(result.skill?.name).toBe('pupil_premium_planner');
    expect(result.knowledgeBase).toContain('EEF');
  });

  it('should not activate skills for general queries', async () => {
    const messages = [
      { role: 'user', content: 'What is the capital of France?' }
    ];

    const result = await skillRouter.routeToSkill(messages, {});

    expect(result.shouldUseSkill).toBe(false);
  });
});
```

### Integration Tests

Test full conversation flow with skill activation:

```typescript
// Test: Pupil Premium conversation
const conversation = [
  { role: 'user', content: 'We have £50k pupil premium. What should we spend it on?' },
];

const response = await chat(conversation, { product: 'schoolgle-platform' });

// Should reference EEF evidence
expect(response).toContain('EEF');
expect(response).toContain('feedback');
expect(response).toContain('metacognition');
```

## Deployment Phases

### Phase 1: Skills Lab Only (✅ COMPLETE)
- Knowledge bases created
- Skill prototypes defined
- Example conversations documented
- **Status**: Done

### Phase 2: Backend Integration (NEXT)
- Implement SkillRouter
- Update ModelRouter
- Update PromptBuilder
- Add skill definitions
- **Timeline**: 1-2 days

### Phase 3: Testing
- Unit tests for skill routing
- Integration tests for conversations
- Manual testing with example queries
- **Timeline**: 1 day

### Phase 4: UI Enhancement (Optional)
- Show skill activation in UI
- "Ed is using: Pupil Premium Planning skill"
- Display confidence/reasoning
- **Timeline**: 1 day

### Phase 5: Wave 2 Skills
- Add finance navigator skills
- Add IT helpdesk skill
- Expand knowledge bases
- **Timeline**: 2-3 days

## Success Criteria

✅ **Skill activation works**: When user mentions "pupil premium", PP skill activates
✅ **Knowledge injection works**: Responses cite EEF evidence accurately
✅ **Fallback works**: Non-skill queries work as before
✅ **Quality improvement**: Skill responses demonstrably better than general Ed
✅ **Performance acceptable**: Skill activation adds <500ms latency

## Monitoring

Track skill usage to understand value:

```typescript
// Analytics to add
{
  skillActivated: string | null,
  responseQuality: 'helpful' | 'not_helpful', // User feedback
  conversationLength: number,
  skillRelevance: boolean, // Did user continue with skill topic?
}
```

## Future Enhancements

1. **Multi-skill conversations**: Allow multiple skills in one conversation
2. **Skill handoffs**: "This sounds like a finance question - let me activate Finance Navigator skill"
3. **User skill selection**: "Which area would you like help with? [PP Planning] [Website Compliance] [Governor Reports]"
4. **Skill learning**: Update knowledge bases based on new guidance (auto-refresh from DfE/EEF)
5. **Custom school skills**: Schools can define their own knowledge bases

## Next Steps

1. ✅ Complete Wave 1 skills documentation (DONE)
2. 🔄 Implement SkillRouter (NEXT - do this now)
3. 🔄 Update ModelRouter to use SkillRouter
4. 🔄 Update PromptBuilder to inject skill context
5. 🔄 Test with example conversations
6. 🔄 Deploy to platform
7. 🔄 Monitor usage and iterate

---

**Ready to implement?** The foundation is solid - let's build the integration next!
