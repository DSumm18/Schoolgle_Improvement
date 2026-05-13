"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clapperboard,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductHowToGuide as ProductHowToGuideData } from "@/lib/product-guides/types";

const HIGHLIGHT_STYLES: Record<string, string> = {
  setup: "from-blue-500 to-cyan-400",
  survey: "from-fuchsia-500 to-pink-400",
  review: "from-amber-500 to-orange-400",
  generate: "from-violet-500 to-indigo-500",
  seating: "from-emerald-500 to-teal-400",
  export: "from-slate-700 to-slate-500",
};

type Props = {
  guide: ProductHowToGuideData;
  triggerLabel?: string;
};

export function ProductHowToGuide({ guide, triggerLabel = "How this works" }: Props) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = guide.steps[activeStep] ?? guide.steps[0];
  const progress = ((activeStep + 1) / guide.steps.length) * 100;
  const totalSceneSeconds = useMemo(
    () => guide.scenes.reduce((total, scene) => total + scene.durationSeconds, 0),
    [guide.scenes],
  );

  useEffect(() => {
    if (!open || !playing) return;
    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        if (current >= guide.steps.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [guide.steps.length, open, playing]);

  function restart() {
    setActiveStep(0);
    setPlaying(true);
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <BookOpen className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto p-0">
          <DialogHeader className="border-b bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-800 p-6 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                  Product guide
                </p>
                <DialogTitle className="mt-2 text-3xl font-black">
                  {guide.appName}
                </DialogTitle>
                <p className="mt-2 max-w-3xl text-sm text-blue-50">
                  {guide.outcome}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/15 text-white hover:bg-white/20">
                  {guide.audience}
                </Badge>
                <Badge className="bg-white/15 text-white hover:bg-white/20">
                  {guide.durationSeconds}s guide
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="border-r bg-slate-50 p-5">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Living walkthrough
                    </p>
                    <p className="text-lg font-black">Step {activeStep + 1}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setPlaying((current) => !current)}
                      aria-label={playing ? "Pause guide" : "Play guide"}
                    >
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={restart}
                      aria-label="Restart guide"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {guide.steps.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveStep(index);
                      setPlaying(false);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      index === activeStep
                        ? "border-primary bg-white shadow-sm"
                        : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          index === activeStep
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span>
                        <span className="block font-bold">{item.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {item.caption}
                        </span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <main className="space-y-5 p-5">
              <section className="overflow-hidden rounded-[1.75rem] border bg-white shadow-sm">
                <div
                  className={`relative min-h-[360px] bg-gradient-to-br ${
                    HIGHLIGHT_STYLES[step.highlight] ?? HIGHLIGHT_STYLES.setup
                  } p-6 text-white`}
                >
                  <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
                  <div className="absolute bottom-6 right-6 hidden rounded-3xl border border-white/25 bg-white/15 p-4 shadow-2xl backdrop-blur md:block">
                    <ScreenMockup label={step.visualLabel} highlight={step.highlight} />
                  </div>
                  <div className="relative z-10 max-w-xl">
                    <Badge className="bg-white/20 text-white hover:bg-white/25">
                      {step.visualLabel}
                    </Badge>
                    <h2 className="mt-5 text-4xl font-black leading-tight">
                      {step.title}
                    </h2>
                    <p className="mt-4 text-lg font-semibold text-white/90">
                      {step.caption}
                    </p>
                    <p className="mt-4 max-w-lg text-sm leading-6 text-white/85">
                      {step.detail}
                    </p>
                    {step.actionLabel ? (
                      <div className="mt-6 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-lg">
                        <Sparkles className="mr-2 h-4 w-4 text-cyan-600" />
                        {step.actionLabel}
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <div className="grid gap-4 xl:grid-cols-2">
                <InfoPanel
                  icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  title="Before you start"
                  items={guide.beforeYouStart}
                />
                <InfoPanel
                  icon={<Sparkles className="h-5 w-5 text-blue-600" />}
                  title="What good looks like"
                  items={guide.goodLooksLike}
                />
              </div>

              <section className="rounded-2xl border bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-black">Common issues</h3>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {guide.commonIssues.map((item) => (
                    <div key={item.issue} className="rounded-xl border bg-white p-3 text-sm">
                      <p className="font-bold">{item.issue}</p>
                      <p className="mt-1 text-muted-foreground">{item.fix}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-violet-600" />
                    <h3 className="font-black">Remotion storyboard</h3>
                  </div>
                  <Badge variant="outline">{totalSceneSeconds}s planned</Badge>
                </div>
                <div className="mt-3 grid gap-2">
                  {guide.scenes.map((scene, index) => (
                    <div key={scene.id} className="rounded-xl border bg-slate-50 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">
                          {index + 1}. {scene.title}
                        </p>
                        <Badge variant="secondary">{scene.durationSeconds}s</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{scene.caption}</p>
                      <p className="mt-2 text-xs text-slate-500">{scene.visual}</p>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoPanel({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="font-black">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScreenMockup({ label, highlight }: { label: string; highlight: string }) {
  const activeIndex = ["setup", "survey", "review", "generate", "seating", "export"].indexOf(highlight);
  return (
    <div className="w-[280px] rounded-2xl bg-white p-3 text-slate-950 shadow-2xl">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-[10px] font-bold uppercase text-slate-400">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-[72px_1fr] gap-2">
        <div className="space-y-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-8 rounded-lg bg-slate-100" />
          ))}
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`h-10 rounded-xl border ${
                item === Math.max(0, activeIndex - 1)
                  ? "border-cyan-400 bg-cyan-50 shadow-[0_0_0_4px_rgba(34,211,238,0.18)]"
                  : "border-slate-100 bg-slate-50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
