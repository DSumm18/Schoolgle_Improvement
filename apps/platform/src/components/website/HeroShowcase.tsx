"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Globe, BarChart3, ChevronRight } from "lucide-react";

interface ShowcaseScene {
  id: string;
  label: string;
  icon: React.ElementType;
  accentColor: string;
  title: string;
  subtitle: string;
  messages: { role: "user" | "ed"; text: string; delay: number }[];
  dashboardContent?: React.ReactNode;
}

const scenes: ShowcaseScene[] = [
  {
    id: "staff",
    label: "Ed for Staff",
    icon: MessageCircle,
    accentColor: "text-blue-400",
    title: "Arbor MIS",
    subtitle: "Ed guides you through any system",
    messages: [
      {
        role: "user",
        text: "How do I run an attendance report for Year 3 this term?",
        delay: 0,
      },
      {
        role: "ed",
        text: "I can see you're in Arbor. Click 'Students' in the left menu, then 'Attendance' > 'Reports'. I'll highlight the button for you.",
        delay: 1.2,
      },
      {
        role: "user",
        text: "Found it! But which date range do I pick?",
        delay: 3,
      },
      {
        role: "ed",
        text: "Select 'This Academic Term' from the dropdown. I can see it on your screen — it's the third option. Want me to click it for you?",
        delay: 4.2,
      },
    ],
  },
  {
    id: "parent",
    label: "Ed for Parents",
    icon: Globe,
    accentColor: "text-emerald-400",
    title: "School Website",
    subtitle: "24/7 support for parents",
    messages: [
      {
        role: "user",
        text: "What time does the school open for breakfast club?",
        delay: 0,
      },
      {
        role: "ed",
        text: "Breakfast club runs from 7:45am to 8:30am. It costs \u00a32.50 per session. You can book through the school office or via ParentPay.",
        delay: 1.2,
      },
      {
        role: "user",
        text: "Is there space available this week?",
        delay: 3,
      },
      {
        role: "ed",
        text: "Let me check... Yes, there are spaces available on Wednesday and Thursday. Shall I send a booking request to the office for you?",
        delay: 4.2,
      },
    ],
  },
  {
    id: "ofsted",
    label: "Inspection Ready",
    icon: BarChart3,
    accentColor: "text-amber-400",
    title: "Ofsted Readiness",
    subtitle: "Always prepared, never scrambling",
    messages: [],
  },
];

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-primary/40"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const ChatMessage = ({
  role,
  text,
  isVisible,
}: {
  role: "user" | "ed";
  text: string;
  isVisible: boolean;
}) => {
  const [showText, setShowText] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    if (isVisible && role === "ed") {
      setShowTyping(true);
      const timer = setTimeout(() => {
        setShowTyping(false);
        setShowText(true);
      }, 800);
      return () => clearTimeout(timer);
    } else if (isVisible) {
      setShowText(true);
    }
  }, [isVisible, role]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      {role === "ed" && !showText && showTyping && (
        <div className="max-w-[80%] rounded-2xl bg-primary/10 border border-primary/20">
          <TypingIndicator />
        </div>
      )}
      {showText && (
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
            role === "user"
              ? "bg-foreground/10 text-foreground/80"
              : "bg-primary/10 text-foreground/90 border border-primary/20"
          }`}
        >
          {role === "ed" && (
            <span className="text-primary font-bold text-[10px] uppercase tracking-wider block mb-1">
              Ed
            </span>
          )}
          {text}
        </div>
      )}
    </motion.div>
  );
};

const OfstedDashboard = () => (
  <div className="p-4 space-y-3">
    {/* Readiness score */}
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-foreground/70">
        Overall Readiness
      </span>
      <span className="text-lg font-black text-emerald-400">87%</span>
    </div>
    <div className="w-full h-2 rounded-full bg-foreground/5 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
        initial={{ width: 0 }}
        animate={{ width: "87%" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </div>

    {/* Judgement areas */}
    <div className="grid grid-cols-2 gap-2 mt-3">
      {[
        { area: "Quality of Education", score: 92, color: "bg-emerald-400" },
        {
          area: "Behaviour & Attitudes",
          score: 85,
          color: "bg-emerald-400",
        },
        { area: "Personal Development", score: 88, color: "bg-emerald-400" },
        {
          area: "Leadership & Mgmt",
          score: 78,
          color: "bg-amber-400",
        },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.15 }}
          className="p-3 rounded-xl bg-foreground/[0.03] border border-border"
        >
          <div className="text-[10px] font-semibold text-muted-foreground mb-1.5 leading-tight">
            {item.area}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-foreground/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${item.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 1, delay: 0.8 + i * 0.15 }}
              />
            </div>
            <span className="text-xs font-bold text-foreground/70">
              {item.score}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Recent evidence */}
    <div className="mt-2 space-y-1.5">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        Recent Evidence
      </span>
      {[
        "Pupil progress meeting notes uploaded",
        "Safeguarding audit completed",
        "CPD log updated for 12 staff",
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5 + i * 0.2 }}
          className="flex items-center gap-2 text-[11px] text-foreground/60"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {item}
        </motion.div>
      ))}
    </div>
  </div>
);

const HeroShowcase = () => {
  const [activeScene, setActiveScene] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);

  // Auto-rotate scenes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % scenes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Animate messages appearing
  useEffect(() => {
    setVisibleMessages([]);
    const scene = scenes[activeScene];
    if (scene.messages.length === 0) return;

    const timers = scene.messages.map((msg, i) =>
      setTimeout(
        () => setVisibleMessages((prev) => [...prev, i]),
        msg.delay * 1000,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [activeScene]);

  const currentScene = scenes[activeScene];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Scene tabs */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {scenes.map((scene, i) => (
          <button
            key={scene.id}
            onClick={() => setActiveScene(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              i === activeScene
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <scene.icon size={14} />
            {scene.label}
          </button>
        ))}
      </div>

      {/* Showcase window */}
      <motion.div
        layout
        className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/10"
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-foreground/[0.02]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-amber-400/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
            </div>
            <div className="ml-3 flex items-center gap-2 px-3 py-1 rounded-md bg-foreground/5 text-[11px] text-muted-foreground">
              <currentScene.icon
                size={12}
                className={currentScene.accentColor}
              />
              <span className="font-medium">{currentScene.title}</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground/50 font-medium">
            {currentScene.subtitle}
          </span>
        </div>

        {/* Content area */}
        <div className="min-h-[320px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentScene.id === "ofsted" ? (
                <OfstedDashboard />
              ) : (
                <div className="p-4 space-y-3">
                  {currentScene.messages.map((msg, i) => (
                    <ChatMessage
                      key={`${currentScene.id}-${i}`}
                      role={msg.role}
                      text={msg.text}
                      isVisible={visibleMessages.includes(i)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-foreground/5">
          <motion.div
            className="h-full bg-primary/30"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 10, ease: "linear" }}
            key={activeScene}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default HeroShowcase;
