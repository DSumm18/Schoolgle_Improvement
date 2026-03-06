import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ week: string }> | { week: string } },
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { week } = resolvedParams;

    if (!week || !/^week-\d{2}$/.test(week)) {
      return new NextResponse("Invalid week format", { status: 400 });
    }

    const rootDir = path.resolve(process.cwd(), "..", "..");
    const filePath = path.join(
      rootDir,
      "content",
      "newsletters",
      `${week}.html`,
    );

    if (!fs.existsSync(filePath)) {
      return new NextResponse(null, { status: 404 });
    }

    const html = fs.readFileSync(filePath, "utf-8");
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error loading newsletter content:", error);
    return new NextResponse("Failed to load content", { status: 500 });
  }
}
