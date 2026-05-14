"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  HeartHandshake,
  Layers3,
  PoundSterling,
  ShieldCheck,
} from "lucide-react";

interface ScreenshotScene {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  image: string;
  icon: React.ElementType;
  color: string;
  callouts: {
    label: string;
    detail: string;
    tone: "green" | "amber" | "blue" | "purple";
  }[];
}

const scenes: ScreenshotScene[] = [
  {
    id: "finance",
    label: "Finance",
    title: "Budget Monitor",
    subtitle: "A live finance view built from budget lines, actuals and commitments",
    image: "/marketing/screenshots/finance-budget-monitor.png",
    icon: PoundSterling,
    color: "#FFAA4C",
    callouts: [
      {
        label: "Projected year-end",
        detail: "+£26,447 after known commitments",
        tone: "green",
      },
      {
        label: "Staffing risk",
        detail: "78.3% of income, just above ICFP target",
        tone: "amber",
      },
      {
        label: "Governor-ready",
        detail: "Report output generated from the same live view",
        tone: "blue",
      },
    ],
  },
  {
    id: "send",
    label: "SEND",
    title: "SEND Management",
    subtitle: "A SENCO view of register, EHCPs, provision and review deadlines",
    image: "/marketing/screenshots/send-inclusion-hub.png",
    icon: HeartHandshake,
    color: "#10B981",
    callouts: [
      {
        label: "20 EHCPs",
        detail: "Annual reviews due this term",
        tone: "purple",
      },
      {
        label: "84 pupils",
        detail: "Register visible as a living workload",
        tone: "green",
      },
      {
        label: "Next actions",
        detail: "Reviews, provision gaps and referrals surfaced together",
        tone: "blue",
      },
    ],
  },
];

const toneClasses = {
  green: "border-emerald-100 bg-emerald-50 text-emerald-800",
  amber: "border-amber-100 bg-amber-50 text-amber-800",
  blue: "border-sky-100 bg-sky-50 text-sky-800",
  purple: "border-violet-100 bg-violet-50 text-violet-800",
};

const HeroShowcase = () => {
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScene((previous) => (previous + 1) % scenes.length);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const currentScene = scenes[activeScene];
  const SceneIcon = currentScene.icon;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            onClick={() => setActiveScene(index)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              index === activeScene
                ? "border-transparent bg-foreground text-background shadow-lg"
                : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <scene.icon
              size={14}
              style={{ color: index === activeScene ? scene.color : undefined }}
            />
            {scene.label}
          </button>
        ))}
      </div>

      <motion.div
        layout
        className="overflow-hidden rounded-[1.75rem] border border-border bg-card/90 shadow-2xl shadow-black/10 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-border bg-foreground/[0.02] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400/60" />
              <div className="h-3 w-3 rounded-full bg-amber-400/60" />
              <div className="h-3 w-3 rounded-full bg-emerald-400/60" />
            </div>
            <div className="ml-2 flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-1 text-[11px] text-muted-foreground">
              <SceneIcon size={13} style={{ color: currentScene.color }} />
              <span className="font-bold text-foreground">
                {currentScene.title}
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 md:flex">
            <ShieldCheck size={12} />
            Actual Schoolgle app screenshot
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
          <div className="relative min-h-[430px] overflow-hidden bg-slate-50">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentScene.id}
                src={currentScene.image}
                alt={`${currentScene.title} screenshot`}
                initial={{ opacity: 0, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.45 }}
                className="h-full min-h-[430px] w-full object-cover object-left-top"
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/90 to-transparent" />
          </div>

          <aside className="border-t border-border bg-white/90 p-5 lg:border-l lg:border-t-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScene.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${currentScene.color}18`,
                    color: currentScene.color,
                  }}
                >
                  <SceneIcon size={22} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Real product view
                </p>
                <h3 className="mt-2 text-2xl font-black leading-tight text-foreground">
                  {currentScene.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {currentScene.subtitle}
                </p>

                <div className="mt-5 space-y-3">
                  {currentScene.callouts.map((callout, index) => (
                    <motion.div
                      key={callout.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + index * 0.08 }}
                      className={`rounded-2xl border p-3 ${toneClasses[callout.tone]}`}
                    >
                      <div className="flex items-start gap-2">
                        {index === 0 ? (
                          <CalendarClock size={15} className="mt-0.5" />
                        ) : (
                          <CheckCircle2 size={15} className="mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-black">{callout.label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed opacity-80">
                            {callout.detail}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>

        <div className="h-1 bg-foreground/5">
          <motion.div
            key={activeScene}
            className="h-full"
            style={{ backgroundColor: currentScene.color }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 9, ease: "linear" }}
          />
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
        <Layers3 size={14} />
        Real screens from the app - connected data turned into operational
        decisions.
        <ArrowRight size={13} />
      </div>
    </div>
  );
};

export default HeroShowcase;
