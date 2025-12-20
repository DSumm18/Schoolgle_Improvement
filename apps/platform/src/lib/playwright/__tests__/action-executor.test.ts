/**
 * Basic tests for ActionExecutor
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActionExecutor } from '../action-executor';
import { PlaywrightClient } from '../playwright-client';
import type { ClickAction, NavigateAction } from '../types';

describe('ActionExecutor', () => {
  let executor: ActionExecutor;
  let client: PlaywrightClient;

  beforeEach(() => {
    executor = new ActionExecutor();
    client = new PlaywrightClient();
  });

  afterEach(async () => {
    await client.closeAll();
  });

  it('should execute navigate action', async () => {
    await client.init();
    const actions: NavigateAction[] = [
      {
        type: 'navigate',
        url: 'https://example.com',
        description: 'Navigate to example.com',
      },
    ];

    const results = await executor.executeActions(actions);
    expect(results.length).toBe(1);
    expect(results[0].success).toBe(true);
  }, 30000);

  it('should handle action errors gracefully', async () => {
    await client.init();
    const actions: ClickAction[] = [
      {
        type: 'click',
        selector: '#nonexistent-element',
        description: 'Click non-existent element',
      },
    ];

    const results = await executor.executeActions(actions);
    expect(results.length).toBe(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toBeDefined();
  }, 30000);

  it('should take screenshot', async () => {
    await client.init();
    await client.navigate('https://example.com');
    const screenshot = await executor.takeScreenshot();
    expect(screenshot).toBeTruthy();
    expect(typeof screenshot).toBe('string');
  }, 30000);
});

