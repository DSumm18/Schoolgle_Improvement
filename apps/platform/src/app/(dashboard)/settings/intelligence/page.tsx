"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Sliders,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { listSkills, type BrainSkill } from "@/lib/intelligence-brain/skills";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AiPreferences {
  ai_tone: string;
  ai_response_style: string;
  ai_school_context: string;
  ai_priorities: string;
  ai_preferred_terminology: Record<string, string>;
  ai_temperature_offset: number;
}

const DEFAULT_PREFERENCES: AiPreferences = {
  ai_tone: "Professional",
  ai_response_style: "Balanced",
  ai_school_context: "",
  ai_priorities: "",
  ai_preferred_terminology: {},
  ai_temperature_offset: 0,
};

// ─── Skill Card ───────────────────────────────────────────────────────────────

function SkillCard({ skill }: { skill: BrainSkill }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm">{skill.name}</h3>
            <div className="flex flex-wrap gap-1.5">
              {skill.usedBy.map((app) => (
                <span
                  key={app}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{skill.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>Model: <span className="font-mono text-gray-600">{skill.model}</span></span>
            <span>Temp: {skill.temperature}</span>
            <span>Max tokens: {skill.maxTokens.toLocaleString()}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition shrink-0 mt-0.5"
        >
          {expanded ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Hide prompt
            </>
          ) : (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              Preview
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            System Prompt
          </p>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed bg-white border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
            {skill.systemPrompt}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Terminology Editor ───────────────────────────────────────────────────────

function TerminologyEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (val: Record<string, string>) => void;
}) {
  const entries = Object.entries(value);

  const addEntry = () => {
    onChange({ ...value, "": "" });
  };

  const updateKey = (oldKey: string, newKey: string) => {
    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      updated[k === oldKey ? newKey : k] = v;
    }
    onChange(updated);
  };

  const updateValue = (key: string, newVal: string) => {
    onChange({ ...value, [key]: newVal });
  };

  const removeEntry = (key: string) => {
    const updated = { ...value };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {entries.map(([k, v], i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={k}
            onChange={(e) => updateKey(k, e.target.value)}
            placeholder="Standard term"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="text"
            value={v}
            onChange={(e) => updateValue(k, e.target.value)}
            placeholder="Your school's term"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            onClick={() => removeEntry(k)}
            className="p-2 text-gray-400 hover:text-red-500 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addEntry}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
      >
        <Plus className="w-4 h-4" />
        Add term
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntelligenceSettingsPage() {
  const { session } = useAuth();
  const skills = listSkills();

  const [prefs, setPrefs] = useState<AiPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    const load = async () => {
      try {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const res = await fetch("/api/settings/ai-preferences", { headers });
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        if (json.preferences && Object.keys(json.preferences).length > 0) {
          setPrefs({ ...DEFAULT_PREFERENCES, ...json.preferences });
        }
      } catch {
        // Use defaults silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session]);

  const update = <K extends keyof AiPreferences>(
    field: K,
    value: AiPreferences[K],
  ) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/settings/ai-preferences", {
        method: "PUT",
        headers,
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-600" />
            Intelligence Configuration
          </h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Manage how Schoolgle&apos;s AI analyses and reports on your school&apos;s data.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save preferences
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* ── Section A: Intelligence Skills ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-900">Intelligence Skills</h2>
            <span className="ml-auto text-sm text-gray-400">{skills.length} registered</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            These are the AI skills registered across Schoolgle. Each skill is a specialised
            persona used by one or more modules. They are managed centrally — contact support
            to request changes.
          </p>

          {skills.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
              No skills registered yet.
            </div>
          ) : (
            <div className="space-y-3">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </section>

        {/* ── Section B: AI Preferences ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-900">Your School&apos;s AI Preferences</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            These settings are passed to the AI whenever it analyses or generates reports for
            your school. They shape tone, focus, and terminology — making outputs feel like
            they were written for your school specifically.
          </p>

          {loading ? (
            <div className="text-sm text-gray-400">Loading preferences...</div>
          ) : (
            <div className="space-y-5">
              {/* Tone + Response style */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                  Communication Style
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Tone
                    </label>
                    <select
                      value={prefs.ai_tone}
                      onChange={(e) => update("ai_tone", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option>Professional</option>
                      <option>Conversational</option>
                      <option>Formal</option>
                      <option>Supportive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Response style
                    </label>
                    <select
                      value={prefs.ai_response_style}
                      onChange={(e) => update("ai_response_style", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option>Balanced</option>
                      <option>Direct</option>
                      <option>Detailed</option>
                      <option>Concise</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* School context */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                  School Context
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    About your school
                  </label>
                  <textarea
                    value={prefs.ai_school_context}
                    onChange={(e) => update("ai_school_context", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    placeholder="e.g. Church of England primary, high EAL (85%), strong community links, recently converted academy"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    This context is shared with every AI analysis so it can tailor findings
                    to your school&apos;s actual circumstances.
                  </p>
                </div>
              </div>

              {/* Priorities */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                  Improvement Priorities
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    What should the AI focus on?
                  </label>
                  <textarea
                    value={prefs.ai_priorities}
                    onChange={(e) => update("ai_priorities", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    placeholder="e.g. Closing the writing gap, improving phonics outcomes, SEND provision"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    The AI will flag connections to these priorities when analysing data.
                  </p>
                </div>
              </div>

              {/* Preferred terminology */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  Preferred Terminology
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Map standard terms to the ones your school uses. The AI will use your
                  preferred language in all outputs.
                </p>
                <TerminologyEditor
                  value={prefs.ai_preferred_terminology}
                  onChange={(val) => update("ai_preferred_terminology", val)}
                />
              </div>

              {/* Temperature */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                  Output Variation
                </h3>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Response consistency
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 shrink-0">More consistent</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min={-20}
                      max={20}
                      step={5}
                      value={Math.round(prefs.ai_temperature_offset * 100)}
                      onChange={(e) =>
                        update("ai_temperature_offset", parseInt(e.target.value) / 100)
                      }
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>-0.2</span>
                      <span className="font-medium text-gray-700">
                        {prefs.ai_temperature_offset > 0
                          ? `+${prefs.ai_temperature_offset.toFixed(2)}`
                          : prefs.ai_temperature_offset.toFixed(2)}
                      </span>
                      <span>+0.2</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">More varied</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Adjust how creative vs predictable AI responses are. Most schools leave
                  this at 0.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
