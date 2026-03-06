"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Wrench,
  Lightbulb,
  Calendar,
  Lock,
} from "lucide-react";
import { getLatestPublicInsights, MODULE_COLORS } from "@/data/insights";
import { getAllEditions } from "@/data/newsletters";

/* ── Apple-style motion config ── */

const spring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
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

const WHAT_YOU_GET = [
  {
    icon: FlaskConical,
    title: "Research Digest",
    desc: "The latest research we've published, summarised with expert commentary on what it actually means for your school.",
    free: true,
  },
  {
    icon: Lightbulb,
    title: "What It Means",
    desc: "Our take on each piece of research — the practical implications, the actions to consider, and the questions to ask your team.",
    free: false,
  },
  {
    icon: Wrench,
    title: "Exclusive Mini-Tools",
    desc: "Checklists, calculators, and templates built for the topic at hand. Only available to Signal subscribers.",
    free: false,
  },
  {
    icon: Calendar,
    title: "Compliance Calendar",
    desc: "Upcoming statutory deadlines, inspection windows, and key dates — so you're never caught off guard.",
    free: false,
  },
];

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const latestInsights = getLatestPublicInsights(3);
  const editions = getAllEditions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setEmail("");
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-16 md:pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            {/* Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <Mail size={28} className="text-amber-500" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
              The Schoolgle Signal
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Research is free. Knowing what to do with it isn't.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto"
            >
              Weekly intelligence for school leaders who want the research
              <em> and</em> the practical takeaways. Each edition connects our
              latest published research to real actions you can take this week.
            </motion.p>

            {/* Signup form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-10 max-w-lg mx-auto"
            >
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your work email"
                      required
                      className="flex-1 px-5 py-3.5 rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium transition-shadow duration-200"
                    />
                    <button
                      type="submit"
                      className="btn-press group px-6 py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                      Subscribe
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform duration-200"
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 font-medium">
                    Free. Weekly. No spam. Unsubscribe anytime.
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={spring}
                  className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
                >
                  <CheckCircle2
                    size={24}
                    className="text-emerald-500 mx-auto mb-2"
                  />
                  <p className="text-foreground font-bold">You're in!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check your inbox to confirm your subscription.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-16 bg-foreground/[0.02] border-y border-border">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl font-black text-foreground text-center mb-10"
          >
            What's inside each edition
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {WHAT_YOU_GET.map((item, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="card-hover p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-foreground">
                        {item.title}
                      </h3>
                      {!item.free && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Lock size={8} />
                          Signal Only
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl font-black text-foreground text-center mb-10"
          >
            How it works
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            {[
              {
                step: "1",
                title: "We publish research",
                desc: "Free articles on our Insights page — evidence-backed, sourced, and practical.",
              },
              {
                step: "2",
                title: "The Signal explains it",
                desc: "Each edition picks the key research and adds expert commentary on what it means for your school.",
              },
              {
                step: "3",
                title: "You get tools to act",
                desc: "Exclusive checklists, mini-tools, and templates so you can take action immediately.",
              },
            ].map((item) => (
              <motion.div key={item.step} variants={staggerItem}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={spring}
                  className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary font-black text-sm"
                >
                  {item.step}
                </motion.div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Past editions */}
      <section className="px-6 py-16 bg-foreground/[0.02] border-y border-border">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-2xl font-black text-foreground text-center mb-3">
              All editions
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-10">
              {editions.length} editions published. Read any edition below.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-20px" }}
            className="space-y-2"
          >
            {editions.map((edition) => (
              <motion.div key={edition.slug} variants={staggerItem}>
                <Link
                  href={`/insights/newsletter/${edition.slug}`}
                  className="card-hover group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-colors duration-200"
                >
                  <span className="text-xs font-bold text-amber-500 flex-shrink-0 w-14 sm:w-16">
                    Week {edition.week}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium flex-shrink-0 w-20 sm:w-24 hidden sm:block">
                    {new Date(edition.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                      {edition.lead}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {edition.modules.map((mod) => {
                      const info = MODULE_COLORS[mod];
                      return info ? (
                        <span
                          key={mod}
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: info.color }}
                          title={info.label}
                        />
                      ) : null;
                    })}
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
                  />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Latest research feed */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-foreground">
              Latest published research
            </h2>
            <Link
              href="/insights"
              className="group flex items-center gap-1.5 text-xs font-bold text-primary"
            >
              View all
              <ArrowRight
                size={12}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </Link>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {latestInsights.map((insight) => {
              const moduleInfo = insight.module
                ? MODULE_COLORS[insight.module]
                : null;
              return (
                <motion.div key={insight.slug} variants={staggerItem}>
                  <Link
                    href={`/insights/${insight.slug}`}
                    className="card-hover group block p-5 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-colors duration-200 h-full"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {moduleInfo && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: moduleInfo.color }}
                        />
                      )}
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {insight.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2">
                      {insight.title}
                    </h3>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 border-t border-border">
        <div className="container mx-auto max-w-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-2xl font-black text-foreground mb-3">
              Don't miss the next edition
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Join school leaders across the UK who read The Schoolgle Signal to
              stay ahead of compliance, inspection, and best practice.
            </p>
            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your work email"
                  required
                  className="flex-1 px-5 py-3 rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm transition-shadow duration-200"
                />
                <button
                  type="submit"
                  className="btn-press px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  Subscribe
                </button>
              </form>
            ) : (
              <p className="text-primary font-bold">
                You're subscribed! Check your inbox.
              </p>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
