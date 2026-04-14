"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Target, Volume2, VolumeX, Timer, Pause, Play } from "lucide-react";
import type { LSLessonPlan, PlanSection, VocabularyItem, DifferentiationGroup } from "@/types/lesson-studio";

interface TeachModeProps {
  plan: LSLessonPlan;
  onExit: () => void;
}

interface Slide {
  type: "welcome" | "objective" | "vocabulary" | "phase" | "groups" | "visual";
  label: string;
  title: string;
  content: React.ReactNode;
  time?: string;
}

const PHASE_ACCENT: Record<string, string> = {
  Starter: "text-amber-700",
  Teach: "text-blue-700",
  Practice: "text-green-700",
  Plenary: "text-purple-700",
};

const DIFF_COLORS = [
  "border-blue-300 bg-blue-50",
  "border-green-300 bg-green-50",
  "border-amber-300 bg-amber-50",
  "border-red-300 bg-red-50",
];

/** Play a pleasant chime using Web Audio API */
function playChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.8);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // silent fallback
  }
}

function parseMinutes(time?: string): number {
  if (!time) return 0;
  const match = time.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function TeachMode({ plan, onExit }: TeachModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTarget, setTimerTarget] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hasPlayedRef = useRef(false);

  // Build slides
  const slides: Slide[] = [];

  slides.push({
    type: "welcome",
    label: "Title",
    title: plan.title,
    content: (
      <div className="text-center max-w-3xl mx-auto">
        <div className="text-sm font-semibold text-teal-600 uppercase tracking-wide mb-3">{plan.subject}</div>
        <h1 className="text-5xl font-bold text-slate-800 mb-4">{plan.title}</h1>
        {plan.scheme_name && (
          <p className="text-lg text-slate-500">{plan.scheme_name} {plan.scheme_step && `— ${plan.scheme_step}`}</p>
        )}
      </div>
    ),
  });

  slides.push({
    type: "objective",
    label: "Objective",
    title: "Learning Objective",
    content: (
      <div className="text-center max-w-3xl mx-auto">
        <Target className="w-12 h-12 text-teal-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-slate-800 leading-snug mb-8">{plan.learning_objective}</h2>
        {plan.success_criteria?.length > 0 && (
          <div className="space-y-3 text-left max-w-xl mx-auto">
            {plan.success_criteria.map((sc, i) => (
              <div key={i} className="text-xl text-slate-700 flex items-start gap-3">
                <span className="text-teal-500 mt-1 flex-shrink-0">✓</span>
                <span>{sc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  });

  // Visual slide — rendered SVG diagram from AI
  const visData = (plan.generated_resources_json as Record<string, unknown>)?.visualisation as { svg?: string; html?: string } | null;
  if (visData?.svg) {
    slides.push({
      type: "visual",
      label: "Visual",
      title: "Interactive Visual",
      content: (
        <div className="max-w-4xl mx-auto w-full">
          <div
            className="w-full rounded-xl overflow-hidden border border-slate-200 bg-white p-6 [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-h-[60vh]"
            dangerouslySetInnerHTML={{ __html: visData.svg }}
          />
        </div>
      ),
    });
  }

  if (plan.key_vocabulary?.length > 0) {
    slides.push({
      type: "vocabulary",
      label: "Vocabulary",
      title: "Key Vocabulary",
      content: (
        <div className="grid grid-cols-2 gap-5 max-w-4xl mx-auto">
          {(plan.key_vocabulary as VocabularyItem[]).map((v, i) => (
            <div key={i} className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-800 mb-1">{v.word}</div>
              <div className="text-lg text-indigo-600">{v.definition}</div>
            </div>
          ))}
        </div>
      ),
    });
  }

  for (const section of (plan.plan_sections as PlanSection[]) || []) {
    const accent = PHASE_ACCENT[section.phase] ?? "text-slate-700";
    slides.push({
      type: "phase",
      label: section.phase,
      title: section.phase,
      time: section.time,
      content: (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className={`text-2xl font-bold ${accent}`}>{section.phase}</span>
            {section.time && (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                {section.time}
              </span>
            )}
          </div>
          <p className="text-2xl text-slate-700 leading-relaxed">{section.description}</p>
        </div>
      ),
    });
  }

  if ((plan.differentiation_groups as DifferentiationGroup[])?.length > 0) {
    slides.push({
      type: "groups",
      label: "Groups",
      title: "Group Activities",
      content: (
        <div className="grid grid-cols-2 gap-4 max-w-5xl mx-auto">
          {(plan.differentiation_groups as DifferentiationGroup[]).map((g, i) => (
            <div key={i} className={`rounded-xl border-l-4 p-5 ${DIFF_COLORS[i] ?? DIFF_COLORS[0]}`}>
              <div className="text-xl font-bold text-slate-800 mb-1">{g.name}</div>
              <div className="text-sm text-slate-500 mb-2">{g.pupils}</div>
              <p className="text-base text-slate-700">{g.description}</p>
              {g.resourceNotes && (
                <div className="text-sm text-slate-400 mt-2 italic">{g.resourceNotes}</div>
              )}
            </div>
          ))}
        </div>
      ),
    });
  }

  const totalSlides = slides.length;
  const slide = slides[currentSlide];

  const goNext = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  const goPrev = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  // Start timer (manual or auto)
  const startTimer = (minutes: number) => {
    setTimerSeconds(0);
    setTimerTarget(minutes * 60);
    setTimerRunning(true);
    hasPlayedRef.current = false;
  };

  // Auto-start timer on phase slides
  useEffect(() => {
    if (slide?.type === "phase" && slide.time) {
      const mins = parseMinutes(slide.time);
      if (mins > 0) startTimer(mins);
    }
  }, [currentSlide]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "Escape") {
        onExit();
      }
    },
    [totalSlides, onExit], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Timer countdown
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        const next = prev + 1;
        if (next >= timerTarget && !hasPlayedRef.current) {
          hasPlayedRef.current = true;
          if (soundEnabled) playChime();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerTarget, soundEnabled]);

  const formatTime = (s: number) => {
    const remaining = Math.max(timerTarget - s, 0);
    const m = Math.floor(remaining / 60);
    const sec = remaining % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerExpired = timerSeconds >= timerTarget && timerTarget > 0;
  const timerProgress = timerTarget > 0 ? Math.min(timerSeconds / timerTarget, 1) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 bg-slate-50">
        {/* Left: slide counter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-800">
            {currentSlide + 1} <span className="text-slate-400">/ {totalSlides}</span>
          </span>
          <span className="text-sm text-slate-500">{slide.label}</span>
        </div>

        {/* Centre: timer display + manual timer buttons */}
        <div className="flex items-center gap-3">
          {/* Manual timer buttons — always visible */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-white">
            <Timer className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[1, 2, 5, 10, 15].map((m) => (
              <button
                key={m}
                onClick={() => startTimer(m)}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  timerTarget === m * 60 && timerRunning
                    ? "bg-teal-100 text-teal-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>

          {/* Active timer countdown */}
          {timerTarget > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
              >
                {timerRunning
                  ? <Pause className="w-3.5 h-3.5 text-slate-500" />
                  : <Play className="w-3.5 h-3.5 text-slate-500" />
                }
              </button>
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${timerExpired ? "bg-red-400" : "bg-teal-400"}`}
                  style={{ width: `${timerProgress * 100}%` }}
                />
              </div>
              <span className={`text-sm font-mono font-bold min-w-[48px] ${timerExpired ? "text-red-500 animate-pulse" : "text-slate-700"}`}>
                {timerExpired ? "0:00" : formatTime(timerSeconds)}
              </span>
            </div>
          )}

          {/* Sound toggle + exit */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
            title={soundEnabled ? "Mute timer sound" : "Enable timer sound"}
          >
            {soundEnabled
              ? <Volume2 className="w-4 h-4 text-slate-500" />
              : <VolumeX className="w-4 h-4 text-slate-400" />
            }
          </button>
          <button onClick={onExit} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Exit">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Main content area with floating side arrows */}
      <div className="flex-1 relative flex items-center justify-center px-20 py-8">
        {/* LEFT ARROW — big, obvious, always visible */}
        {currentSlide > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all shadow-sm"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {/* Slide content */}
        {slide.content}

        {/* RIGHT ARROW — big, obvious, always visible */}
        {currentSlide < totalSlides - 1 && (
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-all shadow-md"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* Bottom bar: slide strip */}
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-2.5">
        <div className="flex items-center justify-center gap-1">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all ${
                i === currentSlide
                  ? "bg-teal-600 text-white shadow-sm"
                  : i < currentSlide
                    ? "bg-teal-50 border border-teal-200 text-teal-600"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-teal-300"
              }`}
              title={s.title}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="text-center mt-1">
          <span className="text-[10px] text-slate-400">Use arrow keys or click arrows to navigate</span>
        </div>
      </div>
    </div>
  );
}
