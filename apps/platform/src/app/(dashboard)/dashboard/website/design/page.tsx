"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Palette,
  ArrowLeft,
  Loader2,
  Check,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { SetupWizard } from "@/components/website-builder";
import type { HeroMaskId, PaletteOption } from "@/lib/website-builder/types";
import { getAllPresets } from "@/lib/website-builder/presets";
const STYLE_PRESETS = getAllPresets();
import { FONT_PAIRINGS } from "@/lib/website-builder/font-pairings";

export default function WebsiteDesignPage() {
  const { organization, organizationId } = useAuth();
  const [website, setWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const schoolName = organization?.name || "My School";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/website");
        if (res.ok) {
          const data = await res.json();
          setWebsite(data);
        }
      } catch (err) {
        console.error("Failed to load website:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleWizardComplete = async (config: {
    logoUrl: string | null;
    palette: PaletteOption["palette"];
    presetId: string;
    fontPairingId: string;
    heroMaskId: HeroMaskId;
    heroImageUrl: string | null;
    motto: string;
  }) => {
    setSaving(true);
    try {
      const method = website ? "PATCH" : "POST";
      const res = await fetch("/api/website", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          schoolPhase: "primary",
          ...config,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWebsite(data);
        setShowWizard(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (showWizard) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <SetupWizard
          schoolName={schoolName}
          schoolPhase="primary"
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  const preset = website?.preset_id
    ? STYLE_PRESETS.find((p) => p.id === website.preset_id)
    : null;
  const font = website?.font_pairing_id
    ? FONT_PAIRINGS.find((f) => f.id === website.font_pairing_id)
    : null;

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/website"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center">
            <Palette className="w-5 h-5 text-fuchsia-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Design Studio</h1>
            <p className="text-sm text-gray-500">
              Customise colours, fonts, and layout
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="px-4 py-2.5 bg-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-700 flex items-center gap-2 font-medium transition-colors"
        >
          <Palette className="w-4 h-4" />{" "}
          {website ? "Redesign" : "Start Design Wizard"}
        </button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm">
          <Check className="w-4 h-4" /> Design saved successfully
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" />
        </div>
      ) : !website ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-fuchsia-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Design Set Up Yet</h3>
          <p className="text-gray-500 mb-4">
            Run the design wizard to extract colours from your logo, pick a
            style preset, and choose fonts.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="px-6 py-2.5 bg-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-700 font-medium transition-colors"
          >
            Start Design Wizard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current preset */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Current Style</h3>
            {preset ? (
              <div className="space-y-2">
                <div className="text-lg font-bold">{preset.name}</div>
                <p className="text-sm text-gray-500">{preset.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {preset.layout.heroStyle}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {preset.shape.corners}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {preset.motion.level}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Preset: {website.preset_id}
              </p>
            )}
          </div>

          {/* Typography */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Typography</h3>
            {font ? (
              <div className="space-y-2">
                <div className="text-lg font-bold">{font.name}</div>
                <p className="text-sm text-gray-500">
                  Heading: {font.heading.family} &middot; Body:{" "}
                  {font.body.family}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Font: {website.font_pairing_id}
              </p>
            )}
          </div>

          {/* Palette preview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:col-span-2">
            <h3 className="font-semibold mb-3">Colour Palette</h3>
            {website.palette ? (
              <div className="flex gap-2 flex-wrap">
                {Object.entries(website.palette as Record<string, any>).map(
                  ([key, value]: [string, any]) => {
                    if (typeof value !== "object" || !value?.["500"]) return null;
                    return (
                      <div key={key} className="text-center">
                        <div
                          className="w-16 h-16 rounded-xl border"
                          style={{ backgroundColor: value["500"] }}
                        />
                        <span className="text-xs text-gray-500 mt-1 block">
                          {key}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No palette configured</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
