"use client";

/**
 * New Asset Page
 * Uses AssetForm shared component.
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { AssetForm } from "@/components/estates-compliance/AssetForm";

export default function NewAssetPage() {
  const router = useRouter();
  const { organizationId } = useAuth();

  const handleSuccess = (assetId: string) => {
    router.push(`/estates-compliance/assets/${assetId}`);
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Breadcrumb */}
      <Link
        href="/estates-compliance/assets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Asset Register
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Asset</h1>
          <p className="text-sm text-muted-foreground">
            Register a new asset in the compliance system
          </p>
        </div>
      </div>

      <AssetForm
        mode="create"
        organizationId={organizationId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
