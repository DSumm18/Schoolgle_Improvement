/**
 * Generate insight article content using Claude Sonnet.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-insights.ts
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-insights.ts --slug=eef-teaching-learning-toolkit-guide
 *
 * Articles are written to content/insights/{slug}.md
 * They are free research articles — factual, evidence-backed, no hard selling.
 * The newsletter (paid) layer adds "what it means" commentary separately.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

// Import insights data at build time — we read the TS file directly
const INSIGHTS_FILE = path.resolve(
  __dirname,
  "../apps/platform/src/data/insights.ts",
);
const CONTENT_DIR = path.resolve(__dirname, "../content/insights");

interface InsightMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category?: string;
  module?: string;
  tags?: string[];
  source?: string;
  sourceUrl?: string;
  readTime?: string;
  relatedApp?: string;
}

// Parse insights from the TS file (simple regex extraction)
function parseInsights(): InsightMeta[] {
  const content = fs.readFileSync(INSIGHTS_FILE, "utf-8");

  const results: InsightMeta[] = [];
  // Match each object in the insights array
  const objectRegex = /\{\s*slug:\s*"([^"]+)"[\s\S]*?\}/g;
  let match;

  while ((match = objectRegex.exec(content)) !== null) {
    const block = match[0];
    const get = (key: string): string | undefined => {
      const m = block.match(new RegExp(`${key}:\\s*"([^"]*)"`, "s"));
      return m?.[1];
    };

    const slug = get("slug");
    if (!slug) continue;

    const status = get("status");
    if (status !== "published") continue;

    results.push({
      slug,
      title: get("title") || slug,
      excerpt: get("excerpt") || "",
      date: get("date") || "",
      category: get("category"),
      module: get("module"),
      source: get("source"),
      sourceUrl: get("sourceUrl"),
      readTime: get("readTime"),
      relatedApp: get("relatedApp"),
    });
  }

  return results;
}

async function generateArticle(
  client: Anthropic,
  insight: InsightMeta,
): Promise<string> {
  const moduleContext: Record<string, string> = {
    estates:
      "Schoolgle Estates & Compliance module helps schools manage statutory checks, maintenance logs, and building condition monitoring.",
    compliance:
      "Schoolgle Compliance module tracks statutory requirements, risk assessments, and regulatory deadlines.",
    teaching:
      "Schoolgle Teaching & Learning module helps with lesson planning, curriculum alignment, CPD tracking, and evidence-based practice using frameworks like the EEF Teaching & Learning Toolkit.",
    improvement:
      "Schoolgle School Improvement module provides automated evidence mapping, SEF narrative generation, action plan tracking, and inspection readiness dashboards.",
    hr: "Schoolgle HR & People module manages staff reviews, objectives, absence tracking, and return-to-work processes.",
    finance:
      "Schoolgle Finance module handles budget planning, benchmarking, invoice management, and financial reporting.",
    send: "Schoolgle SEND & Inclusion module supports IEP management, evidence tracking, scaffolding tools, and EHCP processes.",
    governance:
      "Schoolgle Governance module provides board reporting, MAT oversight, meeting minutes, and trustee dashboards.",
  };

  const appContext = insight.module ? moduleContext[insight.module] || "" : "";

  const prompt = `Write a detailed, evidence-backed article for UK school leaders (Headteachers, School Business Managers, MAT leaders).

ARTICLE METADATA:
- Title: ${insight.title}
- Summary: ${insight.excerpt}
- Category: ${insight.category || "guide"}
- Module area: ${insight.module || "general"}
- Source: ${insight.source || "N/A"}
- Source URL: ${insight.sourceUrl || "N/A"}

WRITING GUIDELINES:
1. Write in British English. Audience is busy school leaders — be direct, practical, evidence-backed.
2. Use real statistics, research findings, and regulatory references where relevant.
3. Structure with clear H2 and H3 headings. Use bullet points for actionable items.
4. Length: 1200-1800 words (${insight.readTime || "6 min"} reading time).
5. Include a "Key Takeaways" section at the end with 3-5 bullet points.
6. If there is a source, cite it properly and reference specific findings.
7. This is a FREE research article — not a sales page. Be genuinely useful.

SOFT SELL (subtle, end of article only):
${appContext ? `At the very end, include ONE short paragraph (2-3 sentences max) mentioning how ${appContext} This should feel natural, not forced — like "Tools like Schoolgle's [module] can help automate this process." Never use exclamation marks or hard-sell language.` : "No product mentions needed for this article."}

FORMAT:
- Output clean HTML (not markdown). Use <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong> tags.
- Do NOT include the title (it's rendered separately).
- Do NOT include any wrapper div or article tags.
- Start directly with the first paragraph or section.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return text;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const insights = parseInsights();

  // Check for --slug flag
  const slugArg = process.argv.find((a) => a.startsWith("--slug="));
  const targetSlug = slugArg?.split("=")[1];

  const toGenerate = targetSlug
    ? insights.filter((i) => i.slug === targetSlug)
    : insights;

  if (toGenerate.length === 0) {
    console.error(
      targetSlug
        ? `No published insight found with slug: ${targetSlug}`
        : "No published insights found",
    );
    process.exit(1);
  }

  // Ensure content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  console.log(`Generating ${toGenerate.length} article(s)...\n`);

  for (const insight of toGenerate) {
    const outputPath = path.join(CONTENT_DIR, `${insight.slug}.html`);

    // Skip if already exists (unless targeting specific slug)
    if (!targetSlug && fs.existsSync(outputPath)) {
      console.log(`  SKIP ${insight.slug} (already exists)`);
      continue;
    }

    console.log(`  GENERATING ${insight.slug}...`);

    try {
      const html = await generateArticle(client, insight);
      fs.writeFileSync(outputPath, html, "utf-8");
      console.log(`  DONE ${insight.slug} (${outputPath})`);
    } catch (error: any) {
      console.error(`  ERROR ${insight.slug}: ${error.message}`);
    }

    // Rate limiting — small delay between calls
    if (toGenerate.indexOf(insight) < toGenerate.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("\nAll done!");
}

main();
