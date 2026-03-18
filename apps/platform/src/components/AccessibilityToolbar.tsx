"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Monitor,
  Type,
  Minus,
  Plus,
  Accessibility,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────
interface AccessibilityPrefs {
  fontSize: number; // 0 = default, 1 = large, 2 = x-large
  highContrast: boolean;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
}

const DEFAULT_PREFS: AccessibilityPrefs = {
  fontSize: 0,
  highContrast: false,
  dyslexiaFont: false,
  reducedMotion: false,
};

const STORAGE_KEY = "schoolgle-a11y-prefs";
const FONT_SIZE_LABELS = ["Default", "Large", "Extra Large"];
const FONT_SIZE_SCALE = [1, 1.125, 1.25]; // 100%, 112.5%, 125%

// ─── Hook for accessibility preferences ──────────────────
export function useAccessibilityPrefs() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const updatePrefs = useCallback((update: Partial<AccessibilityPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...update };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  // Apply preferences to document
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;

    // Font size scale
    html.style.fontSize = `${FONT_SIZE_SCALE[prefs.fontSize] * 16}px`;

    // High contrast
    html.classList.toggle("high-contrast", prefs.highContrast);

    // Dyslexia font
    html.classList.toggle("dyslexia-font", prefs.dyslexiaFont);

    // Reduced motion
    html.classList.toggle("reduce-motion", prefs.reducedMotion);

    return () => {
      html.style.fontSize = "";
      html.classList.remove("high-contrast", "dyslexia-font", "reduce-motion");
    };
  }, [prefs, mounted]);

  return { prefs, updatePrefs, mounted };
}

// ─── Inline Toolbar Component (top-right dropdown) ───────
export default function AccessibilityToolbar() {
  const { theme, setTheme } = useTheme();
  const { prefs, updatePrefs, mounted } = useAccessibilityPrefs();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // Position panel relative to button — ensure it stays on screen
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const panelHeight = 400; // approximate panel height
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < panelHeight;

    const style: React.CSSProperties = {};

    if (openUpward) {
      // Open upward from the top of the button
      style.bottom = window.innerHeight - rect.top + 8;
    } else {
      style.top = rect.bottom + 8;
    }

    // If button is in the left half of screen (sidebar), open to the right
    // If button is in the right half (mobile header), align right edge
    if (rect.left < window.innerWidth / 2) {
      style.left = Math.max(8, rect.left);
    } else {
      style.right = Math.max(8, window.innerWidth - rect.right);
    }

    setPanelStyle(style);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    // Use setTimeout to avoid the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen]);

  if (!mounted) return null;

  const hasCustomPrefs =
    prefs.fontSize !== 0 ||
    prefs.highContrast ||
    prefs.dyslexiaFont ||
    prefs.reducedMotion;

  const themes = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="relative print:hidden">
      {/* Trigger button — inline, sits in header */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          isOpen
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
        aria-label="Accessibility settings"
        title="Accessibility settings"
      >
        <Accessibility size={18} />
        {hasCustomPrefs && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        )}
      </button>

      {/* Dropdown panel — portalled to body to escape sidebar overflow */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={panelRef}
                initial={{
                  opacity: 0,
                  y: panelStyle.bottom !== undefined ? 8 : -8,
                  scale: 0.95,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: panelStyle.bottom !== undefined ? 8 : -8,
                  scale: 0.95,
                }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="fixed w-72 sm:w-80 rounded-xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden z-[9999] max-h-[80vh] overflow-y-auto"
                style={panelStyle}
                role="dialog"
                aria-label="Accessibility settings panel"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-border bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Accessibility size={16} className="text-primary" />
                      <h3 className="text-sm font-semibold">Accessibility</h3>
                    </div>
                    {hasCustomPrefs && (
                      <button
                        onClick={() => updatePrefs(DEFAULT_PREFS)}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Theme Selector */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                      Theme
                    </label>
                    <div className="flex gap-1 p-1 bg-muted rounded-lg">
                      {themes.map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                            theme === value
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          aria-pressed={theme === value}
                          aria-label={`${label} theme`}
                        >
                          <Icon size={14} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                      Text Size
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updatePrefs({
                            fontSize: Math.max(0, prefs.fontSize - 1),
                          })
                        }
                        disabled={prefs.fontSize === 0}
                        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrease text size"
                      >
                        <Minus size={14} />
                      </button>
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Type
                            size={14 + prefs.fontSize * 3}
                            className="text-primary"
                          />
                          <span className="text-sm font-medium">
                            {FONT_SIZE_LABELS[prefs.fontSize]}
                          </span>
                        </div>
                        <div className="flex justify-center gap-1 mt-1">
                          {FONT_SIZE_LABELS.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => updatePrefs({ fontSize: i })}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                i === prefs.fontSize
                                  ? "bg-primary"
                                  : "bg-border hover:bg-muted-foreground"
                              }`}
                              aria-label={`Set text size to ${FONT_SIZE_LABELS[i]}`}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          updatePrefs({
                            fontSize: Math.min(2, prefs.fontSize + 1),
                          })
                        }
                        disabled={prefs.fontSize === 2}
                        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase text size"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-2">
                    <ToggleOption
                      label="High Contrast"
                      description="Sharper borders and stronger colours"
                      checked={prefs.highContrast}
                      onChange={(v) => updatePrefs({ highContrast: v })}
                    />
                    <ToggleOption
                      label="Dyslexia Font"
                      description="OpenDyslexic for easier reading"
                      checked={prefs.dyslexiaFont}
                      onChange={(v) => updatePrefs({ dyslexiaFont: v })}
                    />
                    <ToggleOption
                      label="Reduced Motion"
                      description="Minimise animations and transitions"
                      checked={prefs.reducedMotion}
                      onChange={(v) => updatePrefs({ reducedMotion: v })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

// ─── Toggle Switch ───────────────────────────────────────
function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div
        className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}
