"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, Eye } from "lucide-react";
import type { LSLessonPlan, VocabularyItem, DifferentiationGroup } from "@/types/lesson-studio";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonVisualisationProps {
  plan: LSLessonPlan;
  variant?: "standard" | "high_contrast" | "simplified" | "extended";
}

type VisType = "labelled-diagram" | "fraction-wall" | "generic";

interface HotspotData {
  id: string;
  label: string;
  definition: string;
  x: number;
  y: number;
  revealed: boolean;
}

interface FractionBar {
  numerator: number;
  denominator: number;
  label: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VARIANT_STYLES: Record<string, { bg: string; text: string; accent: string; labelBg: string }> = {
  standard: { bg: "#ffffff", text: "#1f2937", accent: "#0d9488", labelBg: "#f0fdfa" },
  high_contrast: { bg: "#ffffff", text: "#000000", accent: "#000000", labelBg: "#ffff00" },
  simplified: { bg: "#ffffff", text: "#374151", accent: "#0d9488", labelBg: "#f0fdfa" },
  extended: { bg: "#ffffff", text: "#1f2937", accent: "#0d9488", labelBg: "#ecfdf5" },
};

const FRACTION_COLORS = [
  "#0d9488", "#2563eb", "#dc2626", "#d97706", "#7c3aed",
  "#db2777", "#059669", "#ea580c", "#4f46e5", "#0891b2",
];

// ---------------------------------------------------------------------------
// Detection: which visualisation type fits?
// ---------------------------------------------------------------------------

function detectVisType(plan: LSLessonPlan): VisType {
  const subject = (plan.subject ?? "").toLowerCase();
  const title = (plan.title ?? "").toLowerCase();
  const objective = (plan.learning_objective ?? "").toLowerCase();
  const allText = `${subject} ${title} ${objective}`;

  // Fractions / maths fraction topics
  if (
    subject.includes("math") &&
    /fraction|equivalent|compare|order|half|quarter|third|denominator|numerator/.test(allText)
  ) {
    return "fraction-wall";
  }

  // Science with vocabulary = labelled diagram
  if (
    subject.includes("science") &&
    plan.key_vocabulary &&
    plan.key_vocabulary.length >= 3
  ) {
    return "labelled-diagram";
  }

  // Any plan with 4+ vocabulary items
  if (plan.key_vocabulary && plan.key_vocabulary.length >= 4) {
    return "labelled-diagram";
  }

  return "generic";
}

// ---------------------------------------------------------------------------
// Generate hotspots from vocabulary
// ---------------------------------------------------------------------------

function generateHotspots(vocab: VocabularyItem[], simplified: boolean): HotspotData[] {
  const items = simplified ? vocab.slice(0, 4) : vocab;
  const count = items.length;

  // Arrange in a circle-ish pattern
  return items.map((v, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const radiusX = 220;
    const radiusY = 140;
    return {
      id: `hotspot-${i}`,
      label: v.word,
      definition: v.definition,
      x: 400 + Math.cos(angle) * radiusX,
      y: 220 + Math.sin(angle) * radiusY,
      revealed: false,
    };
  });
}

// ---------------------------------------------------------------------------
// Generate fraction bars
// ---------------------------------------------------------------------------

function generateFractionBars(plan: LSLessonPlan): FractionBar[] {
  // Try to extract from differentiation or title
  const title = (plan.title ?? "").toLowerCase();
  const objective = (plan.learning_objective ?? "").toLowerCase();

  // Common fractions for primary
  const defaultFractions: FractionBar[] = [
    { numerator: 1, denominator: 1, label: "1 whole", color: FRACTION_COLORS[0] },
    { numerator: 1, denominator: 2, label: "1/2", color: FRACTION_COLORS[1] },
    { numerator: 1, denominator: 3, label: "1/3", color: FRACTION_COLORS[2] },
    { numerator: 1, denominator: 4, label: "1/4", color: FRACTION_COLORS[3] },
    { numerator: 1, denominator: 5, label: "1/5", color: FRACTION_COLORS[4] },
    { numerator: 1, denominator: 6, label: "1/6", color: FRACTION_COLORS[5] },
    { numerator: 1, denominator: 8, label: "1/8", color: FRACTION_COLORS[6] },
    { numerator: 1, denominator: 10, label: "1/10", color: FRACTION_COLORS[7] },
    { numerator: 1, denominator: 12, label: "1/12", color: FRACTION_COLORS[8] },
  ];

  // If about equivalence, show pairs
  if (/equivalent/.test(title + objective)) {
    return [
      { numerator: 1, denominator: 1, label: "1 whole", color: FRACTION_COLORS[0] },
      { numerator: 1, denominator: 2, label: "1/2", color: FRACTION_COLORS[1] },
      { numerator: 2, denominator: 4, label: "2/4", color: FRACTION_COLORS[1] },
      { numerator: 1, denominator: 3, label: "1/3", color: FRACTION_COLORS[2] },
      { numerator: 2, denominator: 6, label: "2/6", color: FRACTION_COLORS[2] },
      { numerator: 1, denominator: 4, label: "1/4", color: FRACTION_COLORS[3] },
      { numerator: 2, denominator: 8, label: "2/8", color: FRACTION_COLORS[3] },
    ];
  }

  return defaultFractions;
}

// ---------------------------------------------------------------------------
// Labelled Diagram Visualisation
// ---------------------------------------------------------------------------

function LabelledDiagram({
  plan,
  variant,
  styles,
}: {
  plan: LSLessonPlan;
  variant: string;
  styles: typeof VARIANT_STYLES.standard;
}) {
  const vocab = (plan.key_vocabulary ?? []) as VocabularyItem[];
  const simplified = variant === "simplified";
  const hotspots = useMemo(() => generateHotspots(vocab, simplified), [vocab, simplified]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const revealAll = () => {
    setRevealed(new Set(hotspots.map((h) => h.id)));
  };

  const topic = plan.title ?? plan.learning_objective ?? "Diagram";

  return (
    <div className="space-y-4">
      {/* Topic label */}
      <div className="text-center">
        <h3 className="text-base font-semibold text-gray-900">{topic}</h3>
        <p className="text-xs text-gray-500 mt-0.5">Click each point to reveal the label</p>
      </div>

      {/* SVG diagram area */}
      <svg viewBox="0 0 800 440" className="w-full" style={{ maxHeight: 440 }}>
        {/* Central shape */}
        <motion.ellipse
          cx={400}
          cy={220}
          rx={120}
          ry={90}
          fill="none"
          stroke={styles.accent}
          strokeWidth={2}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.text
          x={400}
          y={220}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={styles.text}
          fontSize={simplified ? 16 : 14}
          fontWeight={600}
          fontFamily="Poppins, sans-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {plan.subject}
        </motion.text>

        {/* Hotspots */}
        {hotspots.map((hp, i) => {
          const isRevealed = revealed.has(hp.id);
          return (
            <g key={hp.id}>
              {/* Connector line */}
              <motion.line
                x1={400}
                y1={220}
                x2={hp.x}
                y2={hp.y}
                stroke={styles.accent}
                strokeWidth={1}
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              />

              {/* Hotspot circle */}
              <motion.circle
                cx={hp.x}
                cy={hp.y}
                r={isRevealed ? 8 : 12}
                fill={isRevealed ? styles.accent : "#f59e0b"}
                stroke="white"
                strokeWidth={2}
                style={{ cursor: "pointer" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.3 }}
                onClick={() => toggleReveal(hp.id)}
                role="button"
                aria-label={`Reveal: ${hp.label}`}
                tabIndex={0}
              />

              {/* Pulse ring on unrevealed */}
              {!isRevealed && (
                <motion.circle
                  cx={hp.x}
                  cy={hp.y}
                  r={12}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}

              {/* Label box */}
              <AnimatePresence>
                {isRevealed && (
                  <motion.g
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <rect
                      x={hp.x - 80}
                      y={hp.y + 16}
                      width={160}
                      height={variant === "extended" ? 52 : 40}
                      rx={8}
                      fill={styles.labelBg}
                      stroke={styles.accent}
                      strokeWidth={1}
                    />
                    <text
                      x={hp.x}
                      y={hp.y + 32}
                      textAnchor="middle"
                      fill={styles.text}
                      fontSize={simplified ? 13 : 11}
                      fontWeight={600}
                      fontFamily="Poppins, sans-serif"
                    >
                      {hp.label}
                    </text>
                    {variant !== "simplified" && (
                      <text
                        x={hp.x}
                        y={hp.y + 46}
                        textAnchor="middle"
                        fill="#6b7280"
                        fontSize={9}
                        fontFamily="Poppins, sans-serif"
                      >
                        {hp.definition.length > 30
                          ? hp.definition.slice(0, 30) + "..."
                          : hp.definition}
                      </text>
                    )}
                  </motion.g>
                )}
              </AnimatePresence>
            </g>
          );
        })}
      </svg>

      {/* Reveal all button */}
      {revealed.size < hotspots.length && (
        <div className="text-center">
          <button
            onClick={revealAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Reveal all labels
          </button>
        </div>
      )}

      {/* Vocabulary list for extended variant */}
      {variant === "extended" && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          {vocab.map((v, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold text-gray-900">{v.word}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{v.definition}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fraction Wall Visualisation
// ---------------------------------------------------------------------------

function FractionWall({
  plan,
  variant,
  styles,
}: {
  plan: LSLessonPlan;
  variant: string;
  styles: typeof VARIANT_STYLES.standard;
}) {
  const bars = useMemo(() => generateFractionBars(plan), [plan]);
  const simplified = variant === "simplified";
  const [highlightedDenom, setHighlightedDenom] = useState<number | null>(null);

  const barWidth = 700;
  const barHeight = simplified ? 40 : 32;
  const gap = 4;
  const startX = 50;
  const startY = 30;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-base font-semibold text-gray-900">Fraction Wall</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Compare fractions by their size. Click a row to highlight equivalences.
        </p>
      </div>

      <svg
        viewBox={`0 0 800 ${startY + bars.length * (barHeight + gap) + 20}`}
        className="w-full"
      >
        {bars.map((bar, rowIdx) => {
          const segmentWidth = barWidth / bar.denominator;
          const y = startY + rowIdx * (barHeight + gap);
          const isHighlighted = highlightedDenom !== null && bar.color === bars.find((b) => b.denominator === highlightedDenom)?.color;

          return (
            <g
              key={`${bar.label}-${rowIdx}`}
              style={{ cursor: "pointer" }}
              onClick={() =>
                setHighlightedDenom(
                  highlightedDenom === bar.denominator ? null : bar.denominator,
                )
              }
              role="button"
              aria-label={`Fraction row: ${bar.label}`}
              tabIndex={0}
            >
              {/* Row label */}
              <text
                x={startX - 8}
                y={y + barHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill={styles.text}
                fontSize={simplified ? 13 : 11}
                fontWeight={600}
                fontFamily="Poppins, sans-serif"
              >
                {bar.label}
              </text>

              {/* Segments */}
              {Array.from({ length: bar.denominator }).map((_, segIdx) => (
                <motion.rect
                  key={segIdx}
                  x={startX + segIdx * segmentWidth + 1}
                  y={y}
                  width={segmentWidth - 2}
                  height={barHeight}
                  rx={4}
                  fill={bar.color}
                  opacity={isHighlighted ? 1 : highlightedDenom !== null ? 0.3 : 0.85}
                  stroke="white"
                  strokeWidth={1}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: isHighlighted ? 1 : highlightedDenom !== null ? 0.3 : 0.85 }}
                  transition={{
                    delay: 0.05 * rowIdx + 0.02 * segIdx,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                  style={{ originX: `${startX + segIdx * segmentWidth}px` }}
                  whileHover={{ opacity: 1 }}
                />
              ))}

              {/* Segment labels (if not simplified and segments are wide enough) */}
              {!simplified &&
                segmentWidth > 40 &&
                Array.from({ length: bar.denominator }).map((_, segIdx) => (
                  <motion.text
                    key={`label-${segIdx}`}
                    x={startX + segIdx * segmentWidth + segmentWidth / 2}
                    y={y + barHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight={500}
                    fontFamily="Poppins, sans-serif"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + 0.05 * rowIdx }}
                  >
                    1/{bar.denominator}
                  </motion.text>
                ))}
            </g>
          );
        })}
      </svg>

      {/* Extended: equivalence notes */}
      {variant === "extended" && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-1">Equivalence Key</div>
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>1/2 = 2/4 = 3/6 = 4/8 = 5/10 = 6/12</p>
            <p>1/3 = 2/6 = 4/12</p>
            <p>1/4 = 2/8 = 3/12</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic Visualisation (vocabulary-focused)
// ---------------------------------------------------------------------------

function GenericVisualisation({
  plan,
  variant,
  styles,
}: {
  plan: LSLessonPlan;
  variant: string;
  styles: typeof VARIANT_STYLES.standard;
}) {
  const sections = plan.plan_sections ?? [];
  const vocab = (plan.key_vocabulary ?? []) as VocabularyItem[];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-base font-semibold text-gray-900">{plan.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{plan.learning_objective}</p>
      </div>

      {/* Lesson flow as animated timeline */}
      <div className="space-y-3 py-2">
        {sections.map((section, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
          >
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{section.phase}</div>
              <div className="text-xs text-gray-500 mt-0.5">{section.time}</div>
              {variant !== "simplified" && (
                <div className="text-xs text-gray-600 mt-1">{section.description}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Vocabulary grid */}
      {vocab.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-100">
          {vocab.map((v, i) => (
            <motion.div
              key={i}
              className="p-2.5 bg-teal-50 rounded-lg border border-teal-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
            >
              <div className="text-xs font-semibold text-teal-800">{v.word}</div>
              {variant !== "simplified" && (
                <div className="text-[11px] text-teal-600 mt-0.5">{v.definition}</div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LessonVisualisation({
  plan,
  variant = "standard",
}: LessonVisualisationProps) {
  const [currentVariant, setCurrentVariant] = useState(variant);
  const [fullscreen, setFullscreen] = useState(false);

  const visType = useMemo(() => detectVisType(plan), [plan]);
  const styles = VARIANT_STYLES[currentVariant] ?? VARIANT_STYLES.standard;

  const variants: Array<{ value: typeof currentVariant; label: string }> = [
    { value: "standard", label: "Standard" },
    { value: "high_contrast", label: "High Contrast" },
    { value: "simplified", label: "Simplified" },
    { value: "extended", label: "Extended" },
  ];

  const containerClass = fullscreen
    ? "fixed inset-0 z-50 bg-white overflow-y-auto p-6"
    : "bg-white rounded-xl border border-gray-200";

  return (
    <div className={containerClass}>
      {/* Visualisation area */}
      <div className="p-4" style={{ minHeight: fullscreen ? "calc(100vh - 120px)" : 400 }}>
        {visType === "labelled-diagram" && (
          <LabelledDiagram plan={plan} variant={currentVariant} styles={styles} />
        )}
        {visType === "fraction-wall" && (
          <FractionWall plan={plan} variant={currentVariant} styles={styles} />
        )}
        {visType === "generic" && (
          <GenericVisualisation plan={plan} variant={currentVariant} styles={styles} />
        )}
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        {/* Variant selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {variants.map((v) => (
            <button
              key={v.value}
              onClick={() => setCurrentVariant(v.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                currentVariant === v.value
                  ? "bg-white shadow-sm font-semibold text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Caption area */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-500">
          {visType === "labelled-diagram" && "Interactive labelled diagram. Click each hotspot to reveal vocabulary definitions."}
          {visType === "fraction-wall" && "Fraction wall showing proportional sizes. Click a row to highlight equivalent fractions."}
          {visType === "generic" && "Lesson flow visualisation with key vocabulary."}
        </p>
      </div>
    </div>
  );
}
