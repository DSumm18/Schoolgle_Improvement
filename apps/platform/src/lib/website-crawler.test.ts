/**
 * Tests for Website Crawler
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebsiteCrawler, crawlWebsite, crawlSinglePage } from './website-crawler';

describe('WebsiteCrawler', () => {
  describe('URL normalization', () => {
    it('should normalize URLs correctly', () => {
      const crawler = new WebsiteCrawler();

      // Access private method via type assertion for testing
      const normalizeUrl = (crawler as any).normalizeUrl.bind(crawler);

      expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
      expect(normalizeUrl('https://example.com/path#section')).toBe('https://example.com/path');
      expect(normalizeUrl('https://example.com/path/?query=1')).toBe('https://example.com/path/?query=1');
    });
  });

  describe('Domain extraction', () => {
    it('should extract domain correctly', () => {
      const crawler = new WebsiteCrawler();
      const extractDomain = (crawler as any).extractDomain.bind(crawler);

      expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
      expect(extractDomain('https://example.co.uk/page')).toBe('example.co.uk');
      expect(extractDomain('invalid-url')).toBe('');
    });
  });

  describe('URL filtering', () => {
    it('should filter out unwanted file extensions', () => {
      const crawler = new WebsiteCrawler({
        sameDomainOnly: true
      });

      // Set base domain
      (crawler as any).baseDomain = 'example.com';

      const isUrlAllowed = (crawler as any).isUrlAllowed.bind(crawler);

      // Should allow HTML pages
      expect(isUrlAllowed('https://example.com/page.html')).toBe(true);
      expect(isUrlAllowed('https://example.com/path')).toBe(true);

      // Should skip images
      expect(isUrlAllowed('https://example.com/image.jpg')).toBe(false);
      expect(isUrlAllowed('https://example.com/photo.png')).toBe(false);

      // Should skip videos
      expect(isUrlAllowed('https://example.com/video.mp4')).toBe(false);
    });

    it('should enforce same-domain restriction', () => {
      const crawler = new WebsiteCrawler({
        sameDomainOnly: true
      });

      (crawler as any).baseDomain = 'example.com';

      const isUrlAllowed = (crawler as any).isUrlAllowed.bind(crawler);

      // Should allow same domain
      expect(isUrlAllowed('https://example.com/page')).toBe(true);
      expect(isUrlAllowed('https://sub.example.com/page')).toBe(true);

      // Should block different domains
      expect(isUrlAllowed('https://other.com/page')).toBe(false);
      expect(isUrlAllowed('https://example.org/page')).toBe(false);
    });

    it('should allow additional domains when specified', () => {
      const crawler = new WebsiteCrawler({
        sameDomainOnly: true,
        allowedDomains: ['trusted-cdn.com']
      });

      (crawler as any).baseDomain = 'example.com';

      const isUrlAllowed = (crawler as any).isUrlAllowed.bind(crawler);

      // Should allow base domain
      expect(isUrlAllowed('https://example.com/page')).toBe(true);

      // Should allow trusted domain
      expect(isUrlAllowed('https://trusted-cdn.com/assets/style.css')).toBe(true);

      // Should block other domains
      expect(isUrlAllowed('https://random.com/page')).toBe(false);
    });

    it('should exclude specific path patterns', () => {
      const crawler = new WebsiteCrawler({
        excludePaths: [
          /^\/api\//i,
          /^\/admin\//i
        ]
      });

      (crawler as any).baseDomain = 'example.com';

      const isUrlAllowed = (crawler as any).isUrlAllowed.bind(crawler);

      // Should allow regular pages
      expect(isUrlAllowed('https://example.com/page')).toBe(true);
      expect(isUrlAllowed('https://example.com/about/contact')).toBe(true);

      // Should block API paths
      expect(isUrlAllowed('https://example.com/api/users')).toBe(false);

      // Should block admin paths
      expect(isUrlAllowed('https://example.com/admin/settings')).toBe(false);
    });
  });

  describe('Document type detection', () => {
    it('should detect PDF documents', () => {
      const crawler = new WebsiteCrawler();
      const isDocumentUrl = (crawler as any).isDocumentUrl.bind(crawler);

      expect(isDocumentUrl('https://example.com/file.pdf')).toBe('pdf');
      expect(isDocumentUrl('https://example.com/path/to/document.PDF')).toBe('pdf');
    });

    it('should detect other document types', () => {
      const crawler = new WebsiteCrawler();
      const isDocumentUrl = (crawler as any).isDocumentUrl.bind(crawler);

      expect(isDocumentUrl('https://example.com/file.doc')).toBe('document');
      expect(isDocumentUrl('https://example.com/file.docx')).toBe('document');
      expect(isDocumentUrl('https://example.com/file.xlsx')).toBe('document');
      expect(isDocumentUrl('https://example.com/file.ppt')).toBe('document');
      expect(isDocumentUrl('https://example.com/file.pptx')).toBe('document');
    });

    it('should return null for non-document URLs', () => {
      const crawler = new WebsiteCrawler();
      const isDocumentUrl = (crawler as any).isDocumentUrl.bind(crawler);

      expect(isDocumentUrl('https://example.com/page')).toBe(null);
      expect(isDocumentUrl('https://example.com/file.html')).toBe(null);
      expect(isDocumentUrl('https://example.com/image.jpg')).toBe(null);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const crawler = new WebsiteCrawler();

      expect((crawler as any).config.maxPages).toBe(50);
      expect((crawler as any).config.requestDelay).toBe(1000);
      expect((crawler as any).config.sameDomainOnly).toBe(true);
    });

    it('should merge custom configuration with defaults', () => {
      const crawler = new WebsiteCrawler({
        maxPages: 100,
        requestDelay: 500
      });

      expect((crawler as any).config.maxPages).toBe(100);
      expect((crawler as any).config.requestDelay).toBe(500);
      // Should keep other defaults
      expect((crawler as any).config.sameDomainOnly).toBe(true);
      expect((crawler as any).config.pageTimeout).toBe(30000);
    });
  });

  describe('Progress tracking', () => {
    it('should report correct progress', () => {
      const crawler = new WebsiteCrawler();

      // Initially no progress
      expect(crawler.getProgress()).toEqual({
        crawled: 0,
        queued: 0,
        errors: 0
      });

      // Simulate some activity by accessing private members
      (crawler as any).crawledUrls.add('https://example.com/page1');
      (crawler as any).crawledUrls.add('https://example.com/page2');
      (crawler as any).queuedUrls.add('https://example.com/page3');
      (crawler as any).crawlErrors.push({ url: 'https://example.com/error', error: 'Not found', timestamp: new Date().toISOString() });

      expect(crawler.getProgress()).toEqual({
        crawled: 2,
        queued: 1,
        errors: 1
      });
    });
  });
});

describe('Convenience functions', () => {
  it('crawlWebsite should create a new crawler instance', async () => {
    // This is a basic smoke test - the actual crawling would require
    // a real server or extensive mocking
    const crawlerPromise = crawlWebsite('https://example.com', {
      maxPages: 1,
      pageTimeout: 5000
    });

    // The function should return a promise
    expect(crawlerPromise).toBeInstanceOf(Promise);

    // We don't await it because it would try to actually connect
    // In a real test environment, you'd use a mock server like NTL
  });

  it('crawlSinglePage should create a new crawler instance', async () => {
    const pagePromise = crawlSinglePage('https://example.com', {
      pageTimeout: 5000
    });

    expect(pagePromise).toBeInstanceOf(Promise);
  });
});
