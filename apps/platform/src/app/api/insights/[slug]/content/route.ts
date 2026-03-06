import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

/**
 * Serves insight article content.
 * Looks for content in this order:
 * 1. content/insights/{slug}.html (generated articles)
 * 2. content/insights/{date-slug}/index.mdx (legacy MDX)
 * 3. content/insights/{slug}.md (legacy markdown)
 */

function findContent(slug: string): { html: string } | null {
  const insightsDir = [
    path.resolve(process.cwd(), "..", "..", "content", "insights"),
    path.resolve(process.cwd(), "content", "insights"),
    path.resolve(process.cwd(), "..", "content", "insights"),
  ].find((d) => fs.existsSync(d));

  if (!insightsDir) return null;

  if (!fs.existsSync(insightsDir)) return null;

  // Strategy 1: Direct HTML file
  const htmlPath = path.join(insightsDir, `${slug}.html`);
  if (fs.existsSync(htmlPath)) {
    return { html: fs.readFileSync(htmlPath, "utf-8") };
  }

  // Strategy 2: Date-prefixed folder with index.mdx/md
  const folders = fs
    .readdirSync(insightsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const folder of folders) {
    const folderWithoutDate = folder.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    if (folderWithoutDate === slug) {
      for (const ext of ["index.mdx", "index.md"]) {
        const filePath = path.join(insightsDir, folder, ext);
        if (fs.existsSync(filePath)) {
          // Basic markdown-to-HTML for .md files (strip frontmatter, convert basics)
          let raw = fs.readFileSync(filePath, "utf-8");
          // Strip frontmatter
          raw = raw.replace(/^---[\s\S]*?---\s*/, "");
          // Basic markdown conversion
          const html = raw
            .replace(/^### (.*$)/gm, "<h3>$1</h3>")
            .replace(/^## (.*$)/gm, "<h2>$1</h2>")
            .replace(/^# (.*$)/gm, "<h2>$1</h2>")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/^\- (.*$)/gm, "<li>$1</li>")
            .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
            .replace(/\n\n/g, "</p><p>")
            .replace(/^\[Content in development\]$/gm, "")
            .replace(/^(?!<[huplb])/gm, "")
            .trim();
          return { html: `<p>${html}</p>` };
        }
      }
    }
  }

  // Strategy 3: Direct .md file
  const mdPath = path.join(insightsDir, `${slug}.md`);
  if (fs.existsSync(mdPath)) {
    let raw = fs.readFileSync(mdPath, "utf-8");
    raw = raw.replace(/^---[\s\S]*?---\s*/, "");
    const html = raw
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h2>$1</h2>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "</p><p>")
      .trim();
    return { html: `<p>${html}</p>` };
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } },
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { slug } = resolvedParams;

    if (!slug) {
      return new NextResponse("Missing slug", { status: 400 });
    }

    const result = findContent(slug);

    if (!result) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(result.html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error loading insight content:", error);
    return new NextResponse("Failed to load content", { status: 500 });
  }
}
