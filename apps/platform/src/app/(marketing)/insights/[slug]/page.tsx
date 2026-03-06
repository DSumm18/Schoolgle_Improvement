"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  FlaskConical,
  BookOpen,
  Lightbulb,
  Newspaper,
  FileText,
  Mail,
} from "lucide-react";
import {
  getInsightBySlug,
  getInsightsByModule,
  MODULE_COLORS,
  type Insight,
} from "@/data/insights";
import { editions } from "@/data/newsletters";

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  research: { label: "Research", icon: FlaskConical },
  guide: { label: "Guide", icon: BookOpen },
  opinion: { label: "Opinion", icon: Lightbulb },
  news: { label: "News", icon: Newspaper },
  "case-study": { label: "Case Study", icon: FileText },
};

export default function InsightDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const insight = getInsightBySlug(slug);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load markdown content
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/insights/${slug}/content`)
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (!insight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Article not found
          </h1>
          <Link
            href="/insights"
            className="text-primary font-bold hover:underline"
          >
            Back to Insights
          </Link>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_META[insight.category || "guide"];
  const moduleInfo = insight.module ? MODULE_COLORS[insight.module] : null;
  const relatedArticles = insight.module
    ? getInsightsByModule(insight.module)
        .filter((i) => i.slug !== slug)
        .slice(0, 3)
    : [];

  // Find newsletter editions that reference this article
  const featuredInEditions = editions.filter((e) =>
    e.relatedResearch?.includes(slug),
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-12 md:pt-20 pb-8 px-6">
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            All Insights
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {cat && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  <cat.icon size={12} />
                  {cat.label}
                </span>
              )}
              {moduleInfo && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: `${moduleInfo.color}15`,
                    color: moduleInfo.color,
                    borderColor: `${moduleInfo.color}30`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: moduleInfo.color }}
                  />
                  {moduleInfo.label}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight mb-6">
              {insight.title}
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {insight.excerpt}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-8 border-b border-border">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(insight.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {insight.readTime && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {insight.readTime} read
                </span>
              )}
              {insight.source && (
                <span className="flex items-center gap-1.5">
                  Source:{" "}
                  {insight.sourceUrl ? (
                    <a
                      href={insight.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {insight.source}
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    insight.source
                  )}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured in newsletter */}
      {featuredInEditions.length > 0 && (
        <section className="px-6 pb-4">
          <div className="container mx-auto max-w-3xl">
            {featuredInEditions.map((edition) => (
              <Link
                key={edition.slug}
                href={`/insights/newsletter/${edition.slug}`}
                className="group flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                    Featured in The Schoolgle Signal
                  </span>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    Week {edition.week}: {edition.lead}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hero image */}
      {insight.heroImage && (
        <section className="px-6 pb-8">
          <div className="container mx-auto max-w-3xl">
            <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden">
              <Image
                src={insight.heroImage}
                alt={insight.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="px-6 pb-16">
        <div className="container mx-auto max-w-3xl">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-foreground/5 rounded"
                  style={{ width: `${70 + Math.random() * 30}%` }}
                />
              ))}
            </div>
          ) : content ? (
            <div
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-black prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground
                prose-blockquote:border-primary/30 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                prose-li:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Full article content is being prepared.
              </p>
              <p className="text-sm text-muted-foreground/60">
                Subscribe to The Schoolgle Signal to be notified when this
                article is published.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Soft CTA for related app */}
      {insight.relatedApp && (
        <section className="px-6 pb-16">
          <div className="container mx-auto max-w-3xl">
            <div
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: moduleInfo
                  ? `${moduleInfo.color}08`
                  : undefined,
                borderColor: moduleInfo ? `${moduleInfo.color}20` : undefined,
              }}
            >
              <p className="text-sm text-muted-foreground mb-2">
                This article relates to
              </p>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Schoolgle {insight.relatedApp}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                See how Schoolgle helps with the challenges discussed in this
                article.
              </p>
              <Link
                href="#early-access"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary"
              >
                Learn more
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Related articles from same module */}
      {relatedArticles.length > 0 && (
        <section className="px-6 pb-16 bg-foreground/[0.02] py-16 border-t border-border">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-xl font-black text-foreground mb-6">
              More on {moduleInfo?.label || "this topic"}
            </h2>
            <div className="space-y-4">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/insights/${article.slug}`}
                  className="group block p-5 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-all"
                >
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                    {article.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {article.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="px-6 py-16 border-t border-border">
        <div className="container mx-auto max-w-3xl text-center">
          <Mail size={24} className="text-primary mx-auto mb-4" />
          <h2 className="text-xl font-black text-foreground mb-2">
            The Schoolgle Signal
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Get research like this delivered weekly, with expert commentary on
            what it means for your school. Plus exclusive tools and templates.
          </p>
          <Link
            href="/insights/newsletter"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            Subscribe to the Signal
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
