"use client";

import useSWR from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";

const DEFAULT_PRIMARY = "#0ea5e9";
const DEFAULT_SECONDARY = "#1e40af";
const DEFAULT_ACCENT = "#f59e0b";

export interface SchoolBranding {
  primary: string;
  secondary: string;
  accent: string;
  /** School's chosen font family name (Google Font), or empty for system default */
  fontFamily: string;
  /** Ordered palette for charts: primary, secondary, accent, then generated variants */
  chartPalette: string[];
}

/**
 * Hook to access the current school's brand colors and font.
 * Falls back to Schoolgle defaults if no branding is set.
 */
export function useSchoolColors(): SchoolBranding {
  const { user, organizationId } = useAuth();
  const brandingUrl = organizationId
    ? `/api/settings/branding?organizationId=${organizationId}`
    : null;
  const { data } = useSWR(user && brandingUrl ? brandingUrl : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const primary = data?.settings?.primary_color || DEFAULT_PRIMARY;
  const secondary = data?.settings?.secondary_color || DEFAULT_SECONDARY;
  const accent = data?.settings?.accent_color || DEFAULT_ACCENT;
  const fontFamily = data?.settings?.font_family || "";

  // Build a chart palette with enough distinct colors
  const chartPalette = [
    primary,
    secondary,
    accent,
    "#10b981", // emerald
    "#8b5cf6", // violet
    "#f43f5e", // rose
    "#06b6d4", // cyan
    "#f97316", // orange
  ];

  return { primary, secondary, accent, fontFamily, chartPalette };
}
