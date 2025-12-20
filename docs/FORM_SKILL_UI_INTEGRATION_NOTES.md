# Form Skill UI Integration Notes

## Required UI Changes

### 1. Preview Screen - Confidence Display

**Location:** `packages/ed-extension/src/content/form-fill-ui.tsx` - `renderPreview()` method

**Changes needed:**

```typescript
private renderPreview(plan: FillPlan): string {
  return `
    <table class="ed-form-fill-preview-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          <th>Confidence</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${plan.actions.map(action => {
          const confidence = action.confidence ?? 1.0;
          const confidencePercent = (confidence * 100).toFixed(0);
          const requiresConfirm = action.requiresConfirmation || confidence < 0.85;
          const isBlocked = confidence < 0.60;
          
          let statusClass = 'confidence-high';
          let statusIcon = '✓';
          let statusText = 'Ready';
          
          if (isBlocked) {
            statusClass = 'confidence-blocked';
            statusIcon = '✗';
            statusText = 'Blocked';
          } else if (requiresConfirm) {
            statusClass = 'confidence-warning';
            statusIcon = '⚠';
            statusText = 'Needs confirmation';
          }
          
          return `
            <tr class="${statusClass}" data-action-id="${action.id}">
              <td>${action.fieldId}</td>
              <td>${action.value}</td>
              <td>
                <span class="confidence-badge confidence-${getConfidenceClass(confidence)}">
                  ${confidencePercent}%
                </span>
                ${action.matchRationale ? `<br><small>${action.matchRationale}</small>` : ''}
              </td>
              <td>
                ${statusIcon} ${statusText}
                ${requiresConfirm && !isBlocked ? '<button class="confirm-field-btn" data-action-id="' + action.id + '">Confirm</button>' : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    ${plan.unmappedFields.length > 0 ? `
      <div class="ed-form-fill-warning">
        <strong>Unmapped fields:</strong> ${plan.unmappedFields.join(', ')}
      </div>
    ` : ''}
  `;
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.60) return 'medium';
  return 'low';
}
```

**CSS additions:**

```css
.confidence-high { background: #d1fae5; }
.confidence-warning { background: #fef3c7; }
.confidence-blocked { background: #fee2e2; opacity: 0.6; }

.confidence-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.confidence-badge.confidence-high { background: #10b981; color: white; }
.confidence-badge.confidence-medium { background: #f59e0b; color: white; }
.confidence-badge.confidence-low { background: #ef4444; color: white; }

.confirm-field-btn {
  margin-left: 8px;
  padding: 4px 8px;
  font-size: 12px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

### 2. Preview Screen - Confirmation Handling

**Location:** `packages/ed-extension/src/content/form-fill-ui.tsx` - `bindEvents()` method

**Add:**

```typescript
// Confirm field buttons
const confirmButtons = this.container?.querySelectorAll('.confirm-field-btn');
confirmButtons?.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const actionId = (e.target as HTMLElement).dataset.actionId;
    if (actionId) {
      this.confirmField(actionId);
    }
  });
});
```

**Add method:**

```typescript
private confirmField(actionId: string): void {
  if (!this.state.plan) return;
  
  const action = this.state.plan.actions.find(a => a.id === actionId);
  if (action) {
    action.requiresConfirmation = false;
    this.update();
  }
}
```

### 3. Execution Screen - Form Re-render Warning

**Location:** `packages/ed-extension/src/content/form-fill-ui.tsx` - `executePlan()` method

**Update:**

```typescript
private async executePlan(): Promise<void> {
  if (!this.state.plan) return;
  
  this.state.step = 'executing';
  this.update();
  
  try {
    const formSkill = await getFormSkill();
    const result = await formSkill.executeActions(this.state.plan.actions);
    
    // Check for form re-render errors
    const reRenderErrors = result.failed.filter(f => 
      f.error.includes('Form re-rendered')
    );
    
    if (reRenderErrors.length > 0) {
      this.state.errors.push(
        '⚠️ Form changed during filling. Some fields may not have been filled. Please review the form.'
      );
    }
    
    if (result.failed.length > 0) {
      this.state.errors.push(
        ...result.failed.map(f => `Field ${f.actionId}: ${f.error}`)
      );
    }
    
    this.state.step = 'complete';
    this.update();
  } catch (error) {
    this.state.errors.push(`Execution failed: ${error instanceof Error ? error.message : String(error)}`);
    this.state.step = 'preview';
    this.update();
  }
}
```

### 4. Preview Screen - Disable Blocked Fields

**Location:** `packages/ed-extension/src/content/form-fill-ui.tsx` - `renderFooter()` method

**Update:**

```typescript
case 'preview':
  // Check if any actions are blocked
  const blockedActions = this.state.plan?.actions.filter(a => 
    (a.confidence ?? 1.0) < 0.60
  ) || [];
  
  const hasBlocked = blockedActions.length > 0;
  
  return `
    <button 
      id="ed-form-fill-execute" 
      class="ed-form-fill-btn ed-form-fill-btn-primary"
      ${hasBlocked ? 'disabled' : ''}
      ${hasBlocked ? 'title="Some fields are blocked and require manual approval"' : ''}
    >
      Fill Form
    </button>
    <button id="ed-form-fill-back" class="ed-form-fill-btn">← Back</button>
    ${hasBlocked ? `
      <div class="ed-form-fill-warning" style="margin-top: 10px;">
        ${blockedActions.length} field(s) blocked. Please review and approve manually.
      </div>
    ` : ''}
  `;
```

## Summary of UI Changes

1. ✅ **Confidence display** - Show percentage and color coding
2. ✅ **Match rationale** - Show how field was matched
3. ✅ **Confirmation buttons** - For 0.60-0.84 confidence fields
4. ✅ **Blocked field indicators** - Visual feedback for <0.60 confidence
5. ✅ **Form re-render warnings** - Show when form changes during execution
6. ✅ **Disable execute button** - When blocked fields exist

## Testing Checklist

- [ ] Confidence scores display correctly
- [ ] Color coding works (green/amber/red)
- [ ] Confirmation buttons appear for medium confidence
- [ ] Blocked fields are visually distinct
- [ ] Execute button disabled when blocked fields exist
- [ ] Form re-render warning appears correctly
- [ ] Match rationale displays when available

