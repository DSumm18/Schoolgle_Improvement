import { test, expect, Page } from '@playwright/test';

/**
 * Helper to inject Ed extension content script
 */
async function injectEdExtension(page: Page) {
  // In a real scenario, you'd load the extension
  // For testing, we'll inject a minimal mock that exposes the form fill dialog
  await page.addInitScript(() => {
    // Mock chrome.storage
    (window as any).chrome = {
      storage: {
        local: {
          get: async (keys: string[]) => {
            return {
              ed_config: {
                openRouterApiKey: 'test-key',
                geminiApiKey: 'test-key',
              },
            };
          },
          set: async () => {},
        },
      },
    };
    
    // Expose test hook
    (window as any).edFormFillTestHook = {
      triggerFormFill: async (inputData: any) => {
        // This would trigger the actual form fill dialog
        // For now, we'll simulate it
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true });
          }, 100);
        });
      },
    };
  });
}

/**
 * Helper to wait for form fill dialog
 */
async function waitForFormFillDialog(page: Page) {
  await page.waitForSelector('.ed-form-fill-dialog', { timeout: 5000 });
}

/**
 * Helper to fill input data in dialog
 */
async function fillInputData(page: Page, data: Record<string, string>) {
  const textarea = page.locator('#ed-form-fill-input');
  await textarea.fill(JSON.stringify(data, null, 2));
  await page.click('#ed-form-fill-parse');
  await page.waitForTimeout(500);
}

/**
 * Helper to approve plan
 */
async function approvePlan(page: Page) {
  await page.waitForSelector('#ed-form-fill-approve:not([disabled])', { timeout: 5000 });
  await page.click('#ed-form-fill-approve');
}

/**
 * Helper to check audit log
 */
async function getAuditLog(page: Page): Promise<any[]> {
  return await page.evaluate(async () => {
    const result = await (window as any).chrome.storage.local.get('ed_form_fill_audit_log');
    return result.ed_form_fill_audit_log || [];
  });
}

test.describe('Form Fill v1.1 - Basic Flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectEdExtension(page);
  });

  test('completes full I-I-I flow on basic form', async ({ page }) => {
    await page.goto('/basic-form.html');
    
    // Trigger form fill (this would be done via extension UI in real scenario)
    // For testing, we'll simulate the flow
    await page.evaluate(() => {
      // Simulate opening dialog
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    
    // Fill input data
    await fillInputData(page, {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john.doe@example.com',
      'Date of Birth': '2010-01-15',
      'Country': 'uk',
      'Bio': 'Test bio',
    });
    
    // Wait for plan
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    
    // Approve plan
    await approvePlan(page);
    
    // Wait for execution to complete
    await page.waitForSelector('.ed-form-fill-impact', { timeout: 30000 });
    
    // Verify "Nothing was submitted" message
    const impactMessage = page.locator('.ed-form-fill-impact-message');
    await expect(impactMessage).toContainText('Nothing was submitted');
    
    // Verify results summary
    const stats = page.locator('.ed-form-fill-impact-stats');
    await expect(stats).toBeVisible();
  });
});

test.describe('Form Fill v1.1 - Pause/Resume', () => {
  test.beforeEach(async ({ page }) => {
    await injectEdExtension(page);
  });

  test('pauses and resumes during execution', async ({ page }) => {
    await page.goto('/basic-form.html');
    
    // Start execution (simplified for test)
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'test@example.com',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    await approvePlan(page);
    
    // Wait for execution to start
    await page.waitForSelector('.ed-form-fill-progress', { timeout: 5000 });
    
    // Pause
    await page.click('#ed-form-fill-pause');
    await expect(page.locator('.ed-form-fill-paused-notice')).toBeVisible();
    
    // Resume
    await page.click('#ed-form-fill-pause');
    await expect(page.locator('.ed-form-fill-paused-notice')).not.toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('.ed-form-fill-impact', { timeout: 30000 });
  });

  test('pauses during typeahead wait', async ({ page }) => {
    await page.goto('/typeahead-form.html');
    
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'Name': 'John',
      'School (Typeahead)': 'Acme',
      'Subject (Typeahead)': 'Math',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    await approvePlan(page);
    
    // Wait for typeahead to start
    await page.waitForSelector('.ed-form-fill-progress', { timeout: 5000 });
    
    // Pause during typeahead polling
    await page.click('#ed-form-fill-pause');
    await expect(page.locator('.ed-form-fill-paused-notice')).toBeVisible();
    
    // Resume
    await page.click('#ed-form-fill-pause');
    
    // Wait for completion
    await page.waitForSelector('.ed-form-fill-impact', { timeout: 30000 });
  });
});

test.describe('Form Fill v1.1 - Stop', () => {
  test.beforeEach(async ({ page }) => {
    await injectEdExtension(page);
  });

  test('stops execution immediately', async ({ page }) => {
    await page.goto('/basic-form.html');
    
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'First Name': 'John',
      'Last Name': 'Doe',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    await approvePlan(page);
    
    // Wait for execution to start
    await page.waitForSelector('.ed-form-fill-progress', { timeout: 5000 });
    
    // Stop
    await page.click('#ed-form-fill-stop');
    
    // Verify stopped state
    await expect(page.locator('text=Stopped')).toBeVisible();
    
    // Verify audit log
    const auditLog = await getAuditLog(page);
    expect(auditLog.length).toBeGreaterThan(0);
    expect(auditLog[0].abortReason).toBe('user_stop');
  });

  test('stops during typeahead polling', async ({ page }) => {
    await page.goto('/typeahead-form.html');
    
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'School (Typeahead)': 'Acme',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    await approvePlan(page);
    
    // Wait for typeahead to start
    await page.waitForSelector('.ed-form-fill-progress', { timeout: 5000 });
    
    // Stop during polling
    await page.click('#ed-form-fill-stop');
    
    // Verify stopped
    await expect(page.locator('text=Stopped')).toBeVisible();
  });
});

test.describe('Form Fill v1.1 - Step Mode', () => {
  test.beforeEach(async ({ page }) => {
    await injectEdExtension(page);
  });

  test('pauses after each action in step mode', async ({ page }) => {
    await page.goto('/basic-form.html');
    
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'test@example.com',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    await approvePlan(page);
    
    // Enable step mode
    await page.waitForSelector('#ed-form-fill-step-toggle', { timeout: 5000 });
    await page.click('#ed-form-fill-step-toggle');
    
    // Wait for first pause
    await page.waitForSelector('.ed-form-fill-paused-notice', { timeout: 10000 });
    
    // Advance step
    await page.click('#ed-form-fill-step-next');
    
    // Should pause again
    await page.waitForSelector('.ed-form-fill-paused-notice', { timeout: 5000 });
    
    // Verify next action preview
    await expect(page.locator('.ed-form-fill-next-action')).toBeVisible();
  });
});

test.describe('Form Fill v1.1 - Re-render Abort', () => {
  test.beforeEach(async ({ page }) => {
    await injectEdExtension(page);
  });

  test('aborts when form re-renders mid-execution', async ({ page }) => {
    await page.goto('/spa-form.html');
    
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'Name': 'John',
      'Email': 'test@example.com',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    await approvePlan(page);
    
    // Wait for execution to start
    await page.waitForSelector('.ed-form-fill-progress', { timeout: 5000 });
    
    // Trigger re-render by blurring a field
    await page.focus('#name');
    await page.blur('#name');
    
    // Wait a bit for re-render to happen
    await page.waitForTimeout(200);
    
    // Verify abort
    await expect(page.locator('text=re-rendered')).toBeVisible({ timeout: 10000 });
    
    // Verify audit log
    const auditLog = await getAuditLog(page);
    expect(auditLog.length).toBeGreaterThan(0);
    expect(auditLog[0].abortReason).toBe('rerender');
  });
});

test.describe('Form Fill v1.1 - Confidence Gating', () => {
  test.beforeEach(async ({ page }) => {
    await injectEdExtension(page);
  });

  test('shows confidence badges in preview', async ({ page }) => {
    await page.goto('/basic-form.html');
    
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'First Name': 'John',
      'Last Name': 'Doe',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    
    // Verify confidence badges exist
    const confidenceBadges = page.locator('.ed-form-fill-preview-confidence');
    await expect(confidenceBadges.first()).toBeVisible();
  });
});

test.describe('Form Fill v1.1 - Sensitive Fields', () => {
  test.beforeEach(async ({ page }) => {
    await injectEdExtension(page);
  });

  test('marks sensitive fields as gated', async ({ page }) => {
    await page.goto('/sensitive-form.html');
    
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'Student Name': 'John Doe',
      'Attendance Status': 'present',
      'Assessment Outcome': 'pass',
      'Decision Status': 'approved',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    
    // Verify sensitive fields show lock icon
    const sensitiveFields = page.locator('.ed-form-fill-preview-item:has-text("🔒")');
    await expect(sensitiveFields.first()).toBeVisible();
    
    // Verify "Needs confirmation" status
    await expect(page.locator('text=Needs confirmation')).toBeVisible();
  });
});

test.describe('Form Fill v1.1 - Audit Logging', () => {
  test.beforeEach(async ({ page }) => {
    await injectEdExtension(page);
  });

  test('audit log contains no raw values', async ({ page }) => {
    await page.goto('/basic-form.html');
    
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john.doe@example.com',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    await approvePlan(page);
    
    // Wait for completion
    await page.waitForSelector('.ed-form-fill-impact', { timeout: 30000 });
    
    // Check audit log
    const auditLog = await getAuditLog(page);
    expect(auditLog.length).toBeGreaterThan(0);
    
    const entry = auditLog[0];
    const logString = JSON.stringify(entry);
    
    // Verify no raw values
    expect(logString).not.toContain('John');
    expect(logString).not.toContain('Doe');
    expect(logString).not.toContain('john.doe@example.com');
    
    // Verify field labels are present
    expect(entry.executionResults.length).toBeGreaterThan(0);
    expect(entry.executionResults[0].fieldLabel).toBeTruthy();
  });
});

test.describe('Form Fill v1.1 - Debug Bundle', () => {
  test.beforeEach(async ({ page }) => {
    await injectEdExtension(page);
    // Enable dev mode
    await page.addInitScript(() => {
      localStorage.setItem('ed_form_fill_dev', 'true');
    });
  });

  test('debug bundle contains no raw values', async ({ page }) => {
    await page.goto('/basic-form.html');
    
    await page.evaluate(() => {
      const event = new CustomEvent('ed:form-fill:open');
      window.dispatchEvent(event);
    });
    
    await waitForFormFillDialog(page);
    await fillInputData(page, {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john.doe@example.com',
    });
    
    await page.waitForSelector('.ed-form-fill-preview', { timeout: 10000 });
    await approvePlan(page);
    
    // Wait for completion
    await page.waitForSelector('.ed-form-fill-impact', { timeout: 30000 });
    
    // Click "Report Issue"
    await page.click('#ed-form-fill-report-issue');
    
    // Get clipboard content
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    
    const bundle = JSON.parse(clipboardText);
    
    // Verify no raw values
    const bundleString = JSON.stringify(bundle);
    expect(bundleString).not.toContain('John');
    expect(bundleString).not.toContain('Doe');
    expect(bundleString).not.toContain('john.doe@example.com');
    
    // Verify structure
    expect(bundle.diagnostics).toBeTruthy();
    expect(bundle.schema).toBeTruthy();
    expect(bundle.plan).toBeTruthy();
  });
});

