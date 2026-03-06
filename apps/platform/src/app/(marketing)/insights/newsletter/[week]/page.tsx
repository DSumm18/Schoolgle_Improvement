"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Mail, Wrench } from "lucide-react";
import { getEditionBySlug, getLatestEditions } from "@/data/newsletters";
import { getInsightBySlug, MODULE_COLORS } from "@/data/insights";

const spring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function NewsletterEditionPage() {
  const params = useParams();
  const week = params?.week as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const edition = week ? getEditionBySlug(week) : undefined;
  const allEditions = getLatestEditions(20);

  const currentIndex = allEditions.findIndex((e) => e.slug === week);
  const prevEdition =
    currentIndex < allEditions.length - 1
      ? allEditions[currentIndex + 1]
      : null;
  const nextEdition = currentIndex > 0 ? allEditions[currentIndex - 1] : null;

  const relatedArticles = (edition?.relatedResearch || [])
    .map((slug) => getInsightBySlug(slug))
    .filter(Boolean);

  useEffect(() => {
    if (!week) return;
    setLoading(true);
    setError(false);

    fetch(`/api/newsletters/${week}/content`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [week]);

  if (!edition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black text-foreground mb-3">
            Edition not found
          </h1>
          <Link
            href="/insights/newsletter"
            className="text-primary font-bold text-sm"
          >
            Back to The Schoolgle Signal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header bar */}
      <section className="px-4 sm:px-6 py-6 border-b border-border">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/insights/newsletter"
              className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4"
            >
              <ArrowLeft size={14} />
              All editions
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={spring}
                    className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
                  >
                    <Mail size={16} className="text-amber-500" />
                  </motion.div>
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Week {edition.week}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-foreground">
                  {edition.lead}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    {new Date(edition.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {edition.modules.map((mod) => {
                      const info = MODULE_COLORS[mod];
                      return info ? (
                        <span
                          key={mod}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border"
                          style={{
                            backgroundColor: `${info.color}10`,
                            color: info.color,
                            borderColor: `${info.color}25`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: info.color }}
                          />
                          {info.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* Prev / Next nav */}
              <div className="flex items-center gap-2">
                {prevEdition ? (
                  <Link
                    href={`/insights/newsletter/${prevEdition.slug}`}
                    className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200"
                  >
                    <ArrowLeft size={12} />
                    <span className="hidden sm:inline">
                      Week {prevEdition.week}
                    </span>
                    <span className="sm:hidden">Prev</span>
                  </Link>
                ) : (
                  <span />
                )}
                {nextEdition && (
                  <Link
                    href={`/insights/newsletter/${nextEdition.slug}`}
                    className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200"
                  >
                    <span className="hidden sm:inline">
                      Week {nextEdition.week}
                    </span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter content iframe */}
      <section className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="container mx-auto max-w-5xl">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-24"
            >
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <p className="text-muted-foreground">
                Failed to load this edition. Please try again later.
              </p>
            </motion.div>
          )}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <iframe
                ref={iframeRef}
                src={`/api/newsletters/${week}/content`}
                className="w-full border border-border rounded-2xl bg-card"
                style={{ minHeight: "80vh" }}
                onLoad={() => {
                  const iframe = iframeRef.current;
                  if (iframe?.contentDocument?.body) {
                    const height = iframe.contentDocument.body.scrollHeight;
                    iframe.style.height = `${height + 40}px`;
                  }
                }}
                title={edition.title}
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* Featured tool */}
      {edition.toolId && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 sm:px-6 py-6"
        >
          <div className="container mx-auto max-w-5xl">
            <Link
              href={`/toolbox/${edition.toolId}`}
              className="card-hover group flex items-center gap-4 p-5 rounded-xl bg-blue-500/5 border border-blue-500/15 hover:border-blue-500/30 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Wrench size={18} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                  Interactive Tool from this edition
                </span>
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                  {edition.toolName} — try the standalone version in the Toolbox
                </p>
              </div>
              <ArrowRight
                size={14}
                className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
              />
            </Link>
          </div>
        </motion.section>
      )}

      {/* Related research */}
      {relatedArticles.length > 0 && (
        <section className="px-4 sm:px-6 py-12 border-t border-border bg-foreground/[0.02]">
          <div className="container mx-auto max-w-5xl">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg font-black text-foreground mb-6"
            >
              Related research from this edition
            </motion.h2>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-20px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {relatedArticles.map((article) => {
                if (!article) return null;
                const moduleInfo = article.module
                  ? MODULE_COLORS[article.module]
                  : null;
                return (
                  <motion.div key={article.slug} variants={staggerItem}>
                    <Link
                      href={`/insights/${article.slug}`}
                      className="card-hover group block p-5 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {moduleInfo && (
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: moduleInfo.color }}
                          />
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {article.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {article.excerpt}
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* Edition navigation footer */}
      <section className="px-4 sm:px-6 py-8 border-t border-border">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          {prevEdition ? (
            <Link
              href={`/insights/newsletter/${prevEdition.slug}`}
              className="btn-press group flex items-center gap-2 text-sm"
            >
              <ArrowLeft
                size={14}
                className="text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all duration-200"
              />
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                  Previous
                </span>
                <span className="font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                  Week {prevEdition.week}
                </span>
              </div>
            </Link>
          ) : (
            <span />
          )}
          {nextEdition ? (
            <Link
              href={`/insights/newsletter/${nextEdition.slug}`}
              className="btn-press group flex items-center gap-2 text-sm text-right"
            >
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                  Next
                </span>
                <span className="font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                  Week {nextEdition.week}
                </span>
              </div>
              <ArrowRight
                size={14}
                className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200"
              />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </section>
    </div>
  );
}
