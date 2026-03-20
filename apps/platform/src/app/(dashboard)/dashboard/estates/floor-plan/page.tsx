"use client";

/**
 * Floor Plan Page — Redirects to Show Me Site
 *
 * The interactive floor plan with overlays (tickets, compliance, evacuation,
 * COSHH, induction) is now part of Show Me Site.
 *
 * The FloorPlanViewer component (components/floor-plan/FloorPlanViewer.tsx)
 * remains available for future use if schools need to upload custom floor plans.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FloorPlanPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after a brief pause
    const timer = setTimeout(() => {
      router.push("/dashboard/show-me/site");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
      <Building2 className="w-12 h-12 text-teal-500 mb-4" />
      <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
        Floor Plan has moved to Show Me: Site
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md">
        The interactive floor plan with compliance overlays, evacuation routes,
        COSHH, and induction mode is now part of Show Me Site.
      </p>
      <p className="text-xs text-zinc-400 mt-2">Redirecting automatically...</p>
      <Link
        href="/dashboard/show-me/site"
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
      >
        Go to Show Me: Site
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
