"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Clock, X, BookOpen, Target, Zap, Pencil, Users } from "lucide-react";
import type { LSLessonPlan, PlanSection, VocabularyItem } from "@/types/lesson-studio";

interface TeachModeProps {
  plan: LSLessonPlan;
  onExit: () => void;
}

interface Slide {
  type: "welcome" | "objective" | "vocabulary" | "phase" | "groups" | "plenary";
  title: string;
  content: React.ReactNode;
}

const PHASE_COLORS: Record<string, string> = {
  Starter: "from-amber-600 to-amber-800",
  Teach: "from-blue-600 to-blue-800",
  Practice: "from-green-600 to-green-800",
  Plenary: "from-purple-600 to-purple-800",
};

export function TeachMode({ plan, onExit }: TeachModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTarget, setTimerTarget] = useState(0);

  // Build slides
  const slides: Slide[] = [];

  // Welcome
  slides.push({
    type: "welcome",
    title: plan.subject,
    content: (
      <div className="text-center">
        <h1 className="text-6xl font-black text-white mb-4">{plan.title}</h1>
        <p className="text-2xl text-white/70">{plan.subject} • {plan.scheme_name}</p>
      </div>
    ),
  });

  // Objective
  slides.push({
    type: "objective",
    title: "Learning Objective",
    content: (
      <div className="text-center max-w-4xl mx-auto">
        <Target className="w-16 h-16 text-teal-400 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-white leading-snug mb-8">{plan.learning_objective}</h2>
        {plan.success_criteria?.length > 0 && (
          <div className="space-y-3">
            {plan.success_criteria.map((sc, i) => (
              <div key={i} className="text-2xl text-teal-300 flex items-center gap-3 justify-center">
                <span className="text-teal-500">✓</span> {sc}
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
      title: "Key Vocabulary",
      content: (
        <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
          {(plan.key_vocabulary as VocabularyItem[]).map((v, i) => (
            <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-black text-white mb-2">{v.word}</div>
              <div className="text-xl text-white/70">{v.definition}</div>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Phase slides
  for (const section of plan.plan_sections as PlanSection[]) {
    const gradient = PHASE_COLORS[section.phase] ?? "from-slate-600 to-slate-800";
    slides.push({
      type: "phase",
      title: section.phase,
      content: (
        <div className="text-center max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${gradient} mb-8`}>
            <span className="text-2xl font-bold text-white">{section.phase}</span>
            <span className="text-lg text-white/70">{section.time}</span>
          </div>
          <p className="text-3xl text-white leading-relaxed">{section.description}</p>
        </div>
      ),
    });
  }

  // Groups
  if ((plan.differentiation_groups as unknown[])?.length > 0) {
    slides.push({
      type: "groups",
      title: "Group Activities",
      content: (
        <div className="grid grid-cols-2 gap-4 max-w-5xl mx-auto">
          {(plan.differentiation_groups as Array<{ name: string; pupils: string; description: string; resourceNotes: string }>).map((g, i) => {
            const colors = ["border-blue-400 bg-blue-500/10", "border-green-400 bg-green-500/10", "border-amber-400 bg-amber-500/10", "border-red-400 bg-red-500/10"];
            return (
              <div key={i} className={`rounded-2xl border-l-4 p-6 ${colors[i] ?? colors[0]}`}>
                <div className="text-2xl font-bold text-white mb-1">{g.name}</div>
                <div className="text-lg text-white/60 mb-3">{g.resourceNotes}</div>
                <p className="text-xl text-white/80">{g.description}</p>
              </div>
            );
          })}
        </div>
      ),
    });
  }

  const totalSlides = slides.length;

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
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

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev >= timerTarget) {
          setTimerRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerTarget]);

  const startTimer = (minutes: number) => {
    setTimerSeconds(0);
    setTimerTarget(minutes * 60);
    setTimerRunning(true);
  };

  const formatTime = (s: number) => {
    const remaining = timerTarget - s;
    const m = Math.floor(Math.abs(remaining) / 60);
    const sec = Math.abs(remaining) % 60;
    return `${remaining < 0 ? "-" : ""}${m}:${sec.toString().padStart(2, "0")}`;
  };

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/30">
        <div className="text-sm text-white/50">
          {currentSlide + 1} / {totalSlides}
        </div>
        <div className="text-lg font-bold text-white/80">{slide.title}</div>
        <div className="flex items-center gap-3">
          {timerRunning && (
            <div className={`text-lg font-mono font-bold ${timerSeconds >= timerTarget ? "text-red-400 animate-pulse" : "text-white"}`}>
              {formatTime(timerSeconds)}
            </div>
          )}
          <div className="flex gap-1">
            {[1, 2, 5, 10].map((m) => (
              <button
                key={m}
                onClick={() => startTimer(m)}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
              >
                {m}m
              </button>
            ))}
          </div>
          <button onClick={onExit} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-12">
        {slide.content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/30">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          disabled={currentSlide === 0}
          className="flex items-center gap-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? "bg-teal-400 w-6" : "bg-white/30 hover:bg-white/50"}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-30"
        >
          Next <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
