"use client";

import { useState } from "react";
import EdVoiceChat from "@/components/ed-voice/EdVoiceChat";

/**
 * Voice Diagnostics Page
 *
 * Test page for verifying Ed's voice system:
 * - Gemini Live API connection
 * - Audio capture and playback
 * - System prompt and character
 * - Dialogue bank integration
 * - Trigger system
 */
export default function VoiceDiagnosticsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [apiKeyStatus, setApiKeyStatus] = useState<"loading" | "present" | "missing">("loading");
  const [audioPermission, setAudioPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
  };

  const checkApiKey = async () => {
    addLog("Checking GEMINI_API_KEY...");
    try {
      const res = await fetch("/api/voice/config");
      if (res.ok) {
        const data = await res.json();
        if (data.wsUrl && data.wsUrl.includes("key=")) {
          setApiKeyStatus("present");
          setTestResults((prev) => ({ ...prev, apiKey: true }));
          addLog("✓ GEMINI_API_KEY is configured");
        } else {
          setApiKeyStatus("missing");
          setTestResults((prev) => ({ ...prev, apiKey: false }));
          addLog("✗ GEMINI_API_KEY is missing in .env.local");
        }
      } else {
        setApiKeyStatus("missing");
        setTestResults((prev) => ({ ...prev, apiKey: false }));
        addLog("✗ Failed to get voice config");
      }
    } catch (err) {
      setApiKeyStatus("missing");
      setTestResults((prev) => ({ ...prev, apiKey: false }));
      addLog(`✗ Error checking API key: ${err}`);
    }
  };

  const checkAudioPermission = async () => {
    addLog("Checking microphone permission...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermission("granted");
      setTestResults((prev) => ({ ...prev, audio: true }));
      addLog("✓ Microphone access granted");
      stream.getTracks().forEach((track) => track.stop());
    } catch (err: any) {
      setAudioPermission("denied");
      setTestResults((prev) => ({ ...prev, audio: false }));
      addLog(`✗ Microphone access denied: ${err.name}`);
    }
  };

  const checkAssets = async () => {
    addLog("Checking Ed assets...");
    const assets = [
      "/ed/voice/system-prompt.md",
      "/ed/voice/dialogue-bank.json",
      "/ed/voice/trigger-map.json",
      "/ed/voice/module-dialogue.json",
      "/ed/animation/ed-idle.json",
      "/ed/animation/ed-speaking.json",
      "/ed/animation/ed-thinking.json",
      "/js/audio-processor.worklet.js",
    ];

    let allPresent = true;
    for (const asset of assets) {
      try {
        const res = await fetch(asset);
        if (res.ok) {
          addLog(`✓ Found: ${asset}`);
        } else {
          addLog(`✗ Missing: ${asset}`);
          allPresent = false;
        }
      } catch {
        addLog(`✗ Error loading: ${asset}`);
        allPresent = false;
      }
    }
    setTestResults((prev) => ({ ...prev, assets: allPresent }));
  };

  const checkDialogueBank = async () => {
    addLog("Checking dialogue bank structure...");
    try {
      const res = await fetch("/ed/voice/dialogue-bank.json");
      if (res.ok) {
        const data = await res.json();
        const hasGlobal = data.global && typeof data.global === "object";
        const hasModules = data.modules && typeof data.modules === "object";
        const hasTriggers = data.trigger_map !== undefined;

        if (hasGlobal && hasModules) {
          addLog("✓ Dialogue bank structure valid");
          addLog(`  - Global responses: ${Object.keys(data.global).length} categories`);
          addLog(`  - Modules: ${Object.keys(data.modules).length} modules`);
          setTestResults((prev) => ({ ...prev, dialogueBank: true }));
        } else {
          addLog("✗ Dialogue bank structure invalid");
          setTestResults((prev) => ({ ...prev, dialogueBank: false }));
        }
      } else {
        addLog("✗ Failed to load dialogue bank");
        setTestResults((prev) => ({ ...prev, dialogueBank: false }));
      }
    } catch (err) {
      addLog(`✗ Error checking dialogue bank: ${err}`);
      setTestResults((prev) => ({ ...prev, dialogueBank: false }));
    }
  };

  const runAllChecks = async () => {
    addLog("=== Starting voice diagnostics ===");
    await checkApiKey();
    await checkAudioPermission();
    await checkAssets();
    await checkDialogueBank();
    addLog("=== Diagnostics complete ===");
  };

  const testVoiceConnection = () => {
    addLog("Starting voice connection test...");
    addLog("Click the microphone button below to test live voice");
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold">Ed Voice Diagnostics</h1>
        <p className="mb-8 text-slate-400">
          Test and verify Ed's voice system components
        </p>

        {/* Status Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            title="API Key"
            status={apiKeyStatus}
            result={testResults.apiKey}
          />
          <StatusCard
            title="Audio"
            status={audioPermission === "unknown" ? "loading" : audioPermission}
            result={testResults.audio}
          />
          <StatusCard
            title="Assets"
            status="loading"
            result={testResults.assets}
          />
          <StatusCard
            title="Dialogue"
            status="loading"
            result={testResults.dialogueBank}
          />
        </div>

        {/* Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={runAllChecks}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500"
          >
            Run All Checks
          </button>
          <button
            onClick={checkApiKey}
            className="rounded-lg bg-slate-800 px-6 py-3 hover:bg-slate-700"
          >
            Check API Key
          </button>
          <button
            onClick={checkAudioPermission}
            className="rounded-lg bg-slate-800 px-6 py-3 hover:bg-slate-700"
          >
            Check Audio
          </button>
          <button
            onClick={checkAssets}
            className="rounded-lg bg-slate-800 px-6 py-3 hover:bg-slate-700"
          >
            Check Assets
          </button>
          <button
            onClick={testVoiceConnection}
            className="rounded-lg bg-emerald-600 px-6 py-3 hover:bg-emerald-500"
          >
            Test Voice
          </button>
        </div>

        {/* Voice Test Area */}
        <div className="mb-8 rounded-lg bg-slate-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">Live Voice Test</h2>
          <p className="mb-4 text-slate-400">
            Click the microphone button to test Ed's voice. Try saying:
          </p>
          <ul className="mb-4 list-inside list-disc text-slate-300">
            <li>"Hello Ed"</li>
            <li>"Can you help me with a lesson plan?"</li>
            <li>"Thanks Ed"</li>
            <li>"Something went wrong"</li>
          </ul>
          <div className="rounded bg-slate-950 p-4">
            <EdVoiceChat />
          </div>
        </div>

        {/* System Prompt Preview */}
        <div className="mb-8 rounded-lg bg-slate-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">System Prompt Preview</h2>
          <div className="max-h-96 overflow-y-auto rounded bg-slate-950 p-4">
            <pre className="whitespace-pre-wrap text-sm text-slate-300">
              {`You are Ed, a calm, intelligent assistant used by school staff...

VOICE AND TONE:
- Clear British English — neutral, slightly refined
- Calm, steady pace — speak at 0.9-1.0 speed
- Warm but professional — approachable but always competent
- Light dry humour — occasionally witty (max 1 in 5 responses)

CORE PERSONALITY:
- Reliable — always capable
- Observant — notices context
- Slightly self-aware — occasional wit
- Never flustered — quick to recover
...`}
            </pre>
          </div>
        </div>

        {/* Logs */}
        <div className="rounded-lg bg-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Diagnostic Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto rounded bg-slate-950 p-4 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-slate-500">No logs yet. Run a check to see output.</p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`mb-1 ${
                    log.includes("✓") ? "text-emerald-400" : log.includes("✗") ? "text-red-400" : "text-slate-300"
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  status,
  result,
}: {
  title: string;
  status: "loading" | "present" | "granted" | "missing" | "denied" | "unknown";
  result?: boolean;
}) {
  const getStatusColor = () => {
    if (result === true) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (result === false) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (status === "loading") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-slate-800 text-slate-400 border-slate-700";
  };

  const getStatusText = () => {
    if (result === true) return "Pass";
    if (result === false) return "Fail";
    if (status === "loading") return "Checking...";
    if (status === "unknown") return "Unknown";
    return "Not checked";
  };

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm opacity-75">{getStatusText()}</p>
    </div>
  );
}
