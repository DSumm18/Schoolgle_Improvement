"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, X, Target, Volume2, VolumeX } from "lucide-react";
import type { LSLessonPlan, PlanSection, VocabularyItem, DifferentiationGroup } from "@/types/lesson-studio";

interface TeachModeProps {
  plan: LSLessonPlan;
  onExit: () => void;
}

interface Slide {
  type: "welcome" | "objective" | "vocabulary" | "phase" | "groups";
  label: string;
  title: string;
  content: React.ReactNode;
  time?: string; // phase duration for auto-timer
}

const PHASE_COLORS: Record<string, { bg: string; accent: string }> = {
  Starter: { bg: "bg-amber-50", accent: "text-amber-700" },
  Teach: { bg: "bg-blue-50", accent: "text-blue-700" },
  Practice: { bg: "bg-green-50", accent: "text-green-700" },
  Plenary: { bg: "bg-purple-50", accent: "text-purple-700" },
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

    // Three-note ascending chime (C5, E5, G5)
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

    // Clean up after sounds finish
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Web Audio not available — silent fallback
  }
}

/** Parse "5 mins" / "10 minutes" / "15m" to number */
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

  // Welcome / Title
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

  // Learning Objective
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

  // Vocabulary
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

  // Phase slides
  for (const section of (plan.plan_sections as PlanSection[]) || []) {
    const colors = PHASE_COLORS[section.phase] ?? { bg: "bg-slate-50", accent: "text-slate-700" };
    slides.push({
      type: "phase",
      label: section.phase,
      title: section.phase,
      time: section.time,
      content: (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className={`text-2xl font-bold ${colors.accent}`}>{section.phase}</span>
            {section.time && (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                <Clock className="w-3.5 h-3.5 inline mr-1" />{section.time}
              </span>
            )}
          </div>
          <p className="text-2xl text-slate-700 leading-relaxed">{section.description}</p>
        </div>
      ),
    });
  }

  // Differentiation Groups
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

  // Auto-start timer when entering a phase slide
  useEffect(() => {
    if (slide?.type === "phase" && slide.time) {
      const mins = parseMinutes(slide.time);
      if (mins > 0) {
        setTimerSeconds(0);
        setTimerTarget(mins * 60);
        setTimerRunning(true);
        hasPlayedRef.current = false;
      }
    } else {
      setTimerRunning(false);
    }
  }, [currentSlide]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        onExit();
      }
    },
    [totalSlides, onExit],
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
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Top bar — light, visible */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-800">
            {currentSlide + 1} <span className="text-slate-400">/ {totalSlides}</span>
          </span>
          <span className="text-sm text-slate-500">{slide.label}</span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3">
          {timerTarget > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
          <button onClick={onExit} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Exit Teach Mode">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-12 py-8">
        {slide.content}
      </div>

      {/* Bottom navigation — clear, visible buttons */}
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {/* Slide thumbnail strip */}
          <div className="flex gap-1">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                  i === currentSlide
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600"
                }`}
                title={s.title}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))}
            disabled={currentSlide === totalSlides - 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
