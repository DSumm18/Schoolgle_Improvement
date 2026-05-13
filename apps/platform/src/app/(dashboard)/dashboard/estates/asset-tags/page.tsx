"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, QrCode, Smartphone } from "lucide-react";
import QRCodeGenerator from "@/components/estates/QRCodeGenerator";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { mapAssetsToTagAssets, type TagAsset } from "@/lib/estates/asset-tags";
import type { Asset as EstatesAsset } from "@/types/estates-compliance";

interface AssetsResponse {
  assets?: EstatesAsset[];
  data?: EstatesAsset[];
}

export default function AssetTagsPage() {
  const { organizationId, loading: authLoading } = useAuth();
  const [assets, setAssets] = useState<TagAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function fetchAssets() {
      if (!organizationId) {
        setAssets([]);
        setError("Select a school or trust before generating asset tags.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          organizationId,
          page_size: "200",
        });
        const data = (await fetcher(
          `/api/estates/assets?${params.toString()}`,
        )) as AssetsResponse;
        setAssets(mapAssetsToTagAssets(data.assets ?? data.data ?? []));
      } catch (err) {
        setAssets([]);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the asset register.",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, [authLoading, organizationId]);

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Asset Tags</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Print QR/NFC asset tags to stick on physical assets. Scanning
              links directly to the asset&apos;s compliance history.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Asset register unavailable
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && assets.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
          <QrCode className="mx-auto h-10 w-10 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold dark:text-white">
            No assets ready for tags yet
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Add boilers, fire equipment, water systems, electrical panels, and
            other estate assets to the live asset register first. Asset tags
            will then generate directly from those records.
          </p>
          <Link
            href="/estates-compliance/assets"
            className="mt-5 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Open Asset Register
          </Link>
        </div>
      )}

      {!loading && !error && assets.length > 0 && (
        <div className="rounded-lg border border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-900/20 p-4">
          <div className="flex items-start gap-3">
            <QrCode className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-teal-800 dark:text-teal-200">
              Showing {assets.length} live asset
              {assets.length === 1 ? "" : "s"} from the school asset register.
              No demo data is being used.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : assets.length > 0 ? (
        <QRCodeGenerator assets={assets} />
      ) : null}

      {/* NFC section */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-medium dark:text-white">NFC Tags</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For NFC, programme tags with the same URL using any NFC writer app
              (e.g. NFC Tools on iOS/Android). Write the URL{" "}
              <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                https://app.schoolgle.co.uk/scan/&#123;assetId&#125;
              </code>{" "}
              to each tag. Staff can then tap their phone on the tag to
              instantly view the asset&apos;s compliance record, log checks, and
              raise issues.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Recommended NFC tags: NTAG215 or NTAG216 (waterproof adhesive
              versions work best for plant rooms and outdoor equipment).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
