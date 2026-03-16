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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

interface BrandingSettings {
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  primary_color?: string;
  footer_text?: string;
}

export default function BrandingSettingsPage() {
  const { user, organization, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BrandingSettings>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    user ? "/api/settings/branding" : null,
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
        footer_text: data.settings.footer_text || "",
        logo_url: data.settings.logo_url || "",
      });
    }
  }, [data]);

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
      const res = await fetch("/api/settings/branding", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

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

        const res = await fetch("/api/settings/branding/logo", {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!res.ok) {
          const info = await res.json().catch(() => ({}));
          throw new Error(info.error || "Failed to upload logo");
        }

        const result = await res.json();
        setForm((prev) => ({ ...prev, logo_url: result.logo_url }));
        await mutate();
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
          <CardContent className="space-y-4">
            {/* Primary colour */}
            <div className="space-y-1.5">
              <Label className="text-sm">Primary Brand Colour</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color || "#1e40af"}
                  onChange={(e) =>
                    handleChange("primary_color", e.target.value)
                  }
                  className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                />
                <Input
                  value={form.primary_color || "#1e40af"}
                  onChange={(e) =>
                    handleChange("primary_color", e.target.value)
                  }
                  placeholder="#1e40af"
                  className="w-32 font-mono text-sm"
                />
                <div
                  className="h-10 flex-1 rounded-lg border"
                  style={{ backgroundColor: form.primary_color || "#1e40af" }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for headings and accents in generated documents.
              </p>
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
