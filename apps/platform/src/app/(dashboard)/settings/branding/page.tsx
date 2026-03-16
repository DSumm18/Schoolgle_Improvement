"use client";

import { useState, useEffect } from "react";
import {
  Palette,
  Upload,
  Save,
  Image,
  Monitor,
  FileText,
  Mail,
  CheckCircle2,
} from "lucide-react";

interface Branding {
  logo_url?: string;
  logo_dark_url?: string;
  crest_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  alert_color?: string;
  school_name: string;
  school_motto?: string;
  school_type?: string;
  trust_name?: string;
  trust_logo_url?: string;
  display_theme: string;
  show_trust_branding?: boolean;
  show_motto_on_display?: boolean;
}

export default function BrandingSettingsPage() {
  const [branding, setBranding] = useState<Branding>({
    primary_color: "#1e40af",
    secondary_color: "#059669",
    school_name: "",
    display_theme: "light",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => r.json())
      .then((d) => {
        setBranding(d.branding);
        setIsDefault(d.isDefault);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      setSaved(true);
      setIsDefault(false);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof Branding, value: any) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Palette className="w-8 h-8 text-indigo-600" />
            School Branding
          </h1>
          <p className="text-gray-500 mt-1">
            Central brand assets used across displays, documents, emails, and the dashboard
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Saved!
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Identity */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">School Identity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                School Name
              </label>
              <input
                type="text"
                value={branding.school_name || ""}
                onChange={(e) => update("school_name", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Arrival Primary School"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                School Type
              </label>
              <input
                type="text"
                value={branding.school_type || ""}
                onChange={(e) => update("school_type", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Academy, VA Primary"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                School Motto / Strapline
              </label>
              <input
                type="text"
                value={branding.school_motto || ""}
                onChange={(e) => update("school_motto", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Every child, every chance, every day"
              />
            </div>
          </div>
        </div>

        {/* Logos */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Logos & Images</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { field: "logo_url" as const, label: "Primary Logo", icon: Image },
              { field: "logo_dark_url" as const, label: "Logo (Dark BG)", icon: Image },
              { field: "crest_url" as const, label: "School Crest", icon: FileText },
            ].map(({ field, label, icon: Icon }) => (
              <div key={field} className="text-center">
                <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center mb-2">
                  {branding[field] ? (
                    <img
                      src={branding[field]!}
                      alt={label}
                      className="max-w-full max-h-full object-contain p-4"
                    />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-300 mb-2" />
                      <span className="text-xs text-gray-400">Upload</span>
                    </>
                  )}
                </div>
                <label className="text-sm font-medium text-gray-600">{label}</label>
                <input
                  type="text"
                  value={branding[field] || ""}
                  onChange={(e) => update(field, e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Image URL"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Brand Colours</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { field: "primary_color" as const, label: "Primary" },
              { field: "secondary_color" as const, label: "Secondary" },
              { field: "alert_color" as const, label: "Alert / Emergency" },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding[field] || "#1e40af"}
                    onChange={(e) => update(field, e.target.value)}
                    className="w-10 h-10 rounded-lg border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding[field] || ""}
                    onChange={(e) => update(field, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Display Mode Settings
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            These settings affect how your school appears on classroom displays, the dashboard, and generated documents.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Display Theme
              </label>
              <select
                value={branding.display_theme || "light"}
                onChange={(e) => update("display_theme", e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (follows system)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={branding.show_motto_on_display !== false}
                onChange={(e) => update("show_motto_on_display", e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Show school motto on display screens
              </span>
            </label>
          </div>
        </div>

        {/* Trust Branding (if applicable) */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Trust / MAT Branding (optional)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Trust Name
              </label>
              <input
                type="text"
                value={branding.trust_name || ""}
                onChange={(e) => update("trust_name", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Aurora Academies Trust"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Trust Logo URL
              </label>
              <input
                type="text"
                value={branding.trust_logo_url || ""}
                onChange={(e) => update("trust_logo_url", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="https://..."
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              type="checkbox"
              checked={branding.show_trust_branding || false}
              onChange={(e) => update("show_trust_branding", e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Show trust branding alongside school branding
            </span>
          </label>
        </div>

        {/* Usage Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Where Branding Appears</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-center">
            {[
              { icon: Monitor, label: "Classroom Displays" },
              { icon: FileText, label: "Documents & Reports" },
              { icon: Mail, label: "Email Notifications" },
              { icon: Palette, label: "Dashboard Header" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="p-3 bg-white rounded-lg border">
                <Icon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
