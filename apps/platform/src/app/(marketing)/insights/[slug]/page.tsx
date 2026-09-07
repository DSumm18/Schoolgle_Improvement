import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getInsightBySlug, getInsightsByModule } from "@/data/insights";
import { getEditorial } from "@/lib/editorial";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getEditorial(slug);
  return {
    title: article
      ? `${article.title} | Schoolgle`
      : "Article not found | Schoolgle",
    description: article?.excerpt,
    alternates: { canonical: `https://www.schoolgle.co.uk/insights/${slug}` },
    openGraph: {
      title: article?.title,
      description: article?.excerpt,
      type: "article",
    },
  };
}
export default async function InsightPage({ params }: Props) {
  const { slug } = await params;
  const article = getEditorial(slug);
  const meta = getInsightBySlug(slug);
  if (!article || !meta || meta.status !== "published") notFound();
  const related = meta.module
    ? getInsightsByModule(meta.module)
        .filter((a) => a.slug !== slug)
        .slice(0, 3)
    : [];
  const headings = [...article.body.matchAll(/<h2>(.*?)<\/h2>/g)].map(
    (m) => m[1],
  );
  let index = 0;
  const html = article.body.replace(
    /<h2>/g,
    () => `<h2 id="section-${index++}" style="scroll-margin-top:110px">`,
  );
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    dateModified: article.reviewed,
    author: { "@type": "Organization", name: "Schoolgle" },
    publisher: { "@type": "Organization", name: "Schoolgle" },
    mainEntityOfPage: `https://www.schoolgle.co.uk/insights/${slug}`,
  };
  return (
    <main>
      <article className="sg-wrap py-12 md:py-20" style={{ maxWidth: 820 }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
        <Link href="/insights" className="sg-text-link mb-10">
          <ArrowLeft size={16} />
          All insights
        </Link>
        <p className="sg-eyebrow">
          {article.format === "briefing"
            ? "The Schoolgle briefing"
            : "The Schoolgle notebook"}
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
          {article.title}
        </h1>
        <p className="text-xl text-muted-foreground mt-6 leading-relaxed">
          {article.excerpt}
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-b border-border py-6">
          <span>Schoolgle editorial</span>
          <span>
            Reviewed{" "}
            {new Date(`${article.reviewed}T12:00:00Z`).toLocaleDateString(
              "en-GB",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              },
            )}
          </span>
          <span>{meta.readTime} read</span>
        </div>
        {article.summary && (
          <section
            aria-labelledby="briefing-takeaways"
            className="my-8 rounded-xl border border-primary/20 bg-primary/5 p-6"
          >
            <h2 id="briefing-takeaways" className="text-lg font-semibold mb-3">
              The briefing in a minute
            </h2>
            <ul className="list-disc pl-5 space-y-3 text-sm leading-relaxed">
              {article.summary.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              Our reading of the sources, followed by practical next steps.
              Source publication dates are listed below; the review date shows
              when we checked this briefing.
            </p>
          </section>
        )}
        <nav
          aria-label="In this article"
          className="my-8 border border-border rounded-xl p-6 bg-card"
        >
          <p className="text-sm font-semibold mb-3">In this article</p>
          <ul className="space-y-2 text-sm">
            {headings.map((h, i) => (
              <li key={h}>
                <a href={`#section-${i}`} className="hover:underline">
                  {h}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div
          className="sg-article"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <aside className="border-t border-border mt-12 pt-6 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-semibold text-foreground mb-3">
            Sources and scope
          </h2>
          {article.sources ? (
            <ul className="space-y-4">
              {article.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.title}
                  </a>
                  <p className="text-xs mt-1">
                    Source date / version: {source.published}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <a
              href={article.sourceUrl}
              className="underline"
              rel="noreferrer"
              target="_blank"
            >
              {article.source}
            </a>
          )}
          <p className="mt-3">
            Official guidance is linked for checking. Practical examples and
            suggested routines are Schoolgle&apos;s editorial interpretation.
            DfE and Ofsted guidance discussed here applies to England; other UK
            nations have separate arrangements.
          </p>
        </aside>
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-5">Keep reading</h2>
            <div className="space-y-4">
              {related.map((a) => (
                <Link
                  key={a.slug}
                  href={`/insights/${a.slug}`}
                  className="flex justify-between gap-5 py-4 border-b border-border text-sm font-semibold"
                >
                  {a.title}
                  <ArrowRight size={18} className="shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}
        <div className="mt-12 p-7 bg-card border border-border rounded-xl">
          <h2 className="text-2xl font-semibold">A familiar challenge?</h2>
          <p className="text-muted-foreground my-4">
            Bring us the task your team wants to make easier. We will walk
            through where Schoolgle can help.
          </p>
          <Link href="/#early-access" className="sg-button">
            Talk about your school <ArrowRight size={16} />
          </Link>
        </div>
      </article>
    </main>
  );
}
