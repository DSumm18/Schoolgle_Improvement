# Ed Skills Lab - Development Plan

## Purpose
Prototype and test Ed's skills/tools capabilities before integrating into the main widget. This allows us to:
- Experiment with different skill approaches
- Build comprehensive knowledge bases
- Test example conversations
- Keep the main Ed widget clean until skills are production-ready

## Architecture

```
skills-lab/
├── knowledge/          # Knowledge bases (Markdown files with domain expertise)
├── skills/            # Skill prototypes (TypeScript functions + configs)
├── examples/          # Example conversations showing skill usage
└── notes/             # Planning and documentation
```

## Wave 1 Skills (High Priority - UK Schools Focus)

### 1. Pupil Premium Planner
**Purpose**: Help schools plan effective pupil premium spending aligned with EEF research
**Knowledge Base**: EEF Teaching & Learning Toolkit, PP guidance, case studies
**Key Functions**:
- Analyze proposed spending against EEF evidence ratings
- Suggest high-impact interventions
- Cost-effectiveness analysis

### 2. Website Compliance Checker
**Purpose**: Ensure school websites meet statutory compliance requirements
**Knowledge Base**: DfE website requirements, accessibility standards, GDPR
**Key Functions**:
- Check for required information (governance, policies, curriculum, etc.)
- Accessibility audit
- Suggest fixes for missing items

### 3. Headteacher Report to Governors
**Purpose**: Generate structured HT reports for governor meetings
**Knowledge Base**: Report templates, governance frameworks
**Key Functions**:
- Extract key data from school context
- Structure report sections
- Highlight areas requiring governor attention

## Wave 2 Skills (Finance & IT Support)

### 4. Access Finance Navigator
**Purpose**: Guide staff through Access Education Finance system
**Knowledge Base**: Access Finance user guides, common tasks
**Key Functions**:
- Step-by-step instructions for common tasks
- Screenshot analysis to identify current screen
- Troubleshooting guidance

### 5. PSF Finance Navigator
**Purpose**: Guide staff through PS Financials system
**Knowledge Base**: PSF user guides, common workflows
**Key Functions**:
- Budget monitoring guidance
- Purchase order creation
- Month-end processes

### 6. IT Helpdesk Coach
**Purpose**: First-line support for common IT issues
**Knowledge Base**: Common IT problems, fixes, escalation paths
**Key Functions**:
- Diagnose common issues (password resets, printer problems, etc.)
- Provide step-by-step fixes
- Know when to escalate to IT support

## Implementation Approach

### Phase 1: Knowledge Base Creation
For each skill, create comprehensive markdown knowledge bases with:
- Domain expertise
- Procedures and workflows
- Common scenarios
- Reference links

### Phase 2: Skill Prototypes
Create TypeScript skill definitions:
- Skill metadata (name, description, when to use)
- Required context/parameters
- Function implementation
- Integration with Ed's model router

### Phase 3: Example Conversations
Document realistic conversations showing:
- When skill should be triggered
- Context provided to skill
- Skill's response
- User experience

### Phase 4: Integration Testing
Once skills proven in lab:
- Integrate into main Ed widget
- Add to model router's skill selection logic
- Deploy to platform

## Key Principles

1. **UK Schools-Focused**: All skills tailored to UK education system
2. **Evidence-Based**: Cite EEF research, Ofsted framework, DfE guidance
3. **Actionable**: Provide specific, practical guidance (not generic advice)
4. **Self-Updating**: Skills should reference latest guidance (design for updates)
5. **Modular**: Each skill independent, can be called upon when needed

## Success Criteria

- Skills provide demonstrably better answers than general Ed chat
- Knowledge bases comprehensive enough to handle 80% of common queries
- Example conversations show clear value proposition
- Integration path to main Ed widget clear and documented

## Next Steps

1. Start with Pupil Premium Planner (highest value, clearest scope)
2. Build knowledge base from EEF Toolkit
3. Create skill prototype
4. Test with example conversations
5. Iterate before moving to next skill
