# Ed Form Helper - Universal Form Detection

## Problem: How to fill ANY form, not just pre-coded ones?

The test uses hardcoded field mappings. Real solution: **AI-powered form analysis**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     UNIVERSAL FORM FILLING                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DETECT        2. ANALYZE        3. CONVERSE       4. FILL   │
│  ────────         ─────────         ───────────        ─────    │
│                                                                 │
│  ┌─────────┐     ┌─────────┐       ┌─────────┐       ┌─────────┐│
│  │ Vision  │     │   AI    │       │  Chat   │       │ Action  ││
│  │ Model   │───>│ Mapping │──────>│ with    │──────>│ Execute ││
│  │         │     │         │       │ User    │       │         ││
│  └─────────┘     └─────────┘       └─────────┘       └─────────┘│
│     │              │                  │                 │        │
│     ▼              ▼                  ▼                 ▼        │
│  Screenshot   Field Labels    "What's your   Type into  │
│  / DOM Scan   + Types         name?"      →   the field  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Form Detection (Vision + DOM)

### Option A: DOM Scraping (Primary)
```typescript
function detectFormsOnPage(): DetectedForm[] {
  const forms = document.querySelectorAll('form');
  return Array.from(forms).map(form => ({
    formId: form.id || form.name || generateId(),
    action: form.action,
    fields: Array.from(form.elements).map(el => ({
      type: el.type,
      name: el.name,
      id: el.id,
      label: findLabel(el),  // Look for <label> or aria-label
      placeholder: el.placeholder,
      required: el.required,
      options: el.type === 'select' ? getOptions(el) : undefined
    }))
  }));
}

// Find label for an input (tries multiple strategies)
function findLabel(element): string {
  // 1. Check for <label for="...">
  const labelByFor = document.querySelector(`label[for="${element.id}"]`);
  if (labelByFor) return labelByFor.textContent;

  // 2. Check parent label
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel.textContent;

  // 3. Check aria-label
  if (element.getAttribute('aria-label')) {
    return element.getAttribute('aria-label');
  }

  // 4. Check preceding text node
  const prevSibling = element.previousSibling;
  if (prevSibling?.textContent) {
    return prevSibling.textContent.trim();
  }

  // 5. Fallback to name/id
  return element.name || element.id || 'Field';
}
```

### Option B: Vision Model (When DOM fails)
```typescript
// Use Qwen2.5-VL or Gemini 2.0 Flash to analyze screenshot
async function detectFormsByVision(screenshot: string): Promise<FormField[]> {
  const response = await openrouter.chat.completions.create({
    model: 'qwen/qwen-2.5-vl-72b-instruct',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: screenshot }
        },
        {
          type: 'text',
          text: `Extract all form fields from this image. Return JSON:
          {
            "fields": [
              {"label": "string", "type": "text|email|tel|select", "required": boolean}
            ]
          }`
        }
      ]
    }]
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

## Step 2: AI Field Mapping (The Secret Sauce)

When Ed sees a form, he needs to understand:
1. **What kind of form is this?** (Safeguarding, Admissions, Job Application, etc.)
2. **What information is needed?** (Name, email, specific details)
3. **What should I ask the user?**

```typescript
async function analyzeFormAndGenerateQuestions(fields: FormField[], userLanguage: string) {
  // Send field list to AI for analysis
  const response = await openrouter.chat.completions.create({
    model: 'deepseek/deepseek-chat',
    messages: [{
      role: 'system',
      content: `You are Ed, a form-filling assistant. Analyze forms and generate natural questions.

      Common form types:
      - Safeguarding: Name, contact, concern details, urgency
      - Job Application: Name, email, experience, cover letter
      - Contact Us: Name, email, message
      - Registration: Name, email, password, confirm password`
    },
    {
      role: 'user',
      content: `Analyze this form and tell me:
      1. What type of form is this?
      2. What questions should I ask the user (in ${userLanguage})?

      Fields: ${JSON.stringify(fields.map(f => ({
        label: f.label,
        type: f.type,
        required: f.required
      })))}

      Return JSON:
      {
        "formType": "safeguarding|job_application|contact|registration|other",
        "conversation": [
          {"fieldIndex": 0, "question": "What is your name?", "fieldLabel": "Your Name"}
        ]
      }`
    }]
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

## Step 3: Conversational Collection

Instead of "filling" immediately, Ed **converses** with the user:

```
ED: "Hi! I can help you fill this form. It looks like a safeguarding concern form.
     First, what's your name?"

USER: "Ahmed Ali"

ED: "Thanks Ahmed! Now, what's your phone number?"

USER: "07700 900123"

ED: "Great! And your email address?"

USER: "ahmed@example.com"

ED: "Perfect. Finally, please tell me about your concern. You can speak for as long as you like."

USER: "Well, my son comes home sad every day..."

ED: [Types everything into the form]
    "I've written that down. Is there anything else you'd like to add?"

USER: "No, that's everything"

ED: "Okay! I've filled in all the fields. Please check them over and click Submit when ready."
```

---

## Step 4: Field Filling

Once Ed has the values, he fills them:

```typescript
async function fillField(field: FormField, value: string) {
  const element = document.querySelector(`#${field.id}`) ||
                  document.querySelector(`[name="${field.name}"]`);

  if (!element) {
    console.warn(`Field not found: ${field.name}`);
    return false;
  }

  // Focus the field first
  element.focus();
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Highlight it
  element.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.5)';

  // Type the value
  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'textarea':
      await typeIntoElement(element, value);
      break;

    case 'select':
    case 'select-one':
      await selectOption(element, value);
      break;

    case 'radio':
    case 'checkbox':
      await clickElement(element);
      break;
  }

  // Add checkmark
  showSuccessIndicator(element);

  return true;
}

// Human-like typing
async function typeIntoElement(element: HTMLInputElement, value: string) {
  element.value = '';
  for (const char of value) {
    element.value += char;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(50 + Math.random() * 50); // Human-like timing
  }
  element.dispatchEvent(new Event('change', { bubbles: true }));
}
```

---

## Step 5: Form Type Detection

```typescript
// Smart form type detection
async function detectFormType(fields: FormField[]): Promise<FormType> {
  const fieldLabels = fields.map(f => f.label.toLowerCase()).join(' ');

  const keywords = {
    safeguarding: ['concern', 'safeguarding', 'report', 'worried', 'child protection'],
    job: ['application', 'cv', 'resume', 'cover letter', 'experience', 'employment'],
    contact: ['message', 'inquiry', 'contact us', 'get in touch'],
    registration: ['register', 'sign up', 'create account', 'password'],
    admissions: ['child', 'student', 'year group', 'admission', 'enrol'],
    'free-school-meals': ['ni number', 'benefits', 'income', 'free school meals'],
  };

  for (const [type, words] of Object.entries(keywords)) {
    if (words.some(w => fieldLabels.includes(w))) {
      return type as FormType;
    }
  }

  return 'other';
}
```

---

## Complete Flow

```
1. User navigates to ANY web page with a form
                ↓
2. Extension detects: "Found a form with 6 fields"
                ↓
3. AI analyzes: "This is a safeguarding concern form"
                ↓
4. Ed says: "I can help you fill this safeguarding form. What's your name?"
                ↓
5. User speaks/types answer
                ↓
6. Ed fills first field, asks next question
                ↓
7. Repeat until all fields filled
                ↓
8. Ed: "All done! Please check and submit."
```

---

## Real Implementation Structure

```typescript
class UniversalFormHelper {
  private visionModel = 'qwen/qwen-2.5-vl-72b-instruct';
  private chatModel = 'deepseek/deepseek-chat';

  async start() {
    // 1. Detect form on page
    const form = await this.detectForm();

    // 2. Analyze form type and fields
    const analysis = await this.analyzeForm(form);

    // 3. Start conversation with user
    await this.converseAndFill(analysis);
  }

  private async detectForm() {
    // DOM scraping first
    const domForm = this.scrapeDOM();

    // If that fails, use vision
    if (!domForm || domForm.fields.length === 0) {
      const screenshot = await this.takeScreenshot();
      return this.detectByVision(screenshot);
    }

    return domForm;
  }

  private async analyzeForm(form: Form) {
    // Send to AI for intelligent analysis
    return await this.openrouter.chat.completions.create({
      model: this.chatModel,
      messages: [{
        role: 'user',
        content: this.buildAnalysisPrompt(form)
      }]
    });
  }

  private async converseAndFill(analysis: FormAnalysis) {
    for (const step of analysis.conversation) {
      // Ask question (with TTS)
      await this.speak(step.question);

      // Listen for answer (with STT)
      const answer = await this.listen();

      // Fill the field
      await this.fillField(step.fieldIndex, answer);

      // Confirm
      await this.speak(`Got it. ${step.nextQuestion || ''}`);
    }
  }
}
```

---

## Key Insight

**We DON'T need to pre-code forms.**

We need:
1. **Good DOM scraping** - Find fields and labels
2. **Smart AI analysis** - Understand what the form is for
3. **Natural conversation** - Ask questions in a friendly way
4. **Human-like filling** - Type at reasonable speed, show what's happening

The test page was just a simulation. Real implementation would be truly universal.
