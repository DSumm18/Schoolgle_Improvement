# Ed Form Helper - Edit & Correction Mode

## User Story

> "I filled in 3 fields but I made a mistake on the first one. Can Ed help me fix it without starting over?"

**Answer: Yes!** Ed is designed for easy corrections.

---

## How It Works

### Intent Detection

Ed listens for phrases like:
- "I need to change the first field"
- "Can I edit the name?"
- "The email is wrong"
- "Go back to the phone number"
- "Let me fix that"

### Intelligent Field Identification

Ed uses AI to understand which field you mean:

| User Says | Ed Understands |
|-----------|----------------|
| "Change the first field" | Field index 0 |
| "I need to fix the email" | Finds field with label "Email" |
| "Go back one" | Previous field (current - 1) |
| "The phone number is wrong" | Finds field with label "Phone" |
| "Can you change the name field?" | Finds field with label "Name" |

### Conversational Correction Flow

```
USER: "Wait, I need to change the name field"

ED: "The name field currently has 'Ahmed'. What would you like to change it to?"

USER: "Ahmed Ali"

ED: "Main samajha: 'Ahmed Ali'. Kya ye sahi hai?" / "I understood: 'Ahmed Ali'. Is that correct?"

USER: "Yes"

ED: [Clears the name field, fills "Ahmed Ali", returns to where they left off]

ED: "Great! I've updated the name field. We were on the contact field. Do you want to continue?"
```

---

## Technical Implementation

### New Functions

```typescript
// Parse user's change request
parseChangeRequest({
  userMessage: "I need to change the first field",
  formFields: [...],
  currentFieldIndex: 2, // Currently on 3rd field
})

// Returns: { intent: 'change', targetFieldIndex: 0, understoodChange: true }

// Update a field's value
updateFieldResponse(session, fieldIndex, newValue)

// Generate confirmation message
generateChangeConfirmation({
  field: nameField,
  oldValue: "Ahmed",
  newValue: "Ahmed Ali",
  userLanguage: "en"
})
```

### Intent Recognition Patterns

| Pattern | Example | Matches |
|---------|---------|---------|
| **Ordinals** | "first", "second", "third" | Field by position |
| **Field names** | "name", "email", "phone" | Field by label |
| **Navigation** | "go back", "previous", "last one" | Relative position |
| **Corrections** | "fix", "change", "edit", "wrong" | Intent to modify |

### Multilingual Support

Ed can handle correction requests in any supported language:

**Urdu Example:**
```
USER: "Naam change karna hai" (Need to change the name)
ED: "The name field currently has 'Ahmed'. What would you like to change it to?"
```

**Punjabi Example:**
```
USER: "Email khatam hai, change karo" (Email is wrong, change it)
ED: "The email field currently has 'ahmed@test.com'. What would you like to change it to?"
```

---

## Edge Cases Handled

### 1. Unclear Request

```
USER: "I need to change something"

ED: "Which field would you like to change? The form has: Name, Email, Phone, Concern"
```

### 2. Multiple Matches

```
USER: "Change the phone field"

ED: "I found 2 phone fields. Which one?
    1. 'Your Phone Number' (field 3)
    2. 'Emergency Contact Phone' (field 7)"
```

### 3. Already There

```
USER: "Can you change the current field?"

ED: "The ${currentField.label} field currently has '${currentValue}'. What would you like to change it to?"
```

### 4. Going Back Multiple Fields

```
USER: "Go back to the name field" (currently on field 5)

ED: "Going back to the name field (field 1)...

    The name field currently has 'Ahmed'. What would you like to change it to?"

USER: "Actually, leave it as is"

ED: "Understood. Returning to field 5 ( Concern)..."
```

---

## State Management

### Session State with Corrections

```typescript
interface FormSession {
  sessionId: string;
  currentFieldIndex: number;     // Can move backwards!
  responses: FieldResponse[];     // Can be updated
  corrections: number;           // Track for analytics
  mode: 'collecting' | 'editing'; // New state
}
```

### Example Timeline

```
Field 1 (Name): "Ahmed" → User changes → "Ahmed Ali" ✓
Field 2 (Email): "ahmed@test.com" ✓
Field 3 (Phone): "07700 900999" → User goes back → "07700 900123" ✓
Field 4 (Concern): [collecting...]
```

---

## UI States

### Normal Collection Mode
```
┌─────────────────────────────────────────┐
│  Ed: "What is your name?"               │
│  User: "Ahmed"                         │
│  Ed: "Is that correct?"                │
│  User: "Yes"                           │
│  [Field filled, moves to next]          │
└─────────────────────────────────────────┘
```

### Edit Mode Triggered
```
┌─────────────────────────────────────────┐
│  User: "Wait, I need to change name"  │
│  Ed: "The name field has 'Ahmed'.     │
│       "What do you want to change it │
│        │       "to?"                    │
│  User: "Ahmed Ali"                    │
│  Ed: "Is that correct?"                │
│  User: "Yes"                           │
│  [Field updated, continues]            │
└─────────────────────────────────────────┘
```

---

## Anonymous Analytics

When users make corrections, we log (anonymously):

```json
{
  "sessionId": "anon_xxx",
  "formType": "safeguarding",
  "totalFields": 4,
  "fieldsFilled": 4,
  "corrections": 1,  // ← Tracks how many changes made
  "completionTime": 67,
  "abandoned": false
}
```

This helps us understand:
- Which forms are confusing (need clarification)
- Which languages need better translation
- Overall usability

---

## Testing Scenarios

### Scenario 1: Immediate Correction
```
1. User fills "Ahmed" for name
2. User: "Actually, it's Ahmed Ali"
3. Ed: Confirms and updates
```

### Scenario 2: Go Back Multiple Fields
```
1. User is on field 4
2. User: "Go back to the first field"
3. Ed: Jumps to field 1, shows current value
4. User makes changes
5. Ed: Returns to field 4 where they left off
```

### Scenario 3: Wrong Field Detected
```
1. Ed: "What is your concern?"
2. User: "Wait, my phone number is wrong"
3. Ed: Detects intent, switches to phone field
4. Ed: "The phone field has '07700 900999'. What should it be?"
```

---

## Key Features

✅ **Jump to any field** - By name, position, or navigation
✅ **Show current value** - User sees what will change
✅ **Confirm before updating** - No surprise changes
✅ **Continue from where left off** - No lost progress
✅ **Unlimited corrections** - Change as many times as needed
✅ **Multilingual corrections** - Request changes in any language
✅ **No data loss** - Previous data preserved until confirmed

---

## Privacy Note

Even when making corrections, **no data is stored**. The session exists only in memory and is deleted immediately after form submission or window close.
