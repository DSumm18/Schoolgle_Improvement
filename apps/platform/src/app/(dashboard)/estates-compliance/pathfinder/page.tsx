"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AuthContext } from "@/context/SupabaseAuthContext";
import PathfinderSourceIntake, {
  type PathfinderSourceIntakeResult,
} from "@/components/pathfinder/PathfinderSourceIntake";
import type { PathfinderExtractionResult } from "@/lib/pathfinder/prototype";

const PathfinderPrototype = dynamic(
  () => import("@/components/pathfinder-prototype/PathfinderPrototype"),
  { ssr: false, loading: () => <LoadingBlock label="Loading Pathfinder..." /> },
);

interface PathfinderModelRow {
  id: string;
  name: string;
  status: string;
  is_live: boolean;
  parent_model_id: string | null;
  revision_number: number | null;
  source_document_name: string | null;
  extraction_result: PathfinderExtractionResult;
  updated_at: string | null;
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#f4f6f5] text-sm text-slate-500">
      {label}
    </div>
  );
}

export default function EstatesPathfinderPage() {
  const auth = useContext(AuthContext);
  const accessToken = auth?.session?.access_token;
  const organizationId = auth?.organizationId ?? null;
  const searchParams = useSearchParams();
  const placeAssetId = searchParams?.get("placeAsset") ?? null;

  const [liveModel, setLiveModel] = useState<PathfinderModelRow | null>(null);
  const [activeModel, setActiveModel] = useState<PathfinderModelRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIntake, setShowIntake] = useState(false);
  const [intakeParentId, setIntakeParentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLiveModel = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/estates/pathfinder/model?live=true", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(`Failed to load live model (HTTP ${response.status})`);
      const result = (await response.json()) as { model: PathfinderModelRow | null };
      setLiveModel(result.model);
      setActiveModel(result.model);
      setShowIntake(!result.model);
    } catch (err) {
      console.error("Live model fetch failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Could not load your Pathfinder model.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) void fetchLiveModel();
  }, [accessToken, fetchLiveModel]);

  const handleIntakeComplete = useCallback(
    (result: PathfinderSourceIntakeResult) => {
      const nextModel = result.model as PathfinderModelRow;
      setActiveModel(nextModel);
      setShowIntake(false);
      setIntakeParentId(null);
    },
    [],
  );

  const startRevision = useCallback(() => {
    setIntakeParentId(liveModel?.id ?? null);
    setShowIntake(true);
  }, [liveModel?.id]);

  if (!organizationId) {
    return (
      <LoadingBlock label="Sign in to a school to view Pathfinder." />
    );
  }

  if (isLoading) {
    return <LoadingBlock label="Loading your Pathfinder site plan..." />;
  }

  if (errorMessage) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <p className="font-semibold">Pathfinder failed to load.</p>
          <p className="mt-1">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void fetchLiveModel()}
            className="mt-3 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // No live model, and intake not explicitly opened → show intake as first-run experience.
  if (!liveModel && !activeModel) {
    return (
      <div className="bg-[#f4f6f5] p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold text-slate-900">Set up your site plan</h1>
          <p className="mt-2 text-sm text-slate-600">
            Upload a site plan PDF once. Pathfinder builds a clean, editable site plan that links
            your Asset Register, helpdesk tickets, QR scans, and fire routes. The PDF is only used
            as a reference during setup — your staff will only see the clean Pathfinder model.
          </p>
          <div className="mt-6">
            <PathfinderSourceIntake onIntakeComplete={handleIntakeComplete} />
          </div>
        </div>
      </div>
    );
  }

  // Revision intake — show intake card above the live model (live model stays visible).
  if (showIntake && intakeParentId) {
    return (
      <div className="bg-[#f4f6f5]">
        <div className="border-b border-slate-200 bg-white p-6">
          <div className="mx-auto max-w-3xl">
            <PathfinderSourceIntake
              parentModelId={intakeParentId}
              onIntakeComplete={handleIntakeComplete}
              onCancel={() => {
                setShowIntake(false);
                setIntakeParentId(null);
              }}
            />
          </div>
        </div>
        {activeModel ? (
          <PathfinderPrototype
            estatesMode
            initialModel={activeModel.extraction_result}
            initialModelId={activeModel.id}
            parentModelId={activeModel.parent_model_id}
            onUploadNewPlan={startRevision}
          />
        ) : null}
      </div>
    );
  }

  // Standard view: live model hydrated into the Pathfinder canvas.
  if (activeModel) {
    return (
      <div className="bg-[#f4f6f5]">
        {placeAssetId ? (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
            <span className="font-semibold">Place asset {placeAssetId}:</span> select it under
            the Assets tab below, nudge it onto the right room, then tap
            “Save pin to Asset Register”.
          </div>
        ) : null}
        <PathfinderPrototype
          estatesMode
          initialModel={activeModel.extraction_result}
          initialModelId={activeModel.id}
          parentModelId={activeModel.parent_model_id}
          onUploadNewPlan={startRevision}
        />
      </div>
    );
  }

  return <LoadingBlock label="Preparing Pathfinder..." />;
}
