import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

/** Map tool IDs from tools.json to their content file names */
const TOOL_FILE_MAP: Record<string, string> = {
  "ofsted-explorer": "ofsted-explorer.html",
  "send-funding-explorer": "send-funding-explorer.html",
  "census-checker": "census-checker.html",
  "send-placement-explorer": "send-placement-explorer.html",
  "breakfast-club-calculator": "breakfast-club-calculator.html",
  "ni-cost-calculator": "ni-cost-calculator.html",
  "kcsie-safeguarding-checker": "kcsie-checker.html",
  "budget-impact-calculator": "budget-impact-calculator.html",
  "workforce-calculator": "workforce-calculator.html",
  "ehcp-readiness-snapshot": "ehcp-readiness.html",
  "deal-finder": "deal-finder.html",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> | { toolId: string } },
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { toolId } = resolvedParams;

    const fileName = TOOL_FILE_MAP[toolId];
    if (!fileName) {
      return new NextResponse("Tool not found", { status: 404 });
    }

    const rootDir = path.resolve(process.cwd(), "..", "..");
    const filePath = path.join(rootDir, "content", "tools", fileName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse(null, { status: 404 });
    }

    const html = fs.readFileSync(filePath, "utf-8");
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error loading tool content:", error);
    return new NextResponse("Failed to load tool", { status: 500 });
  }
}
