"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
  Lightbulb,
  ArrowRight,
  Rocket,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ─── Storage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = "schoolgle_features_seen";

function getSeenFeatures(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function markFeatureSeen(featureId: string) {
  const seen = getSeenFeatures();
  seen.add(featureId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
}

function resetFeatures() {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Types ───────────────────────────────────────────────────────────────

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  module: "estates" | "compliance" | "general";
  category: string;
  link?: string;
  steps?: string[];
  isNew?: boolean;
}

// ─── Feature Spotlight ───────────────────────────────────────────────────

interface SpotlightProps {
  featureId: string;
  title: string;
  description: string;
  steps?: string[];
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}

export function FeatureSpotlight({
  featureId,
  title,
  description,
  steps,
  position = "bottom",
  children,
}: SpotlightProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeen, setIsSeen] = useState(true);

  useEffect(() => {
    setIsSeen(getSeenFeatures().has(featureId));
  }, [featureId]);

  const handleOpen = () => {
    setIsOpen(true);
    markFeatureSeen(featureId);
    setIsSeen(true);
  };

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
    left: "right-full top-1/2 -translate-y-1/2 mr-3",
    right: "left-full top-1/2 -translate-y-1/2 ml-3",
  };

  return (
    <div className="relative inline-flex">
      <div onClick={handleOpen} className="cursor-pointer">
        {children}
      </div>

      {!isSeen && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
        </span>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: position === "bottom" ? -4 : position === "top" ? 4 : 0,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionClasses[position]} w-72`}
          >
            <Card className="shadow-lg border-sky-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-sky-500 shrink-0" />
                    <h4 className="font-semibold text-sm text-slate-900">
                      {title}
                    </h4>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {description}
                </p>
                {steps && steps.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    <p className="text-xs font-medium text-slate-700">
                      How to use:
                    </p>
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-sky-100 text-sky-600 text-[10px] flex items-center justify-center font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-600">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Feature Checklist Panel ─────────────────────────────────────────────

interface ChecklistProps {
  features: Feature[];
  moduleFilter?: "estates" | "compliance" | "general";
  accentColor?: string;
}

export function FeatureChecklist({
  features,
  moduleFilter,
  accentColor = "#0ea5e9",
}: ChecklistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [seenFeatures, setSeenFeatures] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSeenFeatures(getSeenFeatures());
  }, []);

  const filtered = moduleFilter
    ? features.filter(
        (f) => f.module === moduleFilter || f.module === "general",
      )
    : features;
  const categories = [...new Set(filtered.map((f) => f.category))];
  const completedCount = filtered.filter((f) => seenFeatures.has(f.id)).length;
  const progress =
    filtered.length > 0
      ? Math.round((completedCount / filtered.length) * 100)
      : 0;

  const handleFeatureClick = (featureId: string) => {
    markFeatureSeen(featureId);
    setSeenFeatures(new Set([...seenFeatures, featureId]));
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-medium hover:shadow-xl transition-shadow"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, #0ea5e9)`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Rocket className="h-4 w-4" />
        <span>Discover Features</span>
        {completedCount < filtered.length && (
          <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
            {completedCount}/{filtered.length}
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div
                className="p-6 border-b"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}10, ${accentColor}05)`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="h-5 w-5"
                      style={{ color: accentColor }}
                    />
                    <h2 className="font-bold text-lg text-slate-900">
                      Feature Guide
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Explore what you can do and learn as you go.
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Features explored</span>
                    <span
                      className="font-medium"
                      style={{ color: accentColor }}
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: accentColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {categories.map((category) => {
                  const categoryFeatures = filtered.filter(
                    (f) => f.category === category,
                  );
                  const categoryComplete = categoryFeatures.filter((f) =>
                    seenFeatures.has(f.id),
                  ).length;
                  const isExpanded = expandedCategory === category;

                  return (
                    <div
                      key={category}
                      className="rounded-lg border border-slate-200 overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedCategory(isExpanded ? null : category)
                        }
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                          <span className="font-medium text-sm text-slate-800">
                            {category}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {categoryComplete}/{categoryFeatures.length}
                        </Badge>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 space-y-1">
                              {categoryFeatures.map((feature) => {
                                const seen = seenFeatures.has(feature.id);
                                return (
                                  <button
                                    key={feature.id}
                                    onClick={() =>
                                      handleFeatureClick(feature.id)
                                    }
                                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${seen ? "bg-slate-50" : "bg-sky-50/50 hover:bg-sky-50"}`}
                                  >
                                    <div
                                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${seen ? "bg-green-100 text-green-600" : "bg-sky-100 text-sky-600"}`}
                                    >
                                      {seen ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`text-sm font-medium ${seen ? "text-slate-500" : "text-slate-800"}`}
                                        >
                                          {feature.title}
                                        </span>
                                        {feature.isNew && (
                                          <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 border-0">
                                            NEW
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                        {feature.description}
                                      </p>
                                      {feature.steps && !seen && (
                                        <div className="mt-2 space-y-1">
                                          {feature.steps.map((step, i) => (
                                            <p
                                              key={i}
                                              className="text-[11px] text-slate-400 flex items-start gap-1.5"
                                            >
                                              <span className="font-medium text-sky-500">
                                                {i + 1}.
                                              </span>
                                              {step}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                      {feature.link && (
                                        <a
                                          href={feature.link}
                                          className="inline-flex items-center gap-1 text-xs font-medium mt-2 hover:underline"
                                          style={{ color: accentColor }}
                                        >
                                          Try it{" "}
                                          <ArrowRight className="h-3 w-3" />
                                        </a>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-slate-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      resetFeatures();
                      setSeenFeatures(new Set());
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Reset progress
                  </button>
                  {progress === 100 && (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">
                        All features explored!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
