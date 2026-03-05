/**
 * Website Crawler Usage Examples
 *
 * This file demonstrates how to use the WebsiteCrawler class
 * to crawl school websites and extract content for the knowledge base.
 */

import { crawlWebsite, crawlSinglePage, WebsiteCrawler, type CrawlerConfig } from './website-crawler';

// ============================================
// Example 1: Basic Website Crawl
// ============================================
async function basicCrawlExample() {
  const result = await crawlWebsite('https://www.rawdon-st-peters.leeds.sch.uk', {
    maxPages: 20,
    requestDelay: 1000,
    sameDomainOnly: true
  });

  console.log(`Crawled ${result.stats.successfulPages} pages`);
  console.log(`Found ${result.stats.pdfsProcessed} PDFs`);
  console.log(`Total content: ${result.stats.totalContentSize} characters`);

  // Access crawled pages
  for (const page of result.pages) {
    console.log(`- ${page.title}: ${page.url}`);
    console.log(`  ${page.metadata.wordCount} words`);
  }

  // Check for errors
  if (result.errors.length > 0) {
    console.warn('Some pages failed to crawl:');
    for (const error of result.errors) {
      console.warn(`- ${error.url}: ${error.error}`);
    }
  }

  return result;
}

// ============================================
// Example 2: Crawl with Custom Configuration
// ============================================
async function customConfigExample() {
  const config: CrawlerConfig = {
    maxPages: 100,
    requestDelay: 2000, // Slower, more respectful
    sameDomainOnly: true,
    allowedDomains: ['trust-school.org.uk'], // Allow trust domain
    processPDFs: true,
    processDocuments: true,
    headless: true,
    maxPDFSize: 5 * 1024 * 1024, // 5MB limit
    excludePaths: [
      /^\/calendar/i,      // Skip calendar
      /^\/news/i,          // Skip news
      /^\/events/i         // Skip events
    ]
  };

  const result = await crawlWebsite('https://school.example.org', config);
  return result;
}

// ============================================
// Example 3: Single Page Extraction
// ============================================
async function singlePageExample() {
  const page = await crawlSinglePage('https://school.example.org/policies/safeguarding');

  if (page) {
    console.log('Title:', page.title);
    console.log('Content length:', page.content.length);
    console.log('Headings:', page.headings.map(h => `${'#'.repeat(h.level)} ${h.text}`));
    console.log('Links found:', page.links.length);
  }

  return page;
}

// ============================================
// Example 4: Advanced Crawler Instance
// ============================================
async function advancedCrawlExample() {
  const crawler = new WebsiteCrawler({
    maxPages: 50,
    requestDelay: 1500,
    sameDomainOnly: true,
    processPDFs: true,
    headless: true
  });

  try {
    // Start the crawl
    const result = await crawler.crawl('https://school.example.org');

    // Process results for knowledge base storage
    const knowledgeBaseEntries = result.pages.map(page => ({
      source: page.url,
      title: page.title,
      content: page.content,
      type: page.contentType,
      metadata: page.metadata,
      indexedAt: new Date().toISOString()
    }));

    // Store in your knowledge base system
    // await storeInKnowledgeBase(knowledgeBaseEntries);

    return knowledgeBaseEntries;
  } finally {
    // Browser is automatically closed, but you can track progress
    console.log('Final progress:', crawler.getProgress());
  }
}

// ============================================
// Example 5: Crawl Policies Section Only
// ============================================
async function policiesOnlyExample() {
  const crawler = new WebsiteCrawler({
    maxPages: 30,
    sameDomainOnly: true,
    excludePaths: [
      // Only crawl policies section
      /^(?!\/policies)/i
    ],
    processPDFs: true // Important for policy documents
  });

  const result = await crawler.crawl('https://school.example.org/policies');

  // Filter for PDFs only
  const policyPdfs = result.pages.filter(p => p.contentType === 'pdf');
  console.log(`Found ${policyPdfs.length} policy PDFs`);

  return result;
}

// ============================================
// Example 6: Error Handling
// ============================================
async function errorHandlingExample() {
  const crawler = new WebsiteCrawler({
    maxPages: 10,
    pageTimeout: 15000, // Shorter timeout
    requestDelay: 500
  });

  try {
    const result = await crawler.crawl('https://example.com');

    // Handle partial results
    if (result.stats.failedPages > 0) {
      console.warn(`${result.stats.failedPages} pages failed`);
      // You might want to retry failed URLs
    }

    return result;
  } catch (error) {
    console.error('Crawl failed completely:', error);
    throw error;
  }
}

// ============================================
// Example 7: Progress Tracking
// ============================================
async function progressTrackingExample() {
  const crawler = new WebsiteCrawler({
    maxPages: 100,
    requestDelay: 1000
  });

  // Start crawl in background
  const crawlPromise = crawler.crawl('https://school.example.org');

  // Poll for progress
  const progressInterval = setInterval(() => {
    const progress = crawler.getProgress();
    console.log(`Progress: ${progress.crawled} crawled, ${progress.queued} queued, ${progress.errors} errors`);
  }, 2000);

  // Wait for completion
  const result = await crawlPromise;
  clearInterval(progressInterval);

  console.log('Final stats:', result.stats);
  return result;
}

// ============================================
// Example 8: Store in Knowledge Base
// ============================================
async function storeInKnowledgeBaseExample() {
  const crawler = new WebsiteCrawler({
    maxPages: 50,
    processPDFs: true,
    sameDomainOnly: true
  });

  const result = await crawler.crawl('https://school.example.org');

  // Group by content type
  const htmlPages = result.pages.filter(p => p.contentType === 'html');
  const pdfs = result.pages.filter(p => p.contentType === 'pdf');
  const documents = result.pages.filter(p => p.contentType === 'document');

  console.log(`Crawled ${htmlPages.length} HTML pages, ${pdfs.length} PDFs, ${documents.length} documents`);

  // Return structured data for knowledge base
  return {
    source: 'website-crawl',
    domain: 'school.example.org',
    crawledAt: new Date().toISOString(),
    stats: result.stats,
    content: {
      pages: htmlPages.map(p => ({
        url: p.url,
        title: p.title,
        content: p.content,
        headings: p.headings,
        links: p.links,
        metadata: p.metadata
      })),
      pdfs: pdfs.map(p => ({
        url: p.url,
        title: p.title,
        content: p.content,
        pageCount: p.metadata.pageCount,
        fileSize: p.metadata.fileSize
      })),
      documents: documents.map(p => ({
        url: p.url,
        title: p.title
      }))
    }
  };
}

// Export examples for use in other files
export {
  basicCrawlExample,
  customConfigExample,
  singlePageExample,
  advancedCrawlExample,
  policiesOnlyExample,
  errorHandlingExample,
  progressTrackingExample,
  storeInKnowledgeBaseExample
};
