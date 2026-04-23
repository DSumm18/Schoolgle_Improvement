/**
 * PageScan - Read and analyze page content
 */

export interface PageContent {
  title: string;
  description: string;
  mainContent: string;
  headings: string[];
  links: Array<{ text: string; href: string }>;
  forms: number;
  pageType: 'admissions' | 'contact' | 'about' | 'news' | 'general';
}

export class PageScanner {
  /**
   * Scan the current page and extract relevant content
   */
  public scan(): PageContent {
    return {
      title: this.getTitle(),
      description: this.getDescription(),
      mainContent: this.getMainContent(),
      headings: this.getHeadings(),
      links: this.getImportantLinks(),
      forms: this.countForms(),
      pageType: this.detectPageType(),
    };
  }

  /**
   * Get page title
   */
  private getTitle(): string {
    return (
      document.title ||
      document.querySelector('h1')?.textContent?.trim() ||
      ''
    );
  }

  /**
   * Get meta description
   */
  private getDescription(): string {
    const meta = document.querySelector('meta[name="description"]');
    return meta?.getAttribute('content') || '';
  }

  /**
   * Extract main content from the page
   */
  private getMainContent(): string {
    // Try to find main content area
    const mainSelectors = [
      'main',
      '[role="main"]',
      '#content',
      '.content',
      '#main',
      '.main',
      'article',
    ];

    for (const selector of mainSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return this.extractText(element as HTMLElement, 500);
      }
    }

    // Fallback to body
    return this.extractText(document.body, 500);
  }

  /**
   * Get all headings on the page
   */
  private getHeadings(): string[] {
    const headings: string[] = [];
    const elements = document.querySelectorAll('h1, h2, h3');

    elements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && !headings.includes(text)) {
        headings.push(text);
      }
    });

    return headings.slice(0, 10);
  }

  /**
   * Get important links on the page
   */
  private getImportantLinks(): Array<{ text: string; href: string }> {
    const links: Array<{ text: string; href: string }> = [];
    const anchors = document.querySelectorAll('a[href]');

    const importantKeywords = [
      'admission',
      'apply',
      'enrol',
      'contact',
      'form',
      'register',
      'calendar',
      'term',
      'policy',
      'uniform',
      'fee',
    ];

    anchors.forEach((anchor) => {
      const text = anchor.textContent?.trim() || '';
      const href = anchor.getAttribute('href') || '';

      if (text && href && !href.startsWith('#')) {
        const lowerText = text.toLowerCase();
        const lowerHref = href.toLowerCase();

        if (
          importantKeywords.some(
            (kw) => lowerText.includes(kw) || lowerHref.includes(kw)
          )
        ) {
          links.push({ text, href });
        }
      }
    });

    return links.slice(0, 10);
  }

  /**
   * Count forms on the page
   */
  private countForms(): number {
    return document.querySelectorAll('form').length;
  }

  /**
   * Detect page type based on content
   */
  private detectPageType(): PageContent['pageType'] {
    const url = window.location.href.toLowerCase();
    const title = this.getTitle().toLowerCase();
    const content = this.getMainContent().toLowerCase();

    if (
      url.includes('admission') ||
      title.includes('admission') ||
      content.includes('admission')
    ) {
      return 'admissions';
    }

    if (
      url.includes('contact') ||
      title.includes('contact') ||
      content.includes('contact us')
    ) {
      return 'contact';
    }

    if (
      url.includes('about') ||
      title.includes('about') ||
      content.includes('about our school')
    ) {
      return 'about';
    }

    if (
      url.includes('news') ||
      url.includes('blog') ||
      title.includes('news')
    ) {
      return 'news';
    }

    return 'general';
  }

  /**
   * Extract text from element, limited to max length
   */
  private extractText(element: HTMLElement, maxLength: number): string {
    // Clone to avoid modifying the page
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove scripts, styles, and hidden elements
    clone.querySelectorAll('script, style, noscript, [hidden]').forEach((el) => el.remove());

    // Get text content
    let text = clone.textContent || '';

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Limit length
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }

    return text;
  }

  /**
   * Get context for AI based on current page
   */
  public getContextForAI(): string {
    const content = this.scan();

    return `Current page: ${content.title}
Page type: ${content.pageType}
Has forms: ${content.forms > 0 ? 'Yes' : 'No'}
Key headings: ${content.headings.join(', ')}
Important links: ${content.links.map((l) => l.text).join(', ')}
Summary: ${content.mainContent.substring(0, 200)}`;
  }
}

// Export singleton
export const pageScanner = new PageScanner();

