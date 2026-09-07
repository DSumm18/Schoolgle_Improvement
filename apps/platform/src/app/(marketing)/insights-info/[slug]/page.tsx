import { permanentRedirect, notFound } from "next/navigation";
import { getInsightBySlug } from "@/data/insights";
import { getEditorial } from "@/lib/editorial";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getEditorial(slug) || getInsightBySlug(slug)?.status !== "published")
    notFound();
  permanentRedirect(`/insights/${slug}`);
}
