import { NextResponse } from "next/server";
import { getEditorial } from "@/lib/editorial";
import { getInsightBySlug } from "@/data/insights";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const article = getEditorial(slug);
  if (!article || getInsightBySlug(slug)?.status !== "published")
    return new NextResponse(null, { status: 404 });
  return new NextResponse(article.body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
