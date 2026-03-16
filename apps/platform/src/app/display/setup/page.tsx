"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  QrCode,
  MapPin,
  Volume2,
  CheckCircle2,
  Copy,
  ArrowRight,
  Smartphone,
  Tv,
  Tablet,
  Laptop,
  Settings,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface Zone {
  id: string;
  zone_name: string;
  zone_code: string;
}

interface Device {
  id: string;
  device_name: string;
  device_type: string;
  room_name?: string;
  zone_id?: string;
  is_online: boolean;
  connection_token?: string;
  has_audio: boolean;
}

const DEVICE_TYPES = [
  { value: "display", label: "Interactive Whiteboard", icon: Tv, desc: "Classroom IWB or projector" },
  { value: "kiosk", label: "Digital Signage", icon: Monitor, desc: "Reception screen, corridor display" },
  { value: "tablet", label: "Tablet", icon: Tablet, desc: "iPad or Android tablet on wall mount" },
  { value: "desktop", label: "Desktop PC", icon: Laptop, desc: "Office or staffroom computer" },
  { value: "mobile", label: "Mobile Device", icon: Smartphone, desc: "Phone for on-the-go alerts" },
];

// ─── QR Code Generator (simple SVG-based) ────────────────────────────

function QRPlaceholder({ url }: { url: string }) {
  // In production, use a proper QR library (qrcode.react)
  // This shows the URL with a visual placeholder
  return (
    <div className="bg-white border-4 border-gray-900 rounded-2xl p-6 text-center">
      <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
        <QrCode className="w-24 h-24 text-gray-400" />
      </div>
      <p className="text-xs text-gray-500 break-all">{url}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DISPLAY SETUP WIZARD
// ═══════════════════════════════════════════════════════════════════════

export default function DisplaySetupPage() {
  const [step, setStep] = useState(1);
  const [zones, setZones] = useState<Zone[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState({
    device_name: "",
    device_type: "display",
    zone_id: "",
    room_name: "",
    has_audio: true,
  });
  const [createdDevice, setCreatedDevice] = useState<Device | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/emergency/zones")
      .then((r) => r.json())
      .then((d) => setZones(d.zones || []))
      .catch(() => {});

    fetch("/api/emergency/devices")
      .then((r) => r.json())
      .then((d) => setDevices(d.devices || []))
      .catch(() => {});
  }, []);

  const handleRegister = useCallback(async () => {
    if (!form.device_name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/emergency/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const device = await res.json();
      setCreatedDevice(device);
      setStep(3);
    } catch {
    } finally {
      setSaving(false);
    }
  }, [form]);

  const displayUrl = typeof window !== "undefined"
    ? `${window.location.origin}/display${createdDevice ? `?device=${createdDevice.id}` : ""}`
    : "/display";

  const copyUrl = () => {
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Set Up Display</h1>
          <p className="text-gray-500 mt-2">
            Register a classroom board, digital sign, or device to receive school broadcasts
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  step >= s
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${step > s ? "bg-indigo-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose device type */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg border p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">What type of display?</h2>
            <div className="space-y-3">
              {DEVICE_TYPES.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => {
                    setForm({ ...form, device_type: value });
                    setStep(2);
                  }}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition
                    hover:border-indigo-300 hover:bg-indigo-50
                    ${form.device_type === value ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}
                  `}
                >
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Name and zone */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg border p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Name this display</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.device_name}
                  onChange={(e) => setForm({ ...form, device_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-lg"
                  placeholder="e.g. Year 3 Classroom Board"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Room / Location</label>
                <input
                  type="text"
                  value={form.room_name}
                  onChange={(e) => setForm({ ...form, room_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Room 12, Main Corridor"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Emergency Zone
                </label>
                <select
                  value={form.zone_id}
                  onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                >
                  <option value="">Select zone...</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.zone_name} ({z.zone_code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  This determines which emergency instructions this display shows
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={form.has_audio}
                  onChange={(e) => setForm({ ...form, has_audio: e.target.checked })}
                  className="rounded border-gray-300 w-5 h-5"
                />
                <Volume2 className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-700">Audio enabled</div>
                  <div className="text-xs text-gray-400">Play alarm sounds during emergencies</div>
                </div>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  onClick={handleRegister}
                  disabled={!form.device_name || saving}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? "Registering..." : "Register Display"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success — show URL / QR code */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg border p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Display Registered!</h2>
            <p className="text-gray-500 mb-6">
              Open this URL on your {form.device_type === "display" ? "interactive whiteboard" : "device"}:
            </p>

            {/* URL */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 justify-center">
                <code className="text-sm text-indigo-700 font-mono break-all">{displayUrl}</code>
                <button
                  onClick={copyUrl}
                  className="p-2 rounded-lg hover:bg-gray-200 transition flex-shrink-0"
                >
                  {copied ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">Or scan this QR code on the device:</p>
              <div className="inline-block">
                <QRPlaceholder url={displayUrl} />
              </div>
            </div>

            <div className="text-sm text-gray-400 space-y-1">
              <p>Tip: Bookmark the URL and set it as the browser homepage for auto-start</p>
              <p>The display will appear in your device list once it connects</p>
            </div>

            <div className="flex gap-3 mt-8 justify-center">
              <button
                onClick={() => { setStep(1); setCreatedDevice(null); setForm({ device_name: "", device_type: "display", zone_id: "", room_name: "", has_audio: true }); }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Register Another
              </button>
              <a
                href={displayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Open Display Mode
              </a>
            </div>
          </div>
        )}

        {/* Existing devices */}
        {devices.length > 0 && step === 1 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Registered Devices ({devices.length})
            </h3>
            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between bg-white rounded-xl p-3 border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${d.is_online ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <span className="font-medium text-gray-800 text-sm">{d.device_name}</span>
                      {d.room_name && (
                        <span className="text-xs text-gray-400 ml-2">{d.room_name}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {d.is_online ? "Online" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
