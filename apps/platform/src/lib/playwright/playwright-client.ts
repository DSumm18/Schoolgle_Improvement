/**
 * Playwright Client - Manages browser instances and pages
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import type { AutomationAction } from './types';

export class PlaywrightClient {
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();
  private pages: Map<string, Page> = new Map();
  private isInitialized = false;

  /**
   * Initialize Playwright browser
   */
  async init(): Promise<void> {
    if (this.isInitialized && this.browser) {
      return;
    }

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('[PlaywrightClient] Failed to initialize:', error);
      throw new Error(`Failed to initialize Playwright: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get or create a page for a session
   */
  async getPage(sessionId?: string): Promise<Page> {
    if (!this.browser || !this.isInitialized) {
      await this.init();
    }

    const key = sessionId || 'default';

    // Return existing page if available
    if (this.pages.has(key)) {
      const page = this.pages.get(key)!;
      if (!page.isClosed()) {
        return page;
      }
      // Page was closed, remove it
      this.pages.delete(key);
    }

    // Create new context if needed
    if (!this.contexts.has(key)) {
      const context = await this.browser!.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      this.contexts.set(key, context);
    }

    // Create new page
    const context = this.contexts.get(key)!;
    const page = await context.newPage();
    this.pages.set(key, page);

    return page;
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string, sessionId?: string): Promise<void> {
    const page = await this.getPage(sessionId);
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  }

  /**
   * Take a screenshot
   */
  async screenshot(sessionId?: string, fullPage = true): Promise<Buffer> {
    const page = await this.getPage(sessionId);
    return await page.screenshot({
      fullPage,
      type: 'png',
    });
  }

  /**
   * Get page content (DOM snapshot)
   */
  async getContent(sessionId?: string): Promise<string> {
    const page = await this.getPage(sessionId);
    return await page.content();
  }

  /**
   * Execute a single action
   */
  async executeAction(action: AutomationAction, sessionId?: string): Promise<boolean> {
    const page = await this.getPage(sessionId);

    try {
      switch (action.type) {
        case 'click': {
          await page.click(action.selector, { timeout: 5000 });
          if (action.delay) {
            await page.waitForTimeout(action.delay);
          }
          return true;
        }

        case 'type': {
          await page.fill(action.selector, action.value);
          if (action.delay) {
            await page.waitForTimeout(action.delay);
          }
          return true;
        }

        case 'select': {
          await page.selectOption(action.selector, action.value);
          return true;
        }

        case 'navigate': {
          await page.goto(action.url, {
            waitUntil: action.waitUntil || 'networkidle',
            timeout: 30000,
          });
          return true;
        }

        case 'wait': {
          await page.waitForTimeout(action.duration);
          return true;
        }

        case 'scroll': {
          const amount = action.amount || 500;
          if (action.direction === 'down') {
            await page.evaluate((y) => window.scrollBy(0, y), amount);
          } else if (action.direction === 'up') {
            await page.evaluate((y) => window.scrollBy(0, -y), amount);
          } else if (action.direction === 'right') {
            await page.evaluate((x) => window.scrollBy(x, 0), amount);
          } else if (action.direction === 'left') {
            await page.evaluate((x) => window.scrollBy(-x, 0), amount);
          }
          return true;
        }

        case 'screenshot': {
          // Screenshot action is handled separately, but we can take one here
          await this.screenshot(sessionId, action.fullPage);
          return true;
        }

        default:
          console.warn(`[PlaywrightClient] Unknown action type: ${(action as any).type}`);
          return false;
      }
    } catch (error) {
      console.error(`[PlaywrightClient] Action failed: ${action.type}`, error);
      return false;
    }
  }

  /**
   * Close a session
   */
  async close(sessionId?: string): Promise<void> {
    const key = sessionId || 'default';

    // Close page
    if (this.pages.has(key)) {
      const page = this.pages.get(key)!;
      if (!page.isClosed()) {
        await page.close();
      }
      this.pages.delete(key);
    }

    // Close context
    if (this.contexts.has(key)) {
      const context = this.contexts.get(key)!;
      await context.close();
      this.contexts.delete(key);
    }
  }

  /**
   * Close all sessions and browser
   */
  async closeAll(): Promise<void> {
    // Close all pages and contexts
    for (const [key] of this.pages) {
      await this.close(key);
    }

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
let clientInstance: PlaywrightClient | null = null;

export function getPlaywrightClient(): PlaywrightClient {
  if (!clientInstance) {
    clientInstance = new PlaywrightClient();
  }
  return clientInstance;
}

