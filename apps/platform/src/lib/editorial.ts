import editorial from "@/data/editorial.json";
export type EditorialArticle = {
  title: string;
  excerpt: string;
  source: string;
  sourceUrl: string;
  body: string;
  reviewed: string;
};
export function getEditorial(slug: string): EditorialArticle | undefined {
  return Object.hasOwn(editorial, slug)
    ? (editorial as Record<string, EditorialArticle>)[slug]
    : undefined;
}
