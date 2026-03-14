"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStaffing } from "@/store/staffingStore";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIER_CONFIG } from "../tier-config";

const fmt = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");
const pct = (n: number) => (Math.round(n * 10) / 10).toFixed(1) + "%";

interface ChatMessage {
  role: "ai" | "user";
  text: string;
}

const QUICK_PROMPTS = [
  "Where can I save money?",
  "Is my SLT structure sustainable?",
  "How many teachers can I afford?",
  "Generate a governor summary",
  "What does ICFP say about my TA spend?",
];

function buildContext(
  m: ReturnType<typeof useStaffing>["computedMetrics"],
  state: ReturnType<typeof useStaffing>["state"],
): string {
  const phase = state.schoolSettings?.phase ?? "primary";
  const roll = state.schoolSettings?.roll ?? 420;
  const gag = state.schoolSettings?.gag_per_pupil ?? 5200;
  const scenario = state.scenarios.find((s) => s.id === state.activeScenarioId);
  const released = state.scenarioPosts.filter((sp) => sp.status === "released");
  const added = state.scenarioPosts.filter((sp) => sp.status === "added");

  let ctx = `School: ${phase} phase, ${roll} pupils on roll, GAG income approximately ${fmt(roll * gag)} per year.\n`;
  ctx += `Staffing model (${scenario?.name ?? "Scenario"}): total staff cost ${fmt(m.totalStaffingCost)}, which is ${pct(m.staffingPct)} of estimated income.\n`;
  ctx += `Staff breakdown: HT ${fmt(m.tierBreakdown.headteacher.cost)}, SLT ${fmt(m.tierBreakdown.slt.cost)}, Teachers ${fmt(m.tierBreakdown.teachers.cost)}, TAs ${fmt(m.tierBreakdown.tas.cost)}, Support ${fmt(m.tierBreakdown.support.cost)}.\n`;
  ctx += `Teaching staff: ${m.teacherFte.toFixed(1)} teacher FTE, ${m.tierBreakdown.slt.fte.toFixed(1)} SLT FTE. PTR: ${m.pupilTeacherRatio.toFixed(1)}.\n`;
  ctx += `SLT cost is ${pct(m.sltPct)} of total staffing (DfE target <15%).\n`;

  if (released.length > 0) {
    ctx += `Released: ${released.map((sp) => `${sp.staff_post.name || sp.staff_post.role} (${sp.staff_post.role})`).join(", ")}.\n`;
  }
  if (added.length > 0) {
    ctx += `Added: ${added.map((sp) => sp.staff_post.role).join(", ")}.\n`;
  }
  ctx += "Provide practical, UK-school-specific advice using the numbers. Reference DfE guidance, SFVS, ICFP benchmarks.";
  return ctx;
}

function buildIntroMessage(
  m: ReturnType<typeof useStaffing>["computedMetrics"],
  state: ReturnType<typeof useStaffing>["state"],
): string {
  const phase = state.schoolSettings?.phase ?? "primary";
  const roll = state.schoolSettings?.roll ?? 420;

  let intro = `Hello! I've analysed your staffing model for your ${phase} school with ${roll} pupils.\n\n`;
  intro += `Your staffing is at ${pct(m.staffingPct)} of income`;
  if (m.staffingPct < 80) intro += " — within DfE guidance.";
  else if (m.staffingPct < 85) intro += " — slightly over the 80% target.";
  else intro += " — significantly over the 80% threshold. This needs attention.";

  if (m.sltPct > 15) {
    intro += `\n\nYour SLT cost is ${pct(m.sltPct)} of staffing, above the 15% guidance.`;
  }
  intro += "\n\nWhat would you like to explore?";
  return intro;
}

export function AIAdvisorView() {
  const { computedMetrics: m, state } = useStaffing();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "ai", text: buildIntroMessage(m, state) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim()) return;
      setInput("");
      setShowQuickPrompts(false);
      setMessages((prev) => [...prev, { role: "user", text: question }]);
      setLoading(true);

      try {
        const ctx = buildContext(m, state);
        const res = await fetch("/api/ai/staffing-advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, context: ctx }),
        });

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [...prev, { role: "ai", text: data.reply ?? "No response received." }]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: "AI advisor unavailable. Check your connection or review the ICFP metrics tab." },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "AI advisor unavailable. Check your connection or review the ICFP metrics tab." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [m, state],
  );

  return (
    <div className="flex flex-col h-[420px] border border-slate-200/60 dark:border-slate-700/50 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      {/* Messages */}
      <div ref={msgsRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[90%] ${msg.role === "ai" ? "self-start" : "self-end"}`}
          >
            <div className="text-[9px] text-slate-400 dark:text-slate-500 mb-0.5 px-0.5">
              {msg.role === "ai" ? "Schoolgle AI" : "You"}
            </div>
            <div
              className={`px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "ai"
                  ? "bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-xl rounded-bl-none text-slate-900 dark:text-white"
                  : "bg-[#0F6E56] text-[#E1F5EE] rounded-xl rounded-br-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="self-start">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-xl rounded-bl-none px-3 py-2 flex gap-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "200ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {showQuickPrompts && (
        <div className="flex gap-1.5 px-3 pb-2 flex-wrap">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:border-[#0F6E56] hover:text-[#0F6E56] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200/60 dark:border-slate-700/50 px-3 py-2 flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about your staffing model..."
          className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
          disabled={loading}
        />
        <Button
          size="sm"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-[#0F6E56] hover:bg-[#0F6E56]/90 text-white h-8"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
