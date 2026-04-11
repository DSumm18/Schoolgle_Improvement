"use client";

/**
 * Edit Asset Page
 * Pre-fetches the asset and renders AssetForm in edit mode.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { AssetForm } from "@/components/estates-compliance/AssetForm";
import type { Asset } from "@/types/estates-compliance";

interface EditAssetPageProps {
  params: { id: string };
}

export default function EditAssetPage({ params }: EditAssetPageProps) {
  const router = useRouter();
  const { organizationId } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assetId = params.id;

  useEffect(() => {
    if (!organizationId || !assetId) return;

    const load = async () => {
      try {
        const res = await fetch(
          `/api/estates/assets/${assetId}?organizationId=${organizationId}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Asset not found");
        }
        const data = await res.json();
        setAsset(data.data ?? data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load asset");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [organizationId, assetId]);

  const handleSuccess = () => {
    router.push(`/estates-compliance/assets/${assetId}`);
  };

  if (!organizationId || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading asset...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-24">
        <Link
          href="/estates-compliance/assets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Asset Register
        </Link>
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            {error ?? "Asset not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/estates-compliance/assets" className="hover:text-foreground transition-colors">
          Asset Register
        </Link>
        <span>/</span>
        <Link
          href={`/estates-compliance/assets/${assetId}`}
          className="hover:text-foreground transition-colors"
        >
          {asset.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Edit</span>
      </div>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Asset</h1>
          <p className="text-sm text-muted-foreground">{asset.name}</p>
        </div>
      </div>

      <AssetForm
        mode="edit"
        initialValues={asset}
        assetId={assetId}
        organizationId={organizationId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
