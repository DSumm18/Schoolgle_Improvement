"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Shield,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  BookOpen,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function WebsiteComplianceLanding() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-6">
              <Shield className="w-3.5 h-3.5" />
              Statutory Website Compliance
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
              Is your school website{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                compliant?
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              Schools must publish specific information on their website by law.
              Ofsted checks this. We scan your site against{" "}
              <strong>28+ statutory requirements</strong> and tell you exactly
              what&apos;s missing.
            </p>

            <p className="text-sm text-muted-foreground mb-8">
              Based on School Information Regulations 2025, Academy Trust
              Handbook 2025, and KCSIE 2025.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            <Link
              href="/sign-up?app=website-compliance"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-colors"
            >
              <Globe className="w-5 h-5" />
              Check My School Website
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-muted-foreground">
              Free to sign up. One scan included free. &pound;50/year for
              continuous monitoring.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">What we check</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: CheckCircle2,
              title: "28+ Statutory Requirements",
              desc: "Every requirement from the School Information Regulations, Academy Trust Handbook, and KCSIE — checked automatically.",
              color: "text-emerald-500",
            },
            {
              icon: FileText,
              title: "PDFs & Documents",
              desc: "We don't just check pages. We download and read every PDF, including Google Drive policies and trust documents.",
              color: "text-blue-500",
            },
            {
              icon: AlertTriangle,
              title: "Quality & Currency",
              desc: "Not just 'is it there?' but 'is it up to date?' — we flag outdated policies referencing old legislation.",
              color: "text-amber-500",
            },
            {
              icon: Globe,
              title: "Trust Website Crawling",
              desc: "Academies: we auto-detect and crawl your trust website for trust-level policies like complaints and whistleblowing.",
              color: "text-purple-500",
            },
            {
              icon: Shield,
              title: "Ofsted-Aligned",
              desc: "Results mapped to EIF inspection areas. Know exactly which Ofsted judgement each gap affects.",
              color: "text-sky-500",
            },
            {
              icon: XCircle,
              title: "Clear Action List",
              desc: "Not a vague report — specific gaps, red flags, and recommendations for every requirement.",
              color: "text-rose-500",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="rounded-xl border border-border/50 p-5 bg-card"
            >
              <feature.icon className={`w-6 h-6 ${feature.color} mb-3`} />
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* What we check list */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold mb-4 text-center">
            Full checklist includes:
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {[
              "Safeguarding policy & DSL name",
              "SENCO details & SEN report",
              "Behaviour policy",
              "Complaints procedure",
              "Admissions arrangements",
              "Curriculum content by year",
              "Pupil premium strategy",
              "PE & sport premium spending",
              "Governance information",
              "Charging & remissions policy",
              "Equality objectives",
              "Accessibility plan",
              "KS2 / KS4 / KS5 results",
              "Online safety & filtering",
              "Whistleblowing policy",
              "Financial benchmarking link",
              "RSE / RSHE policy",
              "Ofsted report link",
              "School uniform policy",
              "Contact details & headteacher",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Simple pricing</h2>
          <p className="text-muted-foreground mb-8">
            Sign up free. Your first scan is on us.
          </p>
          <div className="inline-flex gap-6">
            <div className="rounded-xl border border-border/50 p-6 bg-card text-center w-56">
              <p className="text-3xl font-black text-foreground">Free</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                One-off scan
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Full compliance check
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  PDF & document analysis
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Detailed action plan
                </li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-emerald-500 p-6 bg-card text-center w-56 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </div>
              <p className="text-3xl font-black text-foreground">
                &pound;50
                <span className="text-base font-medium text-muted-foreground">
                  /yr
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Continuous monitoring
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Monthly automated scans
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Email alerts on changes
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Legislation update tracking
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Compliance certificate
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/sign-up?app=website-compliance"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Upsell */}
        <div className="mt-16 rounded-xl border border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-1">
                Preparing for Ofsted?
              </h3>
              <p className="text-sm text-muted-foreground">
                Website compliance is just one piece. Schoolgle scans your
                Google Drive, maps evidence to the full EIF framework, and gives
                you a complete readiness dashboard across all 4 key judgement
                areas.
              </p>
            </div>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-colors shrink-0"
            >
              Explore Ofsted Readiness
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
