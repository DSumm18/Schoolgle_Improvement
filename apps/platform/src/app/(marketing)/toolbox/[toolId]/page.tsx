"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Lock, Mail, Wrench } from "lucide-react";
import toolsData from "@/data/tools.json";

interface Tool {
  id: string;
  name: string;
  url: string;
  category: string;
  tags: string[];
  pricing: string;
  tier: string;
  summary: string;
  notes: string;
  signalWeek?: number;
}

const TIER_STYLES: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  free: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    label: "Free",
  },
  pro: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    label: "Signal Pro",
  },
  premium: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    label: "Premium",
  },
};

export default function ToolPage() {
  const params = useParams();
  const toolId = params?.toolId as string;
  const tool = (toolsData.tools as Tool[]).find((t) => t.id === toolId);

  const [loading, setLoading] = useState(true);
  const [hasContent, setHasContent] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!toolId) return;
    fetch(`/api/tools/${toolId}/content`)
      .then((res) => {
        if (res.ok) {
          setHasContent(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [toolId]);

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wrench size={32} className="text-muted-foreground mx-auto mb-3" />
          <h1 className="text-2xl font-black text-foreground mb-3">
            Tool not found
          </h1>
          <Link href="/toolbox" className="text-primary font-bold text-sm">
            Back to Toolbox
          </Link>
        </div>
      </div>
    );
  }

  const tierStyle = TIER_STYLES[tool.tier] || TIER_STYLES.free;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="px-6 py-6 border-b border-border">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/toolbox"
              className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft size={14} />
              All Tools
            </Link>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                  >
                    {tool.tier === "pro" && <Lock size={10} />}
                    {tierStyle.label}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {tool.category}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                  {tool.name}
                </h1>
                <p className="text-muted-foreground">{tool.summary}</p>
                {tool.signalWeek && (
                  <Link
                    href={`/insights/newsletter/week-${String(tool.signalWeek).padStart(2, "0")}`}
                    className="inline-flex items-center gap-2 mt-3 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    <Mail size={12} />
                    Featured in Signal Week {tool.signalWeek}
                    <ArrowRight size={10} />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tool content */}
      <section className="px-6 py-8">
        <div className="container mx-auto max-w-5xl">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : hasContent ? (
            <iframe
              ref={iframeRef}
              src={`/api/tools/${toolId}/content`}
              className="w-full border border-border rounded-2xl bg-card"
              style={{ minHeight: "80vh", height: "80vh" }}
              onLoad={() => {
                const iframe = iframeRef.current;
                if (iframe?.contentDocument?.body) {
                  const height = iframe.contentDocument.body.scrollHeight;
                  iframe.style.height = `${Math.max(height + 40, 600)}px`;
                }
              }}
              allow="clipboard-write"
              title={tool.name}
            />
          ) : tool.url.startsWith("http") ? (
            <div className="text-center py-24">
              <Wrench
                size={32}
                className="text-muted-foreground mx-auto mb-4"
              />
              <h2 className="text-lg font-bold text-foreground mb-2">
                External Tool
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                This tool is hosted externally.
              </p>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:brightness-110 transition-all"
              >
                Open {tool.name}
                <ArrowRight size={14} />
              </a>
            </div>
          ) : (
            <div className="text-center py-24">
              <Lock size={32} className="text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-bold text-foreground mb-2">
                Coming Soon
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                This tool is being prepared. Subscribe to The Schoolgle Signal
                to get early access.
              </p>
              <Link
                href="/insights/newsletter"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:brightness-110 transition-all"
              >
                <Mail size={14} />
                Subscribe to the Signal
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Signal CTA for pro tools */}
      {tool.tier === "pro" && (
        <section className="px-6 py-12 border-t border-border bg-foreground/[0.02]">
          <div className="container mx-auto max-w-3xl text-center">
            <Mail size={24} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-foreground mb-2">
              Unlock the full version
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {tool.notes} Subscribe to The Schoolgle Signal for full access to
              all Pro tools, plus weekly intelligence for school leaders.
            </p>
            <Link
              href="/insights/newsletter"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
            >
              Subscribe to the Signal
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
