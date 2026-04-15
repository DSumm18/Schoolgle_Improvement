"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Briefcase } from "lucide-react";
import { UrlInput } from "@/components/deal-finder/UrlInput";
import { ComparisonResults } from "@/components/deal-finder/ComparisonResults";
import { LoadingSteps } from "@/components/deal-finder/LoadingSteps";
import type { ScrapeResponse } from "@/lib/deal-finder/types";

export default function DealFinderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stepInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (stepInterval.current) clearInterval(stepInterval.current);
    };
  }, []);

  const handleSubmit = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    // Animate loading steps
    stepInterval.current = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 3));
    }, 1500);

    try {
      const res = await fetch("/api/tools/deal-finder/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data: ScrapeResponse = await res.json();
      setResult(data);

      if (data.status === "failed" && data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare prices");
    } finally {
      setIsLoading(false);
      if (stepInterval.current) {
        clearInterval(stepInterval.current);
        stepInterval.current = null;
      }
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-cyan-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">DealFind</h1>
        </div>
        <p className="text-gray-500 max-w-xl mx-auto">
          Paste a product URL and instantly find cheaper alternatives across 20+ education suppliers.
          Every comparison is logged as procurement compliance evidence.
        </p>
      </div>

      {/* URL Input */}
      <UrlInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        size="large"
        className="mb-8"
      />

      {/* Loading State */}
      {isLoading && <LoadingSteps currentStep={loadingStep} />}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm font-medium mb-1">
            Something went wrong
          </p>
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-red-400 text-xs mt-2">
            Tip: Try removing tracking parameters from the URL (everything after the &quot;?&quot;) or paste a URL from a different supplier.
          </p>
        </div>
      )}

      {/* Results */}
      {result && result.status === "complete" && !isLoading && (
        <ComparisonResults data={result} />
      )}
    </div>
  );
}
