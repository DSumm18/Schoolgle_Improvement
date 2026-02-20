/**
 * Website Knowledge Query API
 * Queries the scanned website knowledge base to answer visitor questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface QueryRequest {
  question: string;
  organizationId: string;
}

interface KnowledgeItem {
  page_url: string;
  page_title: string;
  content: string;
  headings: string[];
  content_type: string;
}

interface QueryResponse {
  answer: string;
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
  confidence: number;
}

/**
 * POST /api/ed/website-knowledge
 * Query the website knowledge base to answer visitor questions
 */
export async function POST(request: NextRequest) {
  try {
    const body: QueryRequest = await request.json();

    if (!body.question || !body.organizationId) {
      return NextResponse.json(
        { error: 'question and organizationId are required' },
        { status: 400 }
      );
    }

    const { question, organizationId } = body;

    // Clean the question - extract key terms
    const questionLower = question.toLowerCase();
    const searchTerms = extractSearchTerms(questionLower);

    console.log('[Website Knowledge] Querying for:', searchTerms);

    // Query the knowledge base using full-text search
    const supabase = await createServerSupabaseClient();

    let matches: KnowledgeItem[] = [];
    const seenUrls = new Set<string>();

    // Helper function to add matches without duplicates
    const addMatches = (items: KnowledgeItem[] | null) => {
      if (!items) return;
      for (const item of items) {
        if (!seenUrls.has(item.page_url)) {
          seenUrls.add(item.page_url);
          matches.push(item);
        }
      }
    };

    // Helper: URL encode search term for matching URL parameters
    const urlEncodeTerm = (term: string) => {
      return term.replace(/\s+/g, '+').replace(/'/g, '');
    };

    // STRATEGY 0 (HIGHEST PRIORITY): URL title parameter extraction for this CMS (?title=Term&pid=X)
    // This runs FIRST because it's the most accurate for this CMS pattern
    const { data: allPages } = await supabase
      .from('ed_website_knowledge')
      .select('page_url, page_title, content, headings, content_type')
      .eq('organization_id', organizationId)
      .limit(200);

    if (allPages) {
      // Extract titles from URLs and match against search terms
      for (const page of allPages) {
        if (seenUrls.has(page.page_url)) continue;

        const urlMatch = page.page_url.match(/[?&]title=([^&]+)/);
        if (urlMatch) {
          const urlTitle = decodeURIComponent(urlMatch[1]).toLowerCase();
          const urlTitleOriginal = decodeURIComponent(urlMatch[1]);

          // Check if ANY search term matches the URL title (exact or partial)
          const matchesTerm = searchTerms.some(term =>
            urlTitle.includes(term.toLowerCase()) ||
            urlTitleOriginal.toLowerCase().includes(term.toLowerCase())
          );

          // Also check if the complete query phrase matches
          const queryMatches = urlTitle.includes(questionLower) ||
                              urlTitleOriginal.toLowerCase().includes(questionLower);

          if (matchesTerm || queryMatches) {
            console.log(`[Website Knowledge] URL title match: "${urlTitleOriginal}" -> ${page.page_url}`);
            seenUrls.add(page.page_url);
            matches.push(page);
          }
        }
      }
    }

    console.log(`[Website Knowledge] After URL title extraction: ${matches.length} matches`);

    // STRATEGY 1: Try combined URL searches for multi-word phrases (e.g., "curriculum+policies")
    if (searchTerms.length >= 2) {
      // Try 2-word combinations
      for (let i = 0; i < searchTerms.length - 1; i++) {
        const combined = urlEncodeTerm(searchTerms[i] + '+' + searchTerms[i + 1]);
        const { data: combinedMatch } = await supabase
          .from('ed_website_knowledge')
          .select('page_url, page_title, content, headings, content_type')
          .eq('organization_id', organizationId)
          .ilike('page_url', `%${combined}%`)
          .limit(5);
        addMatches(combinedMatch);
      }
    }

    // STRATEGY 2: Search in URL with simple ILIKE (less accurate, runs later)
    for (const term of searchTerms) {
      const { data: urlMatch } = await supabase
        .from('ed_website_knowledge')
        .select('page_url, page_title, content, headings, content_type')
        .eq('organization_id', organizationId)
        .ilike('page_url', `%${term}%`)
        .limit(10);
      addMatches(urlMatch);

      // Also try URL-encoded version
      const encodedTerm = urlEncodeTerm(term);
      if (encodedTerm !== term) {
        const { data: encodedMatch } = await supabase
          .from('ed_website_knowledge')
          .select('page_url, page_title, content, headings, content_type')
          .eq('organization_id', organizationId)
          .ilike('page_url', `%${encodedTerm}%`)
          .limit(10);
        addMatches(encodedMatch);
      }
    }

    console.log(`[Website Knowledge] After URL searches: ${matches.length} matches`);

    // STRATEGY 3: Search in page_title field (decoded stored titles)
    for (const term of searchTerms) {
      const { data: titleMatch } = await supabase
        .from('ed_website_knowledge')
        .select('page_url, page_title, content, headings, content_type')
        .eq('organization_id', organizationId)
        .ilike('page_title', `%${term}%`)
        .limit(10);
      addMatches(titleMatch);
    }

    // STRATEGY 4: Search in content and headings (full text - more expensive)
    for (const term of searchTerms) {
      const { data: contentMatch } = await supabase
        .from('ed_website_knowledge')
        .select('page_url, page_title, content, headings, content_type')
        .eq('organization_id', organizationId)
        .or(`content.ilike.%${term}%,headings.ilike.%${term}%`)
        .limit(10);
      addMatches(contentMatch);
    }

    // STRATEGY 5: Smart keyword-based content type detection
    // Only runs if we need more results
    if (matches.length < 8) {
      if (questionLower.includes('policy') || questionLower.includes('policies')) {
        // For policy queries, specifically look for pages with "Policies" in the URL title
        const { data: policyPages } = await supabase
          .from('ed_website_knowledge')
          .select('page_url, page_title, content, headings, content_type')
          .eq('organization_id', organizationId)
          .or(`page_url.ilike.%title=Policies%,page_url.ilike.%title=Curriculum%20Policies%,page_url.ilike.%title=General%20Policies%`)
          .limit(20);
        addMatches(policyPages);
      } else if (questionLower.includes('news') || questionLower.includes('event') || questionLower.includes('newsletter')) {
        const { data: newsPages } = await supabase
          .from('ed_website_knowledge')
          .select('page_url, page_title, content, headings, content_type')
          .eq('organization_id', organizationId)
          .eq('content_type', 'news')
          .limit(10);
        addMatches(newsPages);
      } else if (questionLower.includes('term') || questionLower.includes('holiday') || questionLower.includes('date')) {
        const { data: datePages } = await supabase
          .from('ed_website_knowledge')
          .select('page_url, page_title, content, headings, content_type')
          .eq('organization_id', organizationId)
          .or(`page_title.ilike.%Term%,page_title.ilike.%Date%,page_title.ilike.%Calendar%`)
          .limit(5);
        addMatches(datePages);
      } else if (questionLower.includes('staff') || questionLower.includes('teacher')) {
        const { data: staffPages } = await supabase
          .from('ed_website_knowledge')
          .select('page_url, page_title, content, headings, content_type')
          .eq('organization_id', organizationId)
          .ilike('page_title', '%Staff%')
          .limit(5);
        addMatches(staffPages);
      } else if (questionLower.includes('govern') || questionLower.includes('governor')) {
        const { data: govPages } = await supabase
          .from('ed_website_knowledge')
          .select('page_url, page_title, content, headings, content_type')
          .eq('organization_id', organizationId)
          .ilike('page_title', '%Governance%')
          .limit(5);
        addMatches(govPages);
      } else if (questionLower.includes('ofsted')) {
        const { data: ofstedPages } = await supabase
          .from('ed_website_knowledge')
          .select('page_url, page_title, content, headings, content_type')
          .eq('organization_id', organizationId)
          .ilike('page_title', '%Ofsted%')
          .limit(5);
        addMatches(ofstedPages);
      }
    }

    // STRATEGY 6: Fallback - return most recent pages if no matches
    if (matches.length === 0) {
      const { data: recentMatches } = await supabase
        .from('ed_website_knowledge')
        .select('page_url, page_title, content, headings, content_type')
        .eq('organization_id', organizationId)
        .order('last_scanned', { ascending: false })
        .limit(10);
      addMatches(recentMatches);
    }

    console.log(`[Website Knowledge] Found ${matches.length} matches for:`, searchTerms);

    // Build response from matches
    const sources = matches.map(m => ({
      url: m.page_url,
      title: m.page_title,
      snippet: m.content.substring(0, 200) + '...',
    }));

    // Generate answer from sources
    const answer = generateAnswer(question, matches);

    const response: QueryResponse = {
      answer,
      sources,
      confidence: matches.length > 0 ? 0.8 : 0.3,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Website Knowledge] Query error:', error);

    return NextResponse.json(
      {
        answer: "I'm sorry, I couldn't find that information on the school website. You might want to contact the school office directly.",
        sources: [],
        confidence: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * Extract search terms from a question
 */
function extractSearchTerms(question: string): string[] {
  // Remove common question words
  const stopWords = new Set([
    'what', 'where', 'when', 'who', 'how', 'why', 'is', 'are', 'do', 'does',
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or',
    'can', 'could', 'would', 'should', 'i', 'you', 'we', 'they',
    'your', 'my', 'our', 'their', 'school', 'please', 'help', 'know',
    'find', 'looking', 'need', 'want', 'tell', 'show', 'give',
  ]);

  // Split into words and filter stop words
  const words = question
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  return [...new Set(words)];
}

/**
 * Generate an answer from knowledge base matches
 */
function generateAnswer(question: string, matches: KnowledgeItem[]): string {
  if (matches.length === 0) {
    return "I'm sorry, I couldn't find that information on the school website. You might want to contact the school office directly.";
  }

  const questionLower = question.toLowerCase();

  // Check for common question types
  if (questionLower.includes('phone') || questionLower.includes('call') || questionLower.includes('contact')) {
    const contactPage = matches.find(m => m.page_url.includes('contact') || m.page_title.toLowerCase().includes('contact'));
    if (contactPage) {
      const phoneMatch = contactPage.content.match(/(?:0[1-9]|\\+44)[\d\s]{9,10}/);
      if (phoneMatch) {
        return `You can contact the school by phone at ${phoneMatch[0]}. You can find more contact details on their contact page.`;
      }
    }
  }

  if (questionLower.includes('address') || questionLower.includes('location') || questionLower.includes('where')) {
    const contactPage = matches.find(m => m.page_url.includes('contact'));
    if (contactPage) {
      return `The school's address can be found on their contact page. Would you like me to provide the link?`;
    }
  }

  if (questionLower.includes('term') || questionLower.includes('holiday') || questionLower.includes('date')) {
    const termPage = matches.find(m => m.page_url.includes('term') || m.page_url.includes('calendar'));
    if (termPage) {
      return `Term dates and holiday information are available on the school's calendar page. You can find all important dates there.`;
    }
  }

  if (questionLower.includes('admission') || questionLower.includes('enrol') || questionLower.includes('apply')) {
    const admissionsPage = matches.find(m => m.page_url.includes('admission') || m.page_url.includes('admissions'));
    if (admissionsPage) {
      return `For admissions information, please visit the school's admissions page. They have all the details about how to apply.`;
    }
  }

  // Special handling for policies questions
  if (questionLower.includes('polic') || questionLower.includes('policies')) {
    const policyPages = matches.filter(m =>
      m.page_url.includes('title=Policies') ||
      m.page_url.includes('title=Curriculum') ||
      m.page_url.includes('title=General') ||
      m.page_title.toLowerCase().includes('polic')
    );

    if (policyPages.length > 0) {
      const titles = policyPages.map(p => p.page_title).filter(Boolean).slice(0, 5);
      if (titles.length > 0) {
        return `I found the school's policy information on their website. They have pages for: ${titles.join(', ')}. Each policy page contains the full policy documents you can view or download.`;
      }
    }
  }

  // Default: provide a helpful response based on what we found
  if (matches.length === 1) {
    const match = matches[0];
    return `I found information about "${match.page_title}" on the school website. ${match.headings.length > 0 ? `It covers: ${match.headings.slice(0, 3).join(', ')}.` : ''} Would you like me to tell you more?`;
  }

  // Multiple matches - offer options
  const topPages = matches.slice(0, 3);
  return `I found several pages that might help: ${topPages.map(p => p.page_title).join(', ')}. Would you like me to tell you more about any of these?`;
}