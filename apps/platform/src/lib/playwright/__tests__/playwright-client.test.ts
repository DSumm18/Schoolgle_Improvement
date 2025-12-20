/**
 * Basic tests for PlaywrightClient
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlaywrightClient } from '../playwright-client';
import type { ClickAction, TypeAction } from '../types';

describe('PlaywrightClient', () => {
  let client: PlaywrightClient;

  beforeEach(() => {
    client = new PlaywrightClient();
  });

  afterEach(async () => {
    await client.closeAll();
  });

  it('should initialize browser', async () => {
    await client.init();
    expect(client).toBeDefined();
  }, 30000);

  it('should create a page', async () => {
    await client.init();
    const page = await client.getPage();
    expect(page).toBeDefined();
  }, 30000);

  it('should navigate to a URL', async () => {
    await client.init();
    await client.navigate('https://example.com');
    const page = await client.getPage();
    expect(page.url()).toContain('example.com');
  }, 30000);

  it('should take a screenshot', async () => {
    await client.init();
    await client.navigate('https://example.com');
    const screenshot = await client.screenshot();
    expect(screenshot).toBeInstanceOf(Buffer);
    expect(screenshot.length).toBeGreaterThan(0);
  }, 30000);

  it('should get page content', async () => {
    await client.init();
    await client.navigate('https://example.com');
    const content = await client.getContent();
    expect(content).toContain('html');
    expect(content).toContain('Example Domain');
  }, 30000);
});

