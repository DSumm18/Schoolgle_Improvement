# Schoolgle App Development & Skills Framework

**Version:** 1.0
**Date:** 2026-01-23
**Purpose:** Comprehensive methodology for developing applications with embedded AI skills expertise

---

## Executive Summary

This framework defines a **dual-track development methodology** where applications and their supporting AI skills are developed together. Every application must have corresponding AI skills that provide expert guidance, validate user actions, and bridge knowledge gaps.

**Core Principle:** Applications are not just software tools - they are **knowledge delivery systems** that make users experts in their domain.

---

## Table of Contents

1. [Development Process Overview](#development-process-overview)
2. [Phase 1: Discovery & Research](#phase-1-discovery--research)
3. [Phase 2: Requirements & Features](#phase-2-requirements--features)
4. [Phase 3: Skills Architecture](#phase-3-skills-architecture)
5. [Phase 4: Application Development](#phase-4-application-development)
6. [Phase 5: Skills Development](#phase-5-skills-development)
7. [Phase 6: Integration & Testing](#phase-6-integration--testing)
8. [Phase 7: Validation & Launch](#phase-7-validation--launch)
9. [Quality Gates](#quality-gates)
10. [Deliverables Checklist](#deliverables-checklist)

---

## Development Process Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCHOOLGLE APP DEVELOPMENT LIFECYCLE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1          PHASE 2          PHASE 3          PHASE 4                │
│  Discovery      Requirements    Skills         Application                 │
│  & Research      & Features     Architecture      Development               │
│      │              │              │                 │                       │
│      ▼              ▼              ▼                 ▼                       │
│  ┌────────┐    ┌────────┐    ┌────────┐      ┌─────────────┐              │
│  │Market  │    │Feature │    │Domain  │      │   UI/UX     │              │
│  │Research│───▶│Mapping │───▶│Mapping │───▶  │   Design     │              │
│  │Competi │    │User    │    │Skill   │      │   Frontend   │              │
│  │Analysis│    │Stories │    │Needs   │      │   Backend    │              │
│  │Source  │    │Data    │    │Expert  │      │   Database   │              │
│  │Review  │    │Model   │    │Areas   │      │   API        │              │
│  └────────┘    └────────┘    └────────┘      └─────────────┘              │
│      │              │              │                 │                       │
│      └──────────────┴──────────────┴─────────────────┘                       │
│                              │                                               │
│                              ▼                                               │
│  PHASE 5          PHASE 6          PHASE 7                                   │
│  Skills        Integration     Validation                                   │
│  Development    & Testing     & Launch                                      │
│      │              │              │                                         │
│      ▼              ▼              ▼                                         │
│  ┌────────┐    ┌────────┐    ┌────────┐                                    │
│  │Knowledge│    │E2E     │    │Beta    │                                    │
│  │Pack    │    │Tests   │    │Trial   │                                    │
│  │Build   │    │Skills  │    │User    │                                    │
│  │MCP     │    │Orchest │    │Feedback│                                    │
│  │Tools   │    │Perf    │    │Iterate │                                    │
│  │Flows   │    │Tests   │    │Launch  │                                    │
│  └────────┘    └────────┘    └────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Discovery & Research

### Objective
Understand the market landscape, regulatory requirements, and user needs to inform both application features and AI skill requirements.

### 1.1 Market Research & Competitive Analysis

**Research Top 3-5 Market Leaders**

| Provider | Strengths | Weaknesses | Unique Features | Key Learnings |
|----------|-----------|------------|-----------------|---------------|
| Provider A | | | | |
| Provider B | | | | |
| Provider C | | | | |

**Analysis Dimensions:**

1. **Feature Matrix**
   - Core functionality checklist
   - Advanced features comparison
   - Integration capabilities
   - Reporting & analytics
   - Mobile accessibility

2. **User Experience**
   - Navigation patterns
   - Information architecture
   - Task completion flows
   - Accessibility standards
   - Mobile responsiveness

3. **Domain Expertise**
   - Built-in guidance
   - Validation rules
   - Compliance checks
   - Knowledge base quality
   - Training materials

4. **Technical Architecture**
   - Deployment model
   - API availability
   - Data export capabilities
   - Integration options

**Deliverable:** `docs/modules/{module}/market-research.md`

### 1.2 Regulatory & Standards Research

**Identify Applicable Regulations:**

| Regulation | Scope | Requirements | Source URL | Last Updated |
|------------|-------|--------------|------------|--------------|
| | | | | |

**Key Questions:**
- What statutory requirements exist?
- What are the consequences of non-compliance?
- What guidance documents exist?
- What are common failure points?
- What qualifications/certifications are required?

**Deliverable:** `docs/modules/{module}/regulatory-compliance.md`

### 1.3 User Research

**Target Personas:**

```
Persona Template:
├── Name & Role
├── Organization Context
├── Technical Proficiency
├── Domain Knowledge Level
├── Key Responsibilities
├── Pain Points
├── Goals & Success Criteria
└── Typical Workflows
```

**Interview Questions:**
- What does your current process look like?
- What are the biggest challenges?
- What would make your life easier?
- What do you wish you knew but don't?
- When do you feel uncertain or need help?

**Deliverable:** `docs/modules/{module}/user-personas.md`

---

## Phase 2: Requirements & Features

### Objective
Synthesize research into a comprehensive feature set and user stories that drive both application development and AI skill creation.

### 2.1 Feature Synthesis

**Combine Best Features from Competitors:**

| Feature Area | Provider A | Provider B | Provider C | Schoolgle Enhancement |
|--------------|------------|------------|------------|----------------------|
| | | | | |
| | | | | |

**Schoolgle Differentiators:**
- What will we do better?
- What are competitors missing?
- What unique value do we add?

**Deliverable:** `docs/modules/{module}/feature-matrix.md`

### 2.2 User Stories

**Template:**

```markdown
### US-XXX: [Feature Name]

**As a** [persona]
**I want** [capability]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

**Associated Skills:**
- Domain knowledge required
- Validation rules needed
- Guidance points

**Priority:** High/Medium/Low
**Module:** [Sub-module]
**Dependencies:** [Related stories]
```

**Deliverable:** `docs/modules/{module}/user-stories.md`

### 2.3 Data Model

**Entities & Relationships:**

```typescript
// Example: Estates Compliance
interface ComplianceCheck {
  id: string;
  type: ComplianceType;  // legionella, fire, asbestos, etc.
  frequency: CheckFrequency;
  status: CheckStatus;
  scheduledDate: Date;
  completedDate?: Date;
  completedBy?: string;
  qualifications?: string[];  // Required qualifications
  findings: Finding[];
  evidence: Evidence[];
  nextDueDate: Date;
  complianceLevel: 'compliant' | 'partial' | 'non-compliant' | 'overdue';
}

interface ComplianceType {
  id: string;
  name: string;
  category: ComplianceCategory;
  regulatoryReference: string[];
  requiredQualifications: string[];
  guidanceNotes: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}
```

**Deliverable:** `docs/modules/{module}/data-model.md`

---

## Phase 3: Skills Architecture

### Objective
Define the AI skills needed to support users throughout the application, identifying domain expertise, validation requirements, and guidance opportunities.

### 3.1 Domain Mapping

**Break Down Module into Knowledge Domains:**

```
Estates Compliance Module:
├── Domain: Legionella Management
│   ├── Knowledge: HSE L8, HSE ACoP L8, school-specific guidance
│   ├── Skills: Risk assessment, monitoring schedules, compliance validation
│   ├── Validation: Authorized person check, temperature limits, recording requirements
│   └── Guidance: Weekly flush procedures, monthly inspection criteria, annual review
│
├── Domain: Fire Safety
│   ├── Knowledge: Regulatory Reform Order 2005, BS5839, school-specific guidance
│   ├── Skills: Risk assessment, alarm testing, emergency lighting
│   ├── Validation: Competent person check, test frequencies
│   └── Guidance: Weekly test procedures, monthly checks, annual inspection
│
├── Domain: Asbestos Management
│   ├── Knowledge: CAR 2012, duty to manage, survey types
│   ├── Skills: Register management, emergency procedures
│   ├── Validation: Licensed contractor check, re-inspection intervals
│   └── Guidance: What to do if damaged, who to contact
│
└── Domain: Electrical & Mechanical
    ├── Knowledge: Electricity at Work Regulations, GFPA, TM44
    ├── Skills: Inspection scheduling, remediation tracking
    ├── Validation: Competent person requirements
    └── Guidance: Test frequencies, common issues
```

**Deliverable:** `docs/modules/{module}/domain-mapping.md`

### 3.2 Skill Needs Analysis

**For Each Domain, Identify:**

1. **Expert Questions Users Ask:**
   - "Do I need to be qualified to do this check?"
   - "What temperature should the water be?"
   - "How often do I need to flush this outlet?"
   - "What if I find an issue?"

2. **Common Mistakes:**
   - Unqualified person completing checks
   - Incorrect recording
   - Missed deadlines
   - Incomplete risk assessments

3. **Validation Points:**
   - Is this person authorized?
   - Are the readings within limits?
   - Was this done on time?
   - Is all evidence captured?

4. **Guidance Opportunities:**
   - Before starting: "You'll need these qualifications..."
   - During process: "The temperature should be..."
   - After completion: "Don't forget to..."
   - On findings: "This reading indicates..."

**Deliverable:** `docs/modules/{module}/skill-needs.md`

### 3.3 Skill Package Structure

**Define Required Skills:**

```
packages/skills-estates-compliance/
├── packages/
│   ├── skill-legionella/
│   │   ├── src/
│   │   │   ├── tools/          # MCP tools
│   │   │   │   ├── legionella-guidance.ts
│   │   │   │   ├── legionella-validate.ts
│   │   │   │   └── legionella-fill-check.ts
│   │   │   ├── conversation/   # Dialogue flows
│   │   │   │   ├── weekly-flush-intake.ts
│   │   │   │   ├── monthly-inspection-intake.ts
│   │   │   │   └── issue-reporting-intake.ts
│   │   │   └── knowledge/      # Structured knowledge
│   │   │       ├── temperature-limits.ts
│   │   │       ├── flush-procedures.ts
│   │   │       ├── risk-assessment.ts
│   │   │       └── qualifications.ts
│   │   ├── knowledge-pack/     # Deterministic knowledge
│   │   │   ├── hse-l8-pack.ts
│   │   │   └── rules/
│   │   │       ├── weekly-flush.md
│   │   │       ├── monthly-inspection.md
│   │   │       ├── temperature-limits.md
│   │   │       └── qualifications.md
│   │   └── skill-metadata.ts   # Skill definition
│   │
│   ├── skill-fire-safety/
│   ├── skill-asbestos/
│   └── skill-em/
│
├── skill-orchestrator/         # Coordinates multiple skills
│   ├── src/
│   │   ├── skill-router.ts
│   │   ├── intent-classifier.ts
│   │   └── response-synthesizer.ts
│   └── skill-registry.ts
│
└── shared/
    ├── types.ts
    └── utils.ts
```

**Deliverable:** `packages/skills-estates-compliance/README.md`

---

## Phase 4: Application Development

### Objective
Build the application with embedded hooks for AI skills throughout the user journey.

### 4.1 Information Architecture

**Site Map & Navigation:**

```
Estates Compliance App:
├── Dashboard
│   ├── Overview (compliance status, upcoming tasks)
│   ├── Alerts & Reminders
│   └── Quick Actions
│
├── Compliance Areas
│   ├── Legionella Management
│   │   ├── Weekly Flush Tasks
│   │   ├── Monthly Inspections
│   │   ├── Annual Reviews
│   │   └── Risk Assessments
│   │
│   ├── Fire Safety
│   │   ├── Weekly Alarm Tests
│   │   ├── Monthly Equipment Checks
│   │   ├── Emergency Lighting
│   │   └── Fire Risk Assessment
│   │
│   ├── Asbestos Management
│   │   ├── Asbestos Register
│   │   ├── Survey Management
│   │   ├── Remediation Tracking
│   │   └── Annual Re-inspection
│   │
│   └── Electrical & Mechanical
│       ├── Inspection Schedules
│       ├── Test Results
│       └── Remediation Works
│
├── Reports
│   ├── Compliance Status
│   ├── Audit Trail
│   ├── Findings & Actions
│   └── Certificate Generation
│
└── Settings
    ├── Team & Permissions
    ├── Schedule Configuration
    └── Integrations
```

**Deliverable:** `docs/modules/{module}/information-architecture.md`

### 4.2 Screen Design

**Screen Template:**

```markdown
### [Screen Name]

**Purpose:**
**User Persona:**
**Entry Point:**

**Layout:**
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
├─────────────────┬───────────────────────────────────────────┤
│ Navigation      │ Main Content                             │
│                 │                                           │
│ - Link 1        │ ┌─────────────────────────────────────┐  │
│ - Link 2        │ │ Page Title                          │  │
│ - Link 3        │ │ [Ed AI Assistant Button]            │  │
│                 │ ├─────────────────────────────────────┤  │
│                 │ │                                     │  │
│                 │ │ [Content]                          │  │
│                 │ │                                     │  │
│                 │ │                                     │  │
│                 │ └─────────────────────────────────────┘  │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘

**Key Components:**
- Header: Navigation, notifications, profile
- Left Nav: Module navigation
- Main Content: Task/record details
- Ed Button: Always present, context-aware

**Ed Integration Points:**
1. [ ] Initial guidance on screen load
2. [ ] Field validation with explanations
3. [ ] Progress tracking with tips
4. [ ] Completion checklist
5. [ ] "What if?" scenarios

**Accessibility:**
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance
```

**Deliverable:** `apps/{module}/src/screens/[screen]/design.md`

### 4.3 Component Development

**Standard Components:**

```typescript
// Example: Compliance Task Card
interface ComplianceTaskCardProps {
  task: ComplianceTask;
  onStatusChange: (status: TaskStatus) => void;
  edSkillContext: SkillContext;  // Passed to Ed for context
}

// Always includes Ed guidance button
// Always has validation hooks
// Always tracks user journey for learning
```

**Deliverable:** Component library in `apps/{module}/src/components/`

### 4.4 API Development

**Endpoints with Skill Integration:**

```typescript
// Example API
GET    /api/compliance/tasks                    // List tasks
POST   /api/compliance/tasks/:id/complete       // Complete task
POST   /api/compliance/tasks/:id/validate       // Validate with Ed
GET    /api/compliance/guidance/:domain/:topic  // Get guidance
POST   /api/compliance/chat                      // Chat with Ed
```

**Deliverable:** `apps/{module}/src/app/api/`

---

## Phase 5: Skills Development

### Objective
Build the AI skills that provide expert guidance, validation, and support throughout the application.

### 5.1 Knowledge Pack Creation

**Process:**

1. **Source Research**
   - Read official guidance documents
   - Identify key requirements
   - Extract critical rules
   - Note common misunderstandings

2. **Knowledge Structuring**
   ```typescript
   // Example: Legionella Knowledge Pack
   export const LEGIONELLA_PACK: KnowledgePack = {
     id: 'legionella-hse-l8-v1',
     domain: 'estates',
     title: 'HSE L8 - Legionnaires\' Disease',
     version: '1.0',
     effective_date: '2024-11-01',  // HSE L8 4th edition
     review_by_date: '2025-11-01',
     confidence_level: 'high',
     source_url: 'https://www.hse.gov.uk/pubns/books/l8.htm',
   };
   ```

3. **Rule Definition**
   ```typescript
   export const LEGIONELLA_RULES: Rule[] = [
     {
       id: 'legionella-weekly-flush-requirement',
       pack_id: LEGIONELLA_PACK.id,
       topic: 'weekly_flush',
       applies_when_text: 'outlet has not been used for 7 days',
       applies_when_predicate: {
         field: 'days_since_last_use',
         operator: '>=',
         value: 7
       },
       content: 'Outlets that have not been used for 7 days must be flushed weekly. Run for 5 minutes or until temperature stabilizes.',
       citations: [{
         source: 'HSE L8',
         section: 'Paragraph 67',
         authority_level: 'statutory'
       }],
       authority_level: 'statutory'
     },
     {
       id: 'legionella-temperature-limits-cold',
       pack_id: LEGIONELLA_PACK.id,
       topic: 'temperature_limits',
       applies_when_text: 'measuring cold water outlet temperature',
       content: 'Cold water outlets should be below 20°C after running for 2 minutes. Readings above 20°C indicate potential bacterial growth.',
       citations: [{
         source: 'HSE L8',
         section: 'Paragraph 154',
         authority_level: 'statutory'
       }],
       authority_level: 'statutory'
     }
   ];
   ```

4. **Question Flows**
   ```typescript
   export const WEEKLY_FLUSH_INTAKE = {
     initial_question: 'Which outlet are you flushing today?',
     field: 'outlet_id',
     type: 'autocomplete',
     source: 'outlets_needing_flush',

     follow_up: [
       {
         field: 'last_used_date',
         question: 'When was this outlet last used?',
         type: 'date',
         validation: (value) => {
           const days = differenceInDays(new Date(), value);
           if (days < 7) {
             return {
               valid: false,
               message: 'This outlet was used ' + days + ' days ago. Weekly flush is only required after 7+ days of non-use.',
               guidance: 'You can mark this as complete without flushing.'
             };
           }
           return { valid: true };
         }
       },
       {
         field: 'temperature_reading',
         question: 'What is the water temperature after running for 2 minutes?',
         type: 'number',
         unit: '°C',
         validation: {
           min: 0,
           max: 100
         },
         guidance: (value) => {
           if (value > 20) {
             return {
               level: 'warning',
               message: 'Temperature above 20°C. This may indicate bacterial growth.',
               action: 'Consider recording this as a finding for investigation.'
             };
           }
           return {
             level: 'success',
             message: 'Temperature within acceptable limits.'
           };
         }
       },
       {
         field: 'flushed_for_minutes',
         question: 'How long did you flush the outlet?',
         type: 'number',
         unit: 'minutes',
         validation: {
           min: 5,
           message: 'Outlet must be flushed for minimum 5 minutes.'
         }
       },
       {
         field: 'completer_qualification',
         question: 'Are you the appointed responsible person?',
         type: 'enum',
         options: ['yes_responsible_person', 'no_delegated', 'no_contractor'],
         follow_up: {
           'no_delegated': {
             field: 'responsible_person_name',
             question: 'Who is the responsible person that delegated this task?',
             validation: 'Must match an appointed responsible person on record.',
             on_mismatch: 'You are not authorized to complete this check. Only the appointed responsible person or their delegate can complete compliance checks.'
           }
         }
       }
     ]
   };
   ```

**Deliverable:** `packages/skills-{module}/src/knowledge/`

### 5.2 MCP Tool Development

**Tool Template:**

```typescript
// packages/skills-estates-compliance/skill-legionella/src/tools/legionella-guidance.ts

export const LEGIONELLA_GUIDANCE_TOOL: MCPTool = {
  name: 'legionella_guidance',
  description: 'Expert guidance on Legionella management in UK schools. Covers HSE L8 requirements, temperature monitoring, flushing procedures, and compliance validation.',
  category: 'compliance',
  domain: 'legionella',

  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        enum: ['weekly_flush', 'monthly_inspection', 'temperature_limits', 'qualifications', 'risk_assessment'],
        description: 'Topic requiring guidance'
      },
      question: {
        type: 'string',
        description: 'Specific question'
      },
      context: {
        type: 'object',
        properties: {
          outlet_type: { type: 'string' },
          days_since_last_use: { type: 'number' },
          temperature_reading: { type: 'number' },
          user_role: { type: 'string' }
        }
      }
    }
  },

  handler: async (inputs, context) => {
    // 1. Check knowledge pack for deterministic answers
    const packRules = await consultLegionellaPack(inputs.topic, inputs.context);

    if (packRules.length > 0) {
      return {
        answer: synthesizeRules(packRules),
        sources: packRules.map(r => r.citations).flat(),
        confidence: 'high',
        requires_action: identifyActions(packRules)
      };
    }

    // 2. If no deterministic answer, use LLM with knowledge pack as context
    const relevantKnowledge = await getRelevantKnowledge(inputs.topic);
    const answer = await askLLMWithKnowledge(inputs.question, relevantKnowledge);

    return {
      answer,
      sources: relevantKnowledge.citations,
      confidence: 'medium',
      advisory: 'Please verify with official HSE guidance.'
    };
  }
};
```

**Deliverable:** `packages/skills-{module}/src/tools/`

### 5.3 Conversation Flow Development

**Flow Template:**

```typescript
// packages/skills-estates-compliance/skill-legionella/src/conversation/weekly-flush-intake.ts

export const WEEKLY_FLUSH_FLOW: ConversationFlow = {
  trigger: {
    keywords: ['flush', 'weekly', 'outlet', 'legionella'],
    context: 'task_completion'
  },

  steps: [
    {
      id: 'identify_outlet',
      type: 'question',
      template: WEEKLY_FLUSH_INTAKE,
      on_answer: (data) => {
        // Validate and potentially skip if < 7 days
        if (data.days_since_last_use < 7) {
          return {
            next_step: 'confirm_skip',
            message: 'This outlet was used ' + data.days_since_last_use + ' days ago. Weekly flush is not required yet.'
          };
        }
        return { next_step: 'check_temperature' };
      }
    },
    {
      id: 'check_temperature',
      type: 'question',
      field: 'temperature_reading',
      on_answer: (data) => {
        if (data.temperature_reading > 20) {
          return {
            next_step: 'record_finding',
            alert: {
              level: 'warning',
              message: 'Temperature above 20°C requires investigation',
              guidance: 'This should be recorded as a finding and may require remedial action.'
            }
          };
        }
        return { next_step: 'confirm_flush_duration' };
      }
    },
    {
      id: 'confirm_flush_duration',
      type: 'question',
      field: 'flushed_for_minutes',
      validation: {
        min: 5,
        message: 'Minimum 5 minutes flushing required'
      }
    },
    {
      id: 'verify_authorization',
      type: 'question',
      field: 'completer_qualification',
      validation: 'authorized_person_check',
      on_failure: {
        message: 'Only the appointed responsible person or their delegate can complete compliance checks.',
        action: 'prevent_completion',
        guidance: 'Please contact your responsible person to complete this check.'
      }
    },
    {
      id: 'complete',
      type: 'completion',
      summary: (data) => ({
        message: 'Weekly flush completed for ' + data.outlet_id,
        findings: data.temperature_reading > 20 ? generate_finding(data) : [],
        next_due: calculate_next_due_date()
      }),
      follow_up_actions: [
        'Update risk assessment if findings',
        'Schedule next flush',
        'Report any issues'
      ]
    }
  ]
};
```

**Deliverable:** `packages/skills-{module}/src/conversation/`

---

## Phase 6: Integration & Testing

### Objective
Integrate the application with AI skills and test end-to-end functionality.

### 6.1 Skill Integration Points

**Application → Skill Communication:**

```typescript
// Example: React component with Ed integration
export function WeeklyFlushTask({ task }: { task: ComplianceTask }) {
  const [edContext, setEdContext] = useState<SkillContext>({
    domain: 'legionella',
    topic: 'weekly_flush',
    taskType: 'compliance_check',
    userContext: {
      role: user.role,
      qualifications: user.qualifications,
      organization: user.orgId
    }
  });

  return (
    <div>
      {/* Ed always available */}
      <EdAssistant
        context={edContext}
        onValidate={handleEdValidation}
        onGuidance={handleEdGuidance}
      />

      <TaskForm
        task={task}
        onFieldChange={(field, value) => {
          // Real-time validation via Ed
          validateWithEd(field, value, edContext);
        }}
      />
    </div>
  );
}
```

**Deliverable:** Integrated components with Ed hooks

### 6.2 Testing Strategy

**Test Levels:**

1. **Unit Tests**
   - Knowledge pack rule matching
   - Tool input/output validation
   - Conversation flow transitions

2. **Integration Tests**
   - App → Skill communication
   - Multi-skill orchestration
   - Database operations

3. **E2E Tests**
   - Complete user journeys
   - Ed guidance throughout
   - Validation at each step

4. **Knowledge Validation**
   - Expert review of content
   - Source citation accuracy
   - Guidance clarity

**Test Scenarios:**

```gherkin
Scenario: Weekly flush with normal temperature
  Given I am a delegated responsible person
  And I am completing a weekly flush task for outlet "Classroom 1 Sink"
  And this outlet was last used 10 days ago
  When I start the task
  Then Ed should ask me to identify the outlet
  And I should select "Classroom 1 Sink"
  And Ed should ask for the temperature reading
  And I enter "18°C"
  And Ed should confirm this is within limits
  And Ed should ask how long I flushed for
  And I enter "5 minutes"
  And Ed should verify my authorization
  And I confirm I am delegated by the responsible person
  Then Ed should allow completion
  And the task should be marked complete
  And the next flush should be scheduled for 7 days later

Scenario: Weekly flush with high temperature finding
  Given I am completing a weekly flush task
  And I record a temperature of "25°C"
  Then Ed should warn me this is above 20°C limit
  And Ed should ask if I want to record this as a finding
  And I confirm
  Then Ed should create a finding record
  And Ed should suggest next steps
  And Ed should allow task completion
  And the finding should be flagged for review

Scenario: Unauthorized completion attempt
  Given I am NOT a delegated responsible person
  And I attempt to complete a weekly flush task
  When Ed asks for my qualification
  And I indicate I am not authorized
  Then Ed should prevent completion
  And Ed should explain who can complete this check
  And Ed should offer to notify the responsible person
```

**Deliverable:** Test suites in `apps/{module}/__tests__/` and `packages/skills-{module}/__tests__/`

### 6.3 Performance Testing

**Metrics:**
- Knowledge retrieval latency: < 100ms
- LLM response time: < 2s
- Skill orchestration: < 500ms
- End-to-end task completion: < 30s

**Deliverable:** Performance benchmarks

---

## Phase 7: Validation & Launch

### Objective
Validate with real users, refine based on feedback, and prepare for launch.

### 7.1 Beta Testing

**Beta Program:**

| School | Type | User Count | Test Period | Feedback |
|--------|------|------------|-------------|----------|
| | | | | |

**Feedback Collection:**

1. **In-App Feedback**
   - Rate Ed's helpfulness
   - Report incorrect guidance
   - Suggest improvements

2. **Weekly Check-ins**
   - User experience interviews
   - Pain point identification
   - Feature usage analysis

3. **Knowledge Validation**
   - Expert review of guidance
   - Citation accuracy checks
   - Completeness assessment

**Deliverable:** Beta test report with findings

### 7.2 Launch Readiness Checklist

**Application:**
- [ ] All features working
- [ ] UI/UX polished
- [ ] Accessibility verified
- [ ] Performance benchmarks met
- [ ] Security review complete
- [ ] Data backup configured

**AI Skills:**
- [ ] Knowledge packs validated by experts
- [ ] All citations accurate
- [ ] Conversation flows tested
- [ ] Validation rules working
- [ ] Multi-language ready (if applicable)
- [ ] Error handling robust

**Documentation:**
- [ ] User guides created
- [ ] Admin documentation complete
- [ ] API documentation published
- [ ] Knowledge sources documented
- [ ] Training materials ready

**Support:**
- [ ] Support team trained
- [ ] Help desk articles written
- [ ] Escalation process defined
- [ ] Feedback loop established

**Deliverable:** Launch readiness report

---

## Quality Gates

### Gate 1: Research Completion (After Phase 1)

**Criteria:**
- [ ] Top 3-5 competitors analyzed
- [ ] All regulatory requirements documented
- [ ] User personas defined
- [ ] Pain points identified
- [ ] Knowledge sources verified

**Approver:** Product Owner

### Gate 2: Requirements Sign-off (After Phase 2)

**Criteria:**
- [ ] Feature matrix complete
- [ ] User stories prioritized
- [ ] Data model defined
- [ ] Success metrics defined
- [ ] Stakeholder approval obtained

**Approver:** Product Owner, Technical Lead

### Gate 3: Skills Architecture Approval (After Phase 3)

**Criteria:**
- [ ] All domains mapped
- [ ] Skill needs identified
- [ ] Knowledge gaps identified
- [ ] Research plan for missing knowledge
- [ ] Expert review scheduled

**Approver:** Domain Expert, Technical Lead

### Gate 4: Application Readiness (After Phase 4)

**Criteria:**
- [ ] All screens designed
- [ ] Components built
- [ ] APIs working
- [ ] Integration points defined
- [ ] Ed hooks implemented

**Approver:** Tech Lead, UX Designer

### Gate 5: Skills Readiness (After Phase 5)

**Criteria:**
- [ ] Knowledge packs created
- [ ] All tools implemented
- [ ] Conversation flows built
- [ ] Expert validation complete
- [ ] Citations verified

**Approver:** Domain Expert, Technical Lead

### Gate 6: Integration Testing Complete (After Phase 6)

**Criteria:**
- [ ] All tests passing
- [ ] E2E scenarios working
- [ ] Performance benchmarks met
- [ ] Security review complete
- [ ] Accessibility verified

**Approver:** QA Lead, Tech Lead

### Gate 7: Launch Approval (After Phase 7)

**Criteria:**
- [ ] Beta feedback addressed
- [ ] Launch checklist complete
- [ ] Support team trained
- [ ] Documentation complete
- [ ] Go/no-go decision made

**Approver:** Product Owner, Technical Lead, Domain Expert

---

## Deliverables Checklist

### Phase 1: Discovery & Research
- [ ] `market-research.md`
- [ ] `regulatory-compliance.md`
- [ ] `user-personas.md`
- [ ] Source documentation archive

### Phase 2: Requirements & Features
- [ ] `feature-matrix.md`
- [ ] `user-stories.md`
- [ ] `data-model.md`
- [ ] `success-metrics.md`

### Phase 3: Skills Architecture
- [ ] `domain-mapping.md`
- [ ] `skill-needs.md`
- [ ] `skill-architecture.md`
- [ ] `knowledge-research-plan.md`

### Phase 4: Application Development
- [ ] `information-architecture.md`
- [ ] Screen designs (Figma/Markdown)
- [ ] Component library
- [ ] API endpoints
- [ ] Database schema

### Phase 5: Skills Development
- [ ] Knowledge packs (all domains)
- [ ] MCP tools (all skills)
- [ ] Conversation flows
- [ ] Validation rules
- [ ] Expert validation reports

### Phase 6: Integration & Testing
- [ ] Integration code
- [ ] Test suites
- [ ] Performance benchmarks
- [ ] Security review

### Phase 7: Validation & Launch
- [ ] Beta test report
- [ ] User feedback analysis
- [ ] Launch readiness report
- [ ] User documentation
- [ ] Support documentation

---

## Continuous Improvement

### Post-Launch Monitoring

**Track:**
- Feature usage
- Ed interaction patterns
- User satisfaction
- Knowledge accuracy
- Performance metrics

**Monthly:**
- Review feedback
- Update knowledge packs
- Refine conversation flows
- Add new skills as needed

**Quarterly:**
- Expert knowledge review
- Regulatory update check
- Competitive analysis refresh
- User research refresh

---

## Applying This Framework: Estates Compliance Module

### Pilot Program

**Module:** Estates Compliance
**Duration:** 8-12 weeks
**Team:** Product Owner, Tech Lead, Developer, Domain Expert

**Week 1-2: Phase 1 - Discovery**
- Research competitors: Apricot, Concept, CFMS
- Document HSE regulations for each domain
- Interview 3-5 school site managers

**Week 3: Phase 2 - Requirements**
- Synthesize features from competitors
- Write user stories for MVP
- Define data model

**Week 4: Phase 3 - Skills Architecture**
- Map domains (Legionella, Fire, Asbestos, E&M)
- Identify skill needs for each
- Research HSE L8 for Legionella (pilot domain)

**Week 5-6: Phase 4 - Application Development**
- Design screens
- Build components
- Implement APIs

**Week 5-6: Phase 5 - Skills Development (Parallel)**
- Create Legionella knowledge pack
- Build Legionella tools
- Design conversation flows

**Week 7: Phase 6 - Integration**
- Integrate Ed into application
- Write tests
- Performance testing

**Week 8: Phase 7 - Beta**
- Deploy to 1-2 beta schools
- Collect feedback
- Refine

**Week 9+: Launch**
- Address feedback
- Complete checklist
- Launch

**Post-Launch:**
- Monitor and iterate
- Expand to other domains
- Refine process

---

## Document Status

**Status:** Draft - Ready for Review
**Next Steps:** Review with team, begin Phase 1 for Estates Compliance module
**Owner:** Product Team

---

**Last Updated:** 2026-01-23
