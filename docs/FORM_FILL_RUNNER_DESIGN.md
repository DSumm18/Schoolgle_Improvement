# Form Fill Runner Design (v1.1)

## Architecture

### ActionRunner

**Purpose:** Execute actions sequentially with interrupt support (pause/stop/step)

**State:**
```typescript
interface RunnerState {
  isPaused: boolean;
  isStopped: boolean;
  isStepMode: boolean;
  currentActionIndex: number;
  abortController: AbortController;
  pauseResolve: (() => void) | null;
}
```

**Flow:**
```
for (action of actions) {
  // Check abort signal
  if (abortController.signal.aborted) break;
  
  // Check pause
  await waitIfPaused();
  
  // Execute action
  await runAction(action);
  
  // If step mode, pause and wait for user
  if (stepMode) await waitForStepContinue();
  
  // Update progress
  onProgress(action, index);
}
```

### Pause Mechanism

**Implementation:**
- `pauseResolve` Promise that blocks execution
- When paused: `await new Promise(resolve => { this.pauseResolve = resolve; })`
- When resumed: `pauseResolve()` is called

**Integration Points:**
- All `delay()` calls check pause
- All polling loops check pause
- All retry loops check pause

### Stop Mechanism

**Implementation:**
- `AbortController` with signal
- Check `abortController.signal.aborted` before/after each action
- Pass signal to all wait/poll functions

### Step Mode

**Implementation:**
- After each action completes:
  - Pause automatically
  - Show "Next: [action description]"
  - Wait for "Next step" button or Enter key
  - Resume and continue

### Vision Fallback Flow

**Trigger:**
- After `validate()` if blocked fields exist OR
- After `planFill()` if confidence < threshold

**UI:**
- Show prompt in INTENT stage
- Options: "Use vision (once)" / "Continue without" / "Cancel"
- If approved: call vision API, re-plan, re-validate, update preview

## State Changes

### FormFillState Extensions

```typescript
interface FormFillState {
  // ... existing fields
  runnerState: {
    isPaused: boolean;
    isStopped: boolean;
    isStepMode: boolean;
    currentActionIndex: number;
    lastActionStatus: 'succeeded' | 'failed' | 'skipped' | null;
  };
  visionFallbackRequested: boolean;
  visionFallbackUsed: boolean;
}
```

## Integration Points

### executeActions() Modifications

**Option 1:** Create wrapper that calls executeActions action-by-action
**Option 2:** Modify executeActions to accept abort signal and pause gate

**Chosen:** Option 1 (wrapper) - minimal changes to existing code

### Wait/Poll Functions

All must check:
- `abortController.signal.aborted` → throw AbortError
- `pauseGate` → await resume

## Progress Updates

**Callback pattern:**
```typescript
onProgress?: (action: FillAction, index: number, status: 'running' | 'succeeded' | 'failed') => void;
```

**UI updates:**
- Current field label
- Action x/y
- Last action status
- Active field highlight

