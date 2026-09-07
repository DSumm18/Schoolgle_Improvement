import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ModulePageTemplate from "@/components/website/ModulePageTemplate";
import { moduleContent } from "@/lib/moduleContent";
import { moduleThemes } from "@/lib/moduleThemes";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const theme = Object.hasOwn(moduleThemes, slug)
    ? moduleThemes[slug]
    : undefined;
  return {
    title: theme ? `${theme.name} | Schoolgle` : "Module not found | Schoolgle",
    description: theme?.outcome,
    alternates: { canonical: `https://www.schoolgle.co.uk/modules/${slug}` },
  };
}
export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const content = Object.hasOwn(moduleContent, slug)
    ? moduleContent[slug]
    : undefined;
  if (!content || !Object.hasOwn(moduleThemes, slug)) notFound();
  return <ModulePageTemplate moduleSlug={slug} {...content} />;
}
