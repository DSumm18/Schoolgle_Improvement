/**
 * Extract interactive tools from newsletter HTML files into standalone pages.
 *
 * Usage: npx tsx scripts/extract-tools.ts
 *
 * Reads each newsletter, extracts the tool-card section + its JS,
 * and creates standalone HTML files in content/tools/
 */

import * as fs from "fs";
import * as path from "path";

const NEWSLETTERS_DIR = path.resolve(__dirname, "../content/newsletters");
const TOOLS_DIR = path.resolve(__dirname, "../content/tools");

interface ToolDef {
  week: number;
  file: string;
  toolId: string;
  outputName: string;
  title: string;
}

const TOOLS: ToolDef[] = [
  {
    week: 1,
    file: "week-01.html",
    toolId: "ofsted-tool",
    outputName: "ofsted-explorer",
    title: "Ofsted Report Card Explorer",
  },
  {
    week: 2,
    file: "week-02.html",
    toolId: "send-tool",
    outputName: "send-funding-explorer",
    title: "SEND Funding Explorer",
  },
  {
    week: 3,
    file: "week-03.html",
    toolId: "census-tool",
    outputName: "census-checker",
    title: "Spring Census Checker",
  },
  {
    week: 4,
    file: "week-04.html",
    toolId: "send-tool",
    outputName: "send-placement-explorer",
    title: "SEND Placement Explorer",
  },
  {
    week: 5,
    file: "week-05.html",
    toolId: "breakfast-tool",
    outputName: "breakfast-club-calculator",
    title: "Breakfast Club Calculator",
  },
  {
    week: 6,
    file: "week-06.html",
    toolId: "ni-calc",
    outputName: "ni-cost-calculator",
    title: "NI Cost Calculator",
  },
  {
    week: 7,
    file: "week-07.html",
    toolId: "kcsie-checker",
    outputName: "kcsie-checker",
    title: "KCSIE Safeguarding Checker",
  },
  {
    week: 8,
    file: "week-08.html",
    toolId: "budget-calc",
    outputName: "budget-impact-calculator",
    title: "Budget Impact Calculator",
  },
  {
    week: 9,
    file: "week-09.html",
    toolId: "send-tool",
    outputName: "send-funding-explorer-v2",
    title: "SEND Funding Explorer",
  },
  {
    week: 10,
    file: "week-10.html",
    toolId: "workforce-tool",
    outputName: "workforce-calculator",
    title: "School Workforce Calculator",
  },
  {
    week: 11,
    file: "week-11.html",
    toolId: "ehcp-tool",
    outputName: "ehcp-readiness",
    title: "EHCP Readiness Snapshot",
  },
];

function extractTool(def: ToolDef): string | null {
  const filePath = path.join(NEWSLETTERS_DIR, def.file);
  if (!fs.existsSync(filePath)) {
    console.error(`  File not found: ${def.file}`);
    return null;
  }

  const html = fs.readFileSync(filePath, "utf-8");

  // Extract the CSS from the <style> block
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const css = styleMatch ? styleMatch[1] : "";

  // Extract the tool-card section by ID
  const toolStartPattern = new RegExp(
    `<div class="tool-card"[^>]*id="${def.toolId}"[^>]*>`,
  );
  const toolStartMatch = html.match(toolStartPattern);
  if (!toolStartMatch || toolStartMatch.index === undefined) {
    console.error(`  Tool card not found for ID: ${def.toolId} in ${def.file}`);
    return null;
  }

  // Find the matching closing div
  const startIdx = toolStartMatch.index;
  let depth = 0;
  let endIdx = startIdx;
  let i = startIdx;
  while (i < html.length) {
    if (html.slice(i).startsWith("<div")) {
      depth++;
      i += 4;
    } else if (html.slice(i).startsWith("</div>")) {
      depth--;
      if (depth === 0) {
        endIdx = i + 6;
        break;
      }
      i += 6;
    } else {
      i++;
    }
  }

  const toolHtml = html.slice(startIdx, endIdx);

  // Extract all <script> blocks (they contain the tool logic)
  const scripts: string[] = [];
  const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    scripts.push(scriptMatch[1]);
  }

  // Build standalone page
  const standalone = `<!DOCTYPE html>
<html lang="en-GB" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${def.title} — The Schoolgle Signal</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
<style>
${css}

/* Standalone overrides */
body { padding: 0; margin: 0; }
.issue-header, .toc-rail, .layout-wrapper > .toc-rail { display: none; }
.standalone-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px;
}
.standalone-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.standalone-header h1 {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 4px;
}
.standalone-header p {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0;
}
.standalone-header a {
  color: var(--accent);
  font-weight: 600;
  font-size: 0.8rem;
}
</style>
</head>
<body>
<div class="standalone-wrapper">
  <div class="standalone-header">
    <h1>${def.title}</h1>
    <p>From <a href="/insights/newsletter/week-${String(def.week).padStart(2, "0")}">The Schoolgle Signal — Week ${def.week}</a></p>
  </div>
  ${toolHtml}
</div>
<script>
${scripts.join("\n\n")}
</script>
</body>
</html>`;

  return standalone;
}

function main() {
  if (!fs.existsSync(TOOLS_DIR)) {
    fs.mkdirSync(TOOLS_DIR, { recursive: true });
  }

  console.log(`Extracting ${TOOLS.length} tools from newsletters...\n`);

  for (const def of TOOLS) {
    console.log(`  Extracting: ${def.title} (Week ${def.week})...`);
    const result = extractTool(def);
    if (result) {
      const outputPath = path.join(TOOLS_DIR, `${def.outputName}.html`);
      fs.writeFileSync(outputPath, result, "utf-8");
      console.log(`  DONE → ${outputPath}`);
    }
  }

  console.log("\nAll done!");
}

main();
