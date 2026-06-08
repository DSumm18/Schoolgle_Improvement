"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  HeartHandshake,
  PoundSterling,
  ShieldCheck,
  ShoppingBasket,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { CategoryGrid } from "./CategoryGrid";
import { ComparisonResults } from "./ComparisonResults";
import { LoadingSteps } from "./LoadingSteps";
import { ShareDealModal } from "./ShareDealModal";
import { ThresholdDashboard } from "./ThresholdDashboard";
import { UrlInput } from "./UrlInput";
import type { ScrapeResponse } from "@/lib/deal-finder/types";

const proofPoints = [
  {
    label: "Free for schools",
    body: "Affiliate links never add cost to the school.",
    icon: PoundSterling,
  },
  {
    label: "Community powered",
    body: "Useful searches and shared deals help the next school.",
    icon: Users,
  },
  {
    label: "Value first",
    body: "Deals are ranked by value, match confidence and feedback.",
    icon: ShieldCheck,
  },
];

const procurementSteps = [
  "Paste a product link from Amazon, YPO, TTS, ESPO, KCS or another supplier.",
  "We read the product, pack size and price, then compare like-for-like where we can.",
  "If a cheaper supplier appears, we show the saving and make the next-step friction clear.",
];

const supplierLanes = [
  "Already use YPO, ESPO or KCS? Great — those routes should feel lowest friction.",
  "Need a new supplier? We flag it so the office knows there may be account setup work.",
  "Amazon links may support Schoolgle, but only when they are shown clearly as affiliate links.",
];

export function DealFinderApp() {
  const { organizationId, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const stepInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (stepInterval.current) clearInterval(stepInterval.current);
    };
  }, []);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
  }), [session?.access_token]);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    stepInterval.current = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 3));
    }, 1500);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    if (stepInterval.current) {
      clearInterval(stepInterval.current);
      stepInterval.current = null;
    }
  }, []);

  const handleSubmit = useCallback(async (url: string) => {
    startLoading();

    try {
      const scrapeUrl = organizationId
        ? `/api/tools/deal-finder/scrape?organizationId=${organizationId}`
        : "/api/tools/deal-finder/scrape";

      const res = await fetch(scrapeUrl, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "We couldn't check that product yet.");
        return;
      }

      setResult(data);

      if (data.status === "failed" && data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare prices");
    } finally {
      stopLoading();
    }
  }, [authHeaders, organizationId, startLoading, stopLoading]);

  const handleCategorySelect = useCallback(async (category: string) => {
    startLoading();

    try {
      const searchUrl = organizationId
        ? `/api/tools/deal-finder/search?organizationId=${organizationId}`
        : "/api/tools/deal-finder/search";

      const res = await fetch(searchUrl, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: category,
          category: category.toLowerCase(),
          source_url: `https://schoolgle.co.uk/category/${category.toLowerCase()}`,
          source_domain: "schoolgle.co.uk",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "We couldn't load that category yet.");
        return;
      }

      const alternatives = data.data?.alternatives || [];

      setResult({
        job_id: "cat-" + Date.now(),
        status: "complete",
        product: {
          id: "cat",
          name: `${category} ideas`,
          currency: "GBP",
          source_url: `https://schoolgle.co.uk/category/${category.toLowerCase()}`,
          pack_quantity: 1,
          pack_unit: "each",
          unit_weight_g: null,
          unit_price_each: null,
          comparison_unit_label: "each",
          rating_value: null,
          rating_count: null,
        },
        matches: alternatives.map((alt: any) => ({
          product_id: alt.id,
          product_name: alt.title,
          product_description: alt.description,
          supplier_id: alt.supplier,
          supplier_name: alt.supplier,
          price_gbp: alt.price,
          image_url: alt.image_url,
          source_url: alt.source_url,
          match_type: "brand_category",
          match_score: 100,
          saving_gbp: alt.saving,
          saving_pct: alt.saving_pct,
          pack_quantity: alt.pack_qty || 1,
          pack_unit: "each",
          unit_price_each: alt.unit_price,
          source_comparison_quantity: null,
          equivalent_quantity: null,
          equivalent_total_price: alt.price,
          unit_saving_gbp: alt.unit_saving,
          unit_saving_pct: alt.unit_saving_pct,
          equivalence_type: "alternative",
          value_score: 80,
          is_best_value: false,
          price_date: null,
          comparison_unit_label: "each",
          rating_value: null,
          rating_count: null,
        })),
        best_saving_gbp: null,
        best_saving_pct: null,
        best_unit_saving_gbp: null,
        best_unit_saving_pct: null,
        best_value_match_id: null,
        match_count: alternatives.length,
        duration_ms: 100,
        discovery_pending: alternatives.length === 0,
        retailer_search_links: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load category");
    } finally {
      stopLoading();
    }
  }, [authHeaders, organizationId, startLoading, stopLoading]);

  return (
    <div className="min-h-screen -m-6 rounded-tl-xl border-l border-t border-emerald-100 bg-[radial-gradient(circle_at_top_left,#e6fffb_0,#fff7ed_34%,#f8fafc_72%)] p-6 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-5 flex justify-end">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Share a Deal
          </button>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
          <div className="rounded-[2rem] border border-white bg-white/90 p-7 shadow-xl shadow-emerald-900/5 backdrop-blur">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              <ShoppingBasket className="h-3.5 w-3.5" />
              Schools helping schools buy smarter
            </div>
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
                <Briefcase className="h-7 w-7 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                  Find a better school deal in under a minute.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Paste a product link. Deal Finder checks the product, compares
                  trusted school suppliers and community-shared alternatives, then
                  shows the clearest next step for the office.
                </p>
              </div>
            </div>

            <UrlInput
              onSubmit={handleSubmit}
              isLoading={isLoading}
              size="large"
              className="mb-5"
            />

            <div className="grid gap-3 md:grid-cols-3">
              {proofPoints.map((point) => (
                <div
                  key={point.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <point.icon className="mb-3 h-5 w-5 text-emerald-700" />
                  <p className="text-sm font-bold text-slate-950">{point.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{point.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-950">
              <p className="font-bold">Transparent funding</p>
              <p className="mt-1 leading-6 text-blue-900/80">
                Deal Finder is free for schools. Some retailer links may be
                affiliate links, which means Schoolgle may earn a small
                commission if you buy through them. It does not cost your school
                anything extra, and it helps keep Deal Finder free.
              </p>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-xl shadow-emerald-900/5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <HeartHandshake className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  The buying club idea
                </p>
                <h2 className="text-xl font-bold text-slate-950">Every search makes it better.</h2>
              </div>
            </div>

            <div className="space-y-3">
              {procurementSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="mb-3 text-sm font-bold text-amber-950">
                Procurement reality check
              </p>
              <div className="space-y-2">
                {supplierLanes.map((lane) => (
                  <div key={lane} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
                    <p className="text-xs leading-5 text-amber-900/80">{lane}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <div className="mt-8">
          <ThresholdDashboard organizationId={organizationId || undefined} />
        </div>

        {isLoading && (
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <LoadingSteps currentStep={loadingStep} />
          </div>
        )}

        {error && !isLoading && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="mb-1 text-sm font-bold text-red-800">
              We couldn&apos;t verify that product
            </p>
            <p className="text-sm text-red-700">{error}</p>
            <p className="mt-2 text-xs text-red-600">
              We will not show made-up supplier results. Try the full product
              page URL, remove tracking parameters, or paste a different supplier
              link.
            </p>
          </div>
        )}

        {!result && !isLoading && !error && (
          <CategoryGrid onCategorySelect={handleCategorySelect} />
        )}

        {result && result.status === "complete" && !isLoading && (
          <div className="mt-8">
            <ComparisonResults data={result} organizationId={organizationId || undefined} />
          </div>
        )}

        <ShareDealModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          organizationId={organizationId || undefined}
        />
      </div>
    </div>
  );
}
