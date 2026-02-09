# ED - UNIVERSAL SCHOOL AI AGENT
## "The Vision: An AI That Can Do Any School Task"

---

## The Problem You're Solving

> *"Head teachers take for granted that school office staff can do everything. In reality, when the census person is sick, the school panics. Ed bridges that gap - anyone can step in, and Ed guides them through."*

**The Market Gap:** Tools like Bromcom captured this by being "the system." But Ed is **system-agnostic** - works with everything, fills the gaps, and doesn't require replacing existing systems.

---

## The Vision: Ed as Universal School Agent

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SCHOOL                                     │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     SIMS     │  │    Arbor     │  │   Bromcom    │  │   PS Finance │       │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                         │
│  │  Council     │  │   HSE.gov    │  │   DfE        │                         │
│  │  Website     │  │   RIDDOR     │  │   Census     │                         │
│  └──────────────┘  └──────────────┘  └──────────────┘                         │
│                                                                              │
│                               ┌──────────────────────┐                              │
│                               │         ED            │                              │
│                               │   (Universal Agent)    │                              │
│                               └──────────────────────────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Ed sits ABOVE the systems, works with all of them, and bridges the knowledge gap.
```

---

## What Ed Can Do (Your Vision)

| Scenario | Ed's Action |
|----------|-------------|
| **Census person off sick** | Ed guides anyone through the census, knows the data, fills the forms |
| **RIDDOR reporting needed** | Ed analyzes the incident, determines if reportable, fills HSE form |
| **Council form submission** | Ed learns the specific council's form, fills it with school data |
| **SIMS/Arbor confusion** | Ed understands both, guides the user step-by-step |
| **Process breakdown** | Ed identifies where a process is failing and suggests fixes |
| **Staff absence** | Ed knows the tasks, can triage what's urgent, can guide cover |

---

## Modern Agentic Architecture (2025 Approach)

This aligns with the **latest agentic AI thinking**:

### Multi-Modal Capabilities

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ED - MULTI-MODAL AGENT                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  VISION MODES                                                            │
│  ├── 🖼️  Screenshot analysis      → Understand current screen state       │
│  ├── 📄 PDF document parsing      → Extract data from forms/reports       │
│  ├── 📊 Data table interpretation → Make sense of complex data           │
│  └── 🎥 Video/dashcam footage     → Analyze accidents, incidents          │
│                                                                          │
│  LANGUAGE MODES                                                           │
│  ├── 💬 Natural conversation     → Chat with user                          │
│  ├── 📝 Form comprehension     → Understand form requirements              │
│  ├── 📖 Policy document analysis → Extract rules, requirements            │
│  └── 🌍 Multilingual              → Work in any language                    │
│                                                                          │
│  ACTION MODES                                                            │
│  ├── 🖱️  Browser control           → Click, type, navigate             │
│  ├── ⌨️  Keyboard input            → Fill forms, enter data            │
│  ├── 📤 File upload               → Attach documents, evidence           │
│  └── 🔄 Workflow automation       → Multi-step processes                 │
│                                                                          │
│  REASONING MODES                                                          │
│  ├── 🧠 Plan                     → Break down complex tasks              │
│  ├── 🎯 Optimize                  → Find better ways to do things        │
│  ├── ⚠️  Risk assessment           → Identify potential problems        │
│  └── 🔍 Verification              → Check accuracy, compliance           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Model Router (Best Model for Each Task)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       MODEL ROUTING LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Task Type                    → Best Model                           │
│  ─────────────────────────────────────────────────────────────────     │
│  Screenshot analysis         → Claude 3.5 Sonnet (vision)             │
│  PDF/Data extraction          → Gemini 2.0 Flash (multimodal)        │
│  Complex reasoning           → OpenAI o1-preview or Claude Opus      │
│  Simple chat                 → GPT-4o-mini or Gemini Flash (fast)       │
│  Form comprehension        → Claude 3.5 Sonnet (200K context)        │
│  Code execution             → Claude Code (Artifacts)                │
│  Browser automation         → Custom agent + Puppeteer             │
│  Image generation            → DALL-E 3 or Midjourney (if needed)    │
│  Voice input                 → Whisper + text model                  │
│  Voice output                → ElevenLabs or Azure TTS               │
│                                                                          │
│  Key: Different models for different capabilities.                  │
│       Ed routes each sub-task to the optimal model.                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

### 1. Universal System Understanding

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   SYSTEM KNOWLEDGE BASE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PRE-BUILT EXPERTISE (Ed knows these out of the box):                  │
│  ├── SIMS (most common UK MIS)                                             │
│  ├── Arbor (growing popularity)                                          │
│  ├── Bromcom (behaviour, attendance)                                   │
│  ├── PS Financial (finance system)                                       │
│  ├── HSE RIDDOR reporting                                               │
│  ├── DfE Census return                                                  │
│  ├── Local authority forms (various councils)                         │
│  └── School-specific data (via API/login)                               │
│                                                                          │
│  DYNAMIC LEARNING (Ed learns new systems):                              │
│  ├── User demonstrates workflow → Ed extracts patterns                │
│  ├── Documentation upload      → Ed parses and builds skills          │
│  ├── Screenshots provided      → Ed learns UI elements                │
│  ├── Successful executions   → Ed confirms and stores                │
│  └── User feedback             → Ed refines understanding             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Browser Automation Agent

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BROWSER AUTOMATION ENGINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Ed uses browser control to:                                              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 1. SEE: Take screenshot, understand current page state               │ │
│  │                                                                          │ │
│  │ 2. PLAN: Determine what needs to be done                            │ │
│  │                                                                          │ │
│  │ 3. ACT: Execute browser actions                                       │ │
│  │    ✓ Click elements by selector, text, or position                │ │
│  │    ✓ Type into form fields                                          │ │
│  │    ✓ Select from dropdowns                                          │ │
│  │    ✓ Navigate to URLs                                               │ │
│  │    ✓ Upload files                                                   │ │
│  │    ✓ Wait for page loads                                           │ │
│  │                                                                          │ │
│  │ 4. VERIFY: Confirm actions completed successfully                    │ │
│  │                                                                          │ │
│  │  5. REPORT: Tell user what was done, what's next                   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Built with modern tools:                                                │
│  ├── Puppeteer or Playwright (browser control)                          │
│  ├── Computer Vision (find elements, understand layouts)               │
│  ├── Retry logic (handle timeouts, errors)                             │
│  └── Human-in-the-loop (confirm before sensitive actions)                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Dynamic Skill Creation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SKILL CREATION ENGINE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Scenario: School needs to submit a form to their local council           │
│  (Different for every council, no pre-built knowledge)                    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ USER: "I need to submit this planning application form"               │ │
│  │                                                                          │ │
│  │  [Provides URL or uploads form]                                        │ │
│  │                                                                          │ │
│  │  ED:                                                               │ │
│  │  1. Use vision model to analyze form structure                         │ │
│  │  2. Extract all fields, requirements, validation rules                │ │
│  │  3. Identify which data is needed from school                          │ │
│  │  4. Check school database for available information                    │ │
│  │  5. Ask user for any missing information                               │ │
│  │  6. Fill the form using browser automation                           │ │
│  │  7. Submit and provide confirmation                                  │ │
│  │  8. SAVE this as a new skill for next time                             │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Result: New "council-planning-submission" skill created                  │
│  Available to: This school, any staff member, anytime                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4. Proactive Gap Analysis

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   PROACTIVE GAP ANALYSIS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Ed doesn't just respond - Ed anticipates:                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  DEADLINE TRACKING                                                      │ │
│  │  ├── School census due in 3 days → Data incomplete? → Alert user   │ │
│  │  ├── Fire drill due → Not logged → Remind and offer to log       │ │
│  │  ├── RIDDOR nears 3-year limit → Check records → Alert if needed  │ │
│  │  └── Budget reconciliation due → Ready to run? → Offer help       │ │
│  │                                                                          │ │
│  │  PROCESS BREAKDOWN                                                      │ │
│  │  ├── Absence rates high → Investigate patterns → Suggest actions  │ │
│  │  ├── Safeguarding delays → Identify bottleneck → Escalate       │ │
│  │  ├── Complaints about process → Map to find root cause           │ │
│  │  └── Staff workload analysis → Who's overwhelmed? → Suggest      │ │
│  │                                                                          │ │
│  │  KNOWLEDGE GAPS                                                         │
│  │  ├── New regulation issued → Update skills → Notify staff       │ │
│  │  │  └── Process changed → Re-train → Clear old knowledge       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Example: RIDDOR Reporting Workflow

### User Scenario

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SITE MANAGER: "A teaching assistant had an accident. They fell from   │
│                 a ladder in the hall and hurt their ankle. What do I do?"   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ED (MULTI-MODEL RESPONSE)                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [STEP 1] UNDERSTAND THE INCIDENT                                        │
│  Ed: "I'm sorry to hear that. Let me help through the RIDDOR process.    │
│       Can you tell me a bit more about what happened?"                   │
│                                                                          │
│  User: [Describes incident]                                              │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  [STEP 2] ASSESS (Uses reasoning model)                                │ │
│  │  Analyzes:                                                             │ │
│  │  - Is this reportable? (RIDDOR criteria)                            │ │
│  │  - How serious? (Fracture, hospitalization, etc.)                   │ │
│  │  - What information needed?                                          │ │
│  │                                                                        │ │
│  │  Ed: "Based on what you've described, this appears reportable     │ │
│  │       under RIDDOR as 'over-7-day incapacitation'."                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  [STEP 3] COLLECT DATA (Uses school database + vision)               │ │
│  │  Ed: "I can see from the system that we have:                        │ │
│  │       - School: [Name]                                                   │ │
│  │       - Address: [From database]                                      │ │
│  │       - Phone: [From database]                                        │ │
│  │       - DfE number: [From database]                                   │ │
│  │       Let me gather the details..."                                  │ │
│  │                                                                        │ │
│  │  [Asks follow-up questions to complete incident report]            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  [STEP 4] FILL THE FORM (Uses browser automation + vision)          │ │
│  │  Ed: "I'll submit this to HSE for you. Let me navigate to the         │ │
│  │       RIDDOR reporting website..."                                   │ │
│  │                                                                        │ │
│  │  [Browser automation shown to user]                                  │ │
│  │  - Navigate to hse.gov.uk/riddor/                                  │ │
│  │  - Analyze form using vision                                         │ │
│  │  - Fill each field with collected data                               │
│  │  - Attach any evidence (photos, documents)                           │ │
│  │  - Verify all fields complete                                        │ │
│  │  - Submit                                                          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  [STEP 5] CONFIRM AND DOCUMENT                                       │ │
│  │  Ed: "Submitted successfully! Here's what happens next:               │ │
│  │        ✓ Reference number: [RIDDOR reference]                      │ │
│  │        ✓ Copy saved to school records                              │ │
│  │        ✓ Added to accident log                                     │ │
│  │        ✓ Diary entry created for 3-year review                     │ │
│  │                                                                        │ │
│  │        I'll remind you before the 3-year review date."              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack for 2025

### AI Models (Best in Class for Each Task)

| Capability | Model | Why |
|------------|-------|------|
| **General reasoning** | Claude 3.5 Sonnet / OpenAI o1 | Complex analysis, planning |
| **Vision (screenshots)** | Claude 3.5 Sonnet / Gemini 2.0 Flash | 200K context, understands UI |
| **Fast chat** | GPT-4o-mini / Gemini Flash | Low latency, cheap |
| **Form understanding** | Claude 3.5 Sonnet (200K) | Can process entire forms |
| **Code execution** | Claude Code (Artifacts) | Can run, verify, iterate |
| **Browser control** | Custom agent + Puppeteer | Reliable automation |
| **Voice input** | Whisper v3 | Accurate transcription |
| **Voice output** | ElevenLabs / Azure TTS | Natural speech |
| **PDF/Data extraction** | Mistral OCR / Gemini | Multimodal parsing |
| **Long context** | Claude 3.5 Sonnet (200K) | Full document analysis |

### Agentic Framework

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AGENTIC ORCHESTRATION                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Options for implementation:                                           │
│                                                                          │
│  1. LangGraph (LangChain)                                                 │
│     ├── Stateful agent orchestration                                   │
│     ├── Pre-built tools (browser, file system)                         │
│     ├── Memory management                                              │
│     └── Human-in-the-loop                                                │
│                                                                          │
│  2. AutoGen (Microsoft)                                                   │
│     ├── Multi-agent conversations                                      │
│     ├── Code interpreter built-in                                       │
│     └── Tool use capabilities                                          │
│                                                                          │
│  3. Custom orchestration                                                │
│     ├── Full control over architecture                                  │
│     ├── Optimized for your specific needs                              │
│     └── Can be simpler than full frameworks                            │
│                                                                          │
│  My recommendation: Start custom, consider LangGraph if complexity grows  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow for Universal Knowledge

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA INTEGRATION                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SCHOOL DATABASE (Supabase)                                             │
│  ├── School info (name, address, phone, URN)                           │
│  ├── Staff records (names, roles, contact info)                          │
│  ├── Student data (where accessible, with permissions)                     │
│  └── Configured systems (which MIS, which finance system, etc.)          │
│                                                                          │
│  KNOWLEDGE BASE (ed_knowledge_base)                                     │
│  ├── System guides (SIMS, Arbor, Bromcom, etc.)                        │
│  ├── Regulatory guidance (HSE, DfE, ACAS)                              │
│  ├── Process workflows (census, RIDDOR, etc.)                          │
│  ├── Council-specific forms (learned over time)                        │
│  └── Freshness tracking (last verified, next review)                    │
│                                                                          │
│  USER CONTEXT (session)                                                  │
│  ├── Current page/URL                                                   │
│  ├── Visible elements (screenshots, DOM)                               │
│  ├── Selected text                                                       │
│  ├── User role/permissions                                               │
│  └── Conversation history                                               │
│                                                                          │
│  DYNAMIC SKILLS (user-created)                                         │
│  ├── Council form submissions (specific to local authority)              │
│  ├── Custom workflows (school-specific processes)                      │
│  ├── Seasonal tasks (each term/year)                                   │
│  └── Incident responses (learned from experience)                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Ed Architecture (Revised)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ED - CORE ORCHESTRATOR                            │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  INPUT: User question + context (screen, URL, session)              │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │ MODEL ROUTER (Task → Best Model)                             │  │ │
│  │  │   Vision → Claude 3.5 Sonnet / Gemini 2.0 Flash              │  │ │
│  │  │   Reasoning → Claude 3.5 Sonnet / OpenAI o1                  │  │ │
│  │  │   Fast chat → GPT-   o-mini / Gemini Flash                   │  │ │
│  │  │   Browser → Custom agent + Puppeteer                         │  │ │
│  │  │   PDF/Data → Mistral OCR / Gemini                            │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │ AGENT ROUTER (Which specialist or generalist?)                │  │ │
│  │  │   Pre-built knowledge → Return cached answer                   │  │ │
│  │  │   New council form → Learn and create skill                   │  │ │
│  │  │   Known system → Use system expert                            │  │ │
│  │  │   Compliance → Use specialist + guardrails                      │  │ │
│  │  │   General reasoning → Use generalist agent                     │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │ TOOL LAYER (What capabilities are needed?)                     │  │ │
│  │  │   Vision → Analyze screenshot/form/PDF                           │  │ │
│  │  │   Browser → Navigate, click, type, wait                        │  │ │
│  │  │   Database → Query school info, records                         │  │ │
│  │  │   File → Upload/download documents                               │  │ │
│  │  │   Skills → Use or create skills                                   │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │ GUARDRAILS (Before user sees anything)                          │  │ │
│  │  │   Safety → Is this safe to advise?                              │ │ │ │
│  │  │   Compliance → Any statutory issues?                           │ │ │ │
│  │  │   Confidence → Is knowledge current?                              │ │ │ │ │
│  │  │   Permission → Can user access this?                            │ │ │ │ │
│  │  │   Privacy → Is sensitive data protected?                         │ │ │ │
│  │  │   Human review → Critical actions require confirmation          │ │ │ │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  │  OUTPUT: Response + Action (if applicable)                           │ │
│  │                                                                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  LEARNING LOOP (Ed gets smarter)                                    │ │
│  │    ├── Success → Reinforce pattern                                   │ │
│  │    ├── Failure → Learn, adjust                                       │ │
│  │    ├── New workflow → Save as skill                                  │ │
│  │    └── User feedback → Refine understanding                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Differences from Initial Approach

| Aspect | Initial Plan | Your Vision (This) |
|--------|---------------|-------------------|
| **Scope** | Schoolgle apps only | ALL school systems |
| **Knowledge** | Pre-built specialists | Dynamic learning |
| **Capabilities** | Answer questions | Complete work |
| **Browser** | Basic automation | Full control + vision |
| **Skills** | Fixed library | User-creatable |
| **Models** | Single model | Multi-model routing |
| **Proactivity** | Reactive | Anticipates needs |

---

## Implementation Priority

Given this vision, here's what I'd prioritize:

### Phase 1: Foundation (MVP)
1. Browser automation engine (Puppeteer)
2. Vision model integration (screenshots → understanding)
3. Knowledge base with pre-built expertise (SIMS, Arbor, HSE, DfE)
4. Basic guardrails

### Phase 2: Core Features
5. RIDDOR workflow (high impact, clear ROI)
6. Census workflow (seasonal, high stress)
7. Dynamic skill creation (council forms)

### Phase 3: Expansion
8. Proactive gap analysis
9. Multi-model routing optimization
10. Voice input/output
11. Learning loop (from user interactions)

---

## Does This Align?

This vision matches the latest agentic AI thinking:
- **Anthropic's Computer Use** (browser control)
- **OpenAI's Agents** (task decomposition)
- **LangGraph/LangChain** (agent orchestration)
- **Multi-modal models** (Claude 3.5 Sonnet, Gemini 2.0)

**Should I restructure the implementation plan around this expanded vision?**
