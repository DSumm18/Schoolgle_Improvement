"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  Eye,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Package,
} from "lucide-react";
import type {
  VisionAnalysisResult,
  VisionAnalysisItem,
} from "@/lib/vision/analyse";

const CONTEXTS = [
  "General",
  "Chemical Store",
  "Playground",
  "Plant Room",
  "Classroom",
] as const;

type ContextType = (typeof CONTEXTS)[number];

// Category colour mapping
const CATEGORY_COLOURS: Record<string, string> = {
  chemical: "bg-red-500/20 text-red-300 border-red-500/30",
  equipment: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  furniture: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  safety: "bg-green-500/20 text-green-300 border-green-500/30",
  electrical: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  cleaning: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  stationery: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

// Condition badge styling
const CONDITION_COLOURS: Record<string, string> = {
  good: "bg-green-600/30 text-green-300",
  fair: "bg-amber-600/30 text-amber-300",
  poor: "bg-orange-600/30 text-orange-300",
  hazard: "bg-red-600/30 text-red-300",
};

export default function VisionTestPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [context, setContext] = useState<ContextType>("General");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20MB.");
      return;
    }

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyse = async () => {
    if (!imageBase64) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/vision/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, context }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20">
            <Eye className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Vision Analysis Test</h1>
            <p className="text-gray-400 text-sm">
              Gemini 2.5 Flash — Visual Auditing for Estates & COSHH
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Upload & Controls */}
          <div className="space-y-4">
            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 hover:border-indigo-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Uploaded preview"
                  className="max-h-80 mx-auto rounded-lg object-contain"
                />
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 mx-auto text-gray-500" />
                  <p className="text-gray-400">
                    Click to upload or drag an image
                  </p>
                  <p className="text-gray-600 text-sm">
                    JPG, PNG, WebP up to 20MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Context selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Scan Context
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value as ContextType)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {CONTEXTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Analyse button */}
            <button
              onClick={handleAnalyse}
              disabled={!imageBase64 || loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analysing with Gemini 2.5 Flash...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Analyse Image
                </>
              )}
            </button>

            {/* Error display */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            {result ? (
              <>
                {/* Summary card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-400" />
                    Analysis Summary
                  </h2>
                  <p className="text-gray-300 text-sm">{result.summary}</p>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">
                        {result.total_items} items found
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle
                        className={`w-4 h-4 ${result.compliance_flags > 0 ? "text-red-400" : "text-green-400"}`}
                      />
                      <span
                        className={
                          result.compliance_flags > 0
                            ? "text-red-300"
                            : "text-gray-300"
                        }
                      >
                        {result.compliance_flags} compliance flag
                        {result.compliance_flags !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {result.items.map((item, idx) => (
                    <ItemCard key={idx} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
                <Eye className="w-16 h-16 mx-auto text-gray-700 mb-4" />
                <p className="text-gray-500">
                  Upload an image and click Analyse to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: VisionAnalysisItem }) {
  const catClass =
    CATEGORY_COLOURS[item.category] || CATEGORY_COLOURS.other;
  const hasIssues =
    item.compliance_concerns && item.compliance_concerns.length > 0;

  return (
    <div
      className={`bg-gray-900 border rounded-lg p-3 space-y-2 ${hasIssues ? "border-red-700/50" : "border-gray-800"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{item.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${catClass}`}
            >
              {item.category}
            </span>
            {item.condition && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${CONDITION_COLOURS[item.condition] || ""}`}
              >
                {item.condition}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {item.location_description}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-sm text-gray-400">×{item.quantity}</span>
          <div className="text-xs text-gray-600">
            {Math.round(item.confidence * 100)}%
          </div>
        </div>
      </div>

      {hasIssues && (
        <div className="bg-red-950/30 rounded-md p-2 space-y-1">
          {item.compliance_concerns!.map((concern, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-xs text-red-300"
            >
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>{concern}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
