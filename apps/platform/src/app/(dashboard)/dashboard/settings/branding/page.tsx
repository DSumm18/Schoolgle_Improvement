"use client";

import { useAuth } from "@/context/SupabaseAuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { getSessionToken } from "@/lib/supabase";
import {
  ArrowLeft,
  Palette,
  Upload,
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
  Type,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  extractColorsFromImage,
  getContrastColor,
} from "@/lib/color-extractor";

interface BrandingSettings {
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  footer_text?: string;
}

/** Curated Google Fonts suitable for school documents and dashboards */
const FONT_OPTIONS = [
  {
    value: "",
    label: "System Default",
    preview: "ui-sans-serif, system-ui, sans-serif",
    category: "default",
  },
  {
    value: "Inter",
    label: "Inter",
    preview: "'Inter', sans-serif",
    category: "modern",
  },
  {
    value: "Open Sans",
    label: "Open Sans",
    preview: "'Open Sans', sans-serif",
    category: "modern",
  },
  {
    value: "Roboto",
    label: "Roboto",
    preview: "'Roboto', sans-serif",
    category: "modern",
  },
  {
    value: "Lato",
    label: "Lato",
    preview: "'Lato', sans-serif",
    category: "modern",
  },
  {
    value: "Poppins",
    label: "Poppins",
    preview: "'Poppins', sans-serif",
    category: "modern",
  },
  {
    value: "Nunito",
    label: "Nunito",
    preview: "'Nunito', sans-serif",
    category: "friendly",
  },
  {
    value: "Quicksand",
    label: "Quicksand",
    preview: "'Quicksand', sans-serif",
    category: "friendly",
  },
  {
    value: "Mulish",
    label: "Mulish",
    preview: "'Mulish', sans-serif",
    category: "friendly",
  },
  {
    value: "Source Sans 3",
    label: "Source Sans 3",
    preview: "'Source Sans 3', sans-serif",
    category: "professional",
  },
  {
    value: "Merriweather Sans",
    label: "Merriweather Sans",
    preview: "'Merriweather Sans', sans-serif",
    category: "professional",
  },
  {
    value: "Libre Franklin",
    label: "Libre Franklin",
    preview: "'Libre Franklin', sans-serif",
    category: "professional",
  },
  {
    value: "Playfair Display",
    label: "Playfair Display",
    preview: "'Playfair Display', serif",
    category: "traditional",
  },
  {
    value: "Merriweather",
    label: "Merriweather",
    preview: "'Merriweather', serif",
    category: "traditional",
  },
  {
    value: "Lora",
    label: "Lora",
    preview: "'Lora', serif",
    category: "traditional",
  },
  {
    value: "Crimson Text",
    label: "Crimson Text",
    preview: "'Crimson Text', serif",
    category: "traditional",
  },
  {
    value: "Lexend",
    label: "Lexend",
    preview: "'Lexend', sans-serif",
    category: "accessibility",
  },
  {
    value: "Atkinson Hyperlegible",
    label: "Atkinson Hyperlegible",
    preview: "'Atkinson Hyperlegible', sans-serif",
    category: "accessibility",
  },
] as const;

const FONT_CATEGORIES: Record<string, string> = {
  default: "Default",
  modern: "Modern & Clean",
  friendly: "Friendly & Rounded",
  professional: "Professional",
  traditional: "Traditional & Serif",
  accessibility: "Accessibility-Focused",
};

export default function BrandingSettingsPage() {
  const {
    user,
    organization,
    organizationId,
    loading: authLoading,
  } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BrandingSettings>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extractedColors, setExtractedColors] = useState<
    { hex: string; percentage: number }[]
  >([]);
  const [extractingColors, setExtractingColors] = useState(false);
  const { data, isLoading, mutate } = useSWR(
    user && organizationId
      ? `/api/settings/branding?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  // Populate form when data loads
  useEffect(() => {
    if (data?.settings) {
      setForm({
        address: data.settings.address || "",
        phone: data.settings.phone || "",
        email: data.settings.email || "",
        website: data.settings.website || "",
        primary_color: data.settings.primary_color || "#1e40af",
        secondary_color: data.settings.secondary_color || "",
        accent_color: data.settings.accent_color || "",
        font_family: data.settings.font_family || "",
        footer_text: data.settings.footer_text || "",
        logo_url: data.settings.logo_url || "",
      });
      // Extract colors from existing logo
      if (data.settings.logo_url) {
        extractColorsFromLogo(data.settings.logo_url);
      }
    }
  }, [data]);

  const extractColorsFromLogo = async (url: string, autoAssign = false) => {
    setExtractingColors(true);
    try {
      const colors = await extractColorsFromImage(url);
      setExtractedColors(colors);
      // Auto-assign first 3 extracted colors to empty color fields
      if (autoAssign && colors.length > 0) {
        setForm((prev) => {
          const updated = { ...prev };
          if (!updated.primary_color && colors[0]) {
            updated.primary_color = colors[0].hex;
          }
          if (!updated.secondary_color && colors[1]) {
            updated.secondary_color = colors[1].hex;
          }
          if (!updated.accent_color && colors[2]) {
            updated.accent_color = colors[2].hex;
          }
          return updated;
        });
        setSaved(false);
      }
    } catch (err) {
      console.warn("Could not extract colors from logo:", err);
      setExtractedColors([]);
    } finally {
      setExtractingColors(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleChange = (field: keyof BrandingSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await getSessionToken();
      const res = await fetch(
        `/api/settings/branding?organizationId=${organizationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ ...form, organizationId }),
        },
      );

      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        throw new Error(info.error || "Failed to save");
      }

      await mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PNG, JPG, and SVG files are allowed.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("File must be under 2MB.");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const token = await getSessionToken();
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          `/api/settings/branding/logo?organizationId=${organizationId}`,
          {
            method: "POST",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
          },
        );

        if (!res.ok) {
          const info = await res.json().catch(() => ({}));
          throw new Error(info.error || "Failed to upload logo");
        }

        const result = await res.json();
        const logoUrl = result.logo_url;
        setForm((prev) => ({ ...prev, logo_url: logoUrl }));
        await mutate();

        // Auto-extract colors from uploaded logo and assign to empty fields
        if (logoUrl) {
          await extractColorsFromLogo(logoUrl, true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    },
    [mutate],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const schoolName = data?.school_name || organization?.name || "Your School";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/settings")}
          className="mb-4 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Settings
        </Button>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6" />
            School Branding
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure your school&apos;s logo, colours, and contact details.
            These appear on generated documents, policies, and letters.
          </p>
        </motion.div>
      </div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Logo upload */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Logo preview */}
              <div
                className={`relative w-28 h-28 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-colors cursor-pointer group ${
                  dragOver
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {form.logo_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logo_url}
                      alt="School logo"
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        Change
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          No logo
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Upload instructions */}
              <div className="space-y-2 flex-1">
                <p className="text-sm text-muted-foreground">
                  Drag and drop your school logo, or click to browse. PNG, JPG,
                  or SVG up to 2MB.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-1" />
                      Upload Logo
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    // Reset so same file can be re-selected
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact details */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* School name (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-sm">School Name</Label>
              <Input
                value={schoolName}
                disabled
                className="bg-slate-50 dark:bg-slate-900"
              />
              <p className="text-xs text-muted-foreground">
                To change your school name, contact support.
              </p>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm">
                Address
              </Label>
              <Textarea
                id="address"
                placeholder="123 School Lane&#10;Town&#10;County&#10;AB1 2CD"
                rows={3}
                value={form.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            {/* Phone + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01onal 123456"
                  value={form.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="office@school.sch.uk"
                  value={form.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-sm">
                Website URL
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.school.sch.uk"
                value={form.website || ""}
                onChange={(e) => handleChange("website", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Extracted palette from logo */}
            {extractedColors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Colours from Your Logo</Label>
                <p className="text-xs text-muted-foreground">
                  Click a colour to set it as primary, secondary, or accent.
                  These are used across documents, reports, and charts.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {extractedColors.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          // Smart assign: first click = primary, second = secondary, third = accent
                          if (
                            !form.primary_color ||
                            form.primary_color === "#1e40af"
                          ) {
                            handleChange("primary_color", c.hex);
                          } else if (!form.secondary_color) {
                            handleChange("secondary_color", c.hex);
                          } else if (!form.accent_color) {
                            handleChange("accent_color", c.hex);
                          } else {
                            handleChange("primary_color", c.hex);
                          }
                        }}
                        className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                          c.hex === form.primary_color
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : c.hex === form.secondary_color
                              ? "border-purple-500 ring-2 ring-purple-200"
                              : c.hex === form.accent_color
                                ? "border-amber-500 ring-2 ring-amber-200"
                                : "border-slate-200 dark:border-slate-700"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={`${c.hex} (${Math.round(c.percentage)}%)`}
                      >
                        <span
                          className="text-[7px] font-bold"
                          style={{ color: getContrastColor(c.hex) }}
                        >
                          {c.hex === form.primary_color
                            ? "P"
                            : c.hex === form.secondary_color
                              ? "S"
                              : c.hex === form.accent_color
                                ? "A"
                                : ""}
                        </span>
                      </button>
                      <span className="text-[8px] text-muted-foreground font-mono">
                        {c.hex}
                      </span>
                    </div>
                  ))}
                  {extractingColors && (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            )}

            {/* Colour assignments */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Primary */}
              <div className="space-y-1.5">
                <Label className="text-sm">Primary</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color || "#1e40af"}
                    onChange={(e) =>
                      handleChange("primary_color", e.target.value)
                    }
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <Input
                    value={form.primary_color || "#1e40af"}
                    onChange={(e) =>
                      handleChange("primary_color", e.target.value)
                    }
                    placeholder="#1e40af"
                    className="font-mono text-xs flex-1"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Headings, borders, document accents
                </p>
              </div>
              {/* Secondary */}
              <div className="space-y-1.5">
                <Label className="text-sm">Secondary</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={
                      form.secondary_color || form.primary_color || "#1e40af"
                    }
                    onChange={(e) =>
                      handleChange("secondary_color", e.target.value)
                    }
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <Input
                    value={form.secondary_color || ""}
                    onChange={(e) =>
                      handleChange("secondary_color", e.target.value)
                    }
                    placeholder="Auto"
                    className="font-mono text-xs flex-1"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Charts, graphs, reports
                </p>
              </div>
              {/* Accent */}
              <div className="space-y-1.5">
                <Label className="text-sm">Accent</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accent_color || form.primary_color || "#1e40af"}
                    onChange={(e) =>
                      handleChange("accent_color", e.target.value)
                    }
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <Input
                    value={form.accent_color || ""}
                    onChange={(e) =>
                      handleChange("accent_color", e.target.value)
                    }
                    placeholder="Auto"
                    className="font-mono text-xs flex-1"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Highlights, badges, calls to action
                </p>
              </div>
            </div>

            {/* Colour preview bar */}
            <div className="space-y-1.5">
              <Label className="text-sm">Preview</Label>
              <div className="flex h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div
                  className="flex-1"
                  style={{ backgroundColor: form.primary_color || "#1e40af" }}
                />
                <div
                  className="flex-1"
                  style={{
                    backgroundColor:
                      form.secondary_color || form.primary_color || "#1e40af",
                    opacity: 0.75,
                  }}
                />
                <div
                  className="flex-1"
                  style={{
                    backgroundColor:
                      form.accent_color || form.primary_color || "#1e40af",
                    opacity: 0.5,
                  }}
                />
              </div>
            </div>

            {/* Font picker */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  School Font
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applied across the dashboard, documents, reports, and letters.
                </p>
              </div>
              {/* Load ALL Google Fonts so previews render in the correct typeface */}
              {/* eslint-disable-next-line @next/next/no-page-custom-font */}
              <link
                rel="stylesheet"
                href={`https://fonts.googleapis.com/css2?${FONT_OPTIONS.filter(
                  (f) => f.value,
                )
                  .map(
                    (f) =>
                      `family=${encodeURIComponent(f.value)}:wght@400;600;700`,
                  )
                  .join("&")}&display=swap`}
              />
              <div className="grid grid-cols-1 gap-1.5 max-h-[280px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                {Object.entries(FONT_CATEGORIES).map(([catKey, catLabel]) => {
                  const fonts = FONT_OPTIONS.filter(
                    (f) => f.category === catKey,
                  );
                  if (fonts.length === 0) return null;
                  return (
                    <div key={catKey}>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 pt-1.5 pb-0.5">
                        {catLabel}
                      </p>
                      {fonts.map((font) => (
                        <button
                          key={font.value}
                          type="button"
                          onClick={() =>
                            handleChange("font_family", font.value)
                          }
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            (form.font_family || "") === font.value
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground"
                          }`}
                          style={{
                            fontFamily: font.value
                              ? font.preview
                              : "ui-sans-serif, system-ui, sans-serif",
                          }}
                        >
                          <span className="text-sm">{font.label}</span>
                          <span
                            className="block text-xs text-muted-foreground mt-0.5"
                            style={{
                              fontFamily: font.value
                                ? font.preview
                                : "ui-sans-serif, system-ui, sans-serif",
                            }}
                          >
                            The quick brown fox jumps over the lazy dog
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
              {form.font_family && (
                <div
                  className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-1"
                  style={{
                    fontFamily: FONT_OPTIONS.find(
                      (f) => f.value === form.font_family,
                    )?.preview,
                  }}
                >
                  <p className="text-sm font-bold">
                    {schoolName} &mdash; {form.font_family}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This is how body text will appear across your documents,
                    reports, and dashboard.
                  </p>
                  <p className="text-base font-semibold mt-2">
                    Heading Example
                  </p>
                  <p className="text-sm">
                    Regular paragraph text showing how content will read in
                    letters, policies, and generated materials.
                  </p>
                </div>
              )}
            </div>

            {/* Footer text */}
            <div className="space-y-1.5">
              <Label htmlFor="footer_text" className="text-sm">
                Document Footer Text
              </Label>
              <Input
                id="footer_text"
                placeholder={schoolName}
                value={form.footer_text || ""}
                onChange={(e) => handleChange("footer_text", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Appears at the bottom of generated letters and policies.
                Defaults to your school name if left blank.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex items-center gap-3"
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Saved
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-green-600"
          >
            Branding updated successfully
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
