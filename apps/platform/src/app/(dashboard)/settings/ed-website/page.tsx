"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Globe,
  Palette,
  MessageSquare,
  Zap,
  ExternalLink,
} from "lucide-react";

export default function EdWebsiteSetupPage() {
  const [config, setConfig] = useState<any>(null);
  const [embedSnippet, setEmbedSnippet] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [schoolName, setSchoolName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi! I'm Ed, your school assistant. How can I help you today?",
  );
  const [theme, setTheme] = useState("standard");
  const [position, setPosition] = useState("bottom-right");
  const [accentColor, setAccentColor] = useState("#0ea5e9");

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch("/api/ed/embed/setup");
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setEmbedSnippet(data.embedSnippet);
        setSchoolName(data.config.school_name);
        setWebsiteUrl(data.config.website_url || "");
        setWelcomeMessage(data.config.welcome_message);
        setTheme(data.config.theme);
        setPosition(data.config.position);
        setAccentColor(data.config.accent_color);
        setStep(4); // Already configured
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/ed/embed/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: schoolName,
          website_url: websiteUrl,
          welcome_message: welcomeMessage,
          theme,
          position,
          accent_color: accentColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setEmbedSnippet(data.embedSnippet);
        setStep(4);
      }
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setSaving(false);
    }
  }

  function copySnippet() {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ed for Your School Website
        </h1>
        <p className="text-gray-600 mt-1">
          Add Ed to your school website so parents and visitors can get instant
          answers to their questions — without calling the office.
        </p>
      </div>

      {/* Step 1: School Name */}
      <div
        className={`rounded-xl border p-6 ${step >= 1 ? "border-sky-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h2 className="text-lg font-semibold">Your School</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Name
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. St Mary's C of E Primary School"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Website URL
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g. www.stmarys.school"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          {schoolName && (
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Customise */}
      {step >= 2 && (
        <div className="rounded-xl border border-sky-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h2 className="text-lg font-semibold">Customise Ed</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Welcome Message
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accent Colour
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">{accentColor}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Activate */}
      {step >= 3 && step < 4 && (
        <div className="rounded-xl border border-sky-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h2 className="text-lg font-semibold">Activate Ed</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Ready to add Ed to {schoolName}? Click below and we'll generate your
            embed code.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition disabled:opacity-50 font-medium"
          >
            {saving ? "Setting up..." : "Activate Ed for My Website"}
          </button>
        </div>
      )}

      {/* Step 4: Get the Code */}
      {step >= 4 && embedSnippet && (
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
              <Check className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-green-900">
              Ed is Ready!
            </h2>
          </div>

          <p className="text-green-800 mb-4">
            Copy this one line of code and paste it into your school website,
            just before the{" "}
            <code className="bg-green-100 px-1 rounded">&lt;/body&gt;</code>{" "}
            tag.
          </p>

          <div className="bg-gray-900 rounded-lg p-4 relative">
            <code className="text-green-400 text-sm break-all">
              {embedSnippet}
            </code>
            <button
              onClick={copySnippet}
              className="absolute top-2 right-2 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-green-900">
              How to add this to your website:
            </h3>
            <div className="space-y-2 text-sm text-green-800">
              <p className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">1.</span>
                Copy the code above (click the copy button)
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">2.</span>
                Open your school website editor (WordPress, Wix, Squarespace, or
                ask your web provider)
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">3.</span>
                Paste the code just before the{" "}
                <code className="bg-green-100 px-1 rounded">
                  &lt;/body&gt;
                </code>{" "}
                tag — or in your site's "Custom Scripts" / "Footer Code" section
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">4.</span>
                Save and publish. Ed will appear on your website within seconds.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Common Website Platforms
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <p>
                <strong>WordPress:</strong> Appearance → Theme Editor →
                footer.php (before &lt;/body&gt;), or use "Insert Headers and
                Footers" plugin
              </p>
              <p>
                <strong>Wix:</strong> Settings → Custom Code → Body - End
              </p>
              <p>
                <strong>Squarespace:</strong> Settings → Advanced → Code
                Injection → Footer
              </p>
              <p>
                <strong>School Jotter / Primary Site:</strong> Ask your web
                provider to add the script to the site footer
              </p>
              <p>
                <strong>Other:</strong> Contact your website provider and send
                them the code — they'll know what to do
              </p>
            </div>
          </div>

          {/* Reconfigure button */}
          <div className="mt-4">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              Change settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
