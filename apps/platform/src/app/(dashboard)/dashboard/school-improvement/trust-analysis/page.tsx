"use client";
import * as XLSX from "xlsx";
import { useState, useRef } from "react";
import Papa from "papaparse";
import { Cloud, Edit2, ChevronDown, Check, AlertCircle, BarChart3, MessageSquare, Zap, Search, Image as ImageIcon, Send, FileText } from "lucide-react";
import { DriveFilePicker } from "@/components/canvas/DriveFilePicker";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_PROMPTS = [
  "Comprehensive Year Group Summary",
  "Analyse SEND Disadvantage Gaps",
  "Identify Critical Data Anomalies",
  "Evaluate Phonics & MTC Results",
  "Executive Summary for Governors"
];

function sanitizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[%()]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function extractNumberFromCell(
  value: unknown,
  options?: { preferLast?: boolean },
): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const matches = raw.match(/-?\d+(?:\.\d+)?/g);
  if (!matches?.length) return null;
  const selected = options?.preferLast ? matches[matches.length - 1] : matches[0];
  const parsed = Number(selected);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTrustCell(metricKey: string, value: unknown): number | null {
  const isCountMetric = [
    "number_in_cohort",
    "number_send",
    "ehcp",
    "number_fsm",
  ].includes(metricKey);

  if (isCountMetric) {
    return extractNumberFromCell(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    if (value >= 0 && value <= 1) return Math.round(value * 10000) / 100;
    return Math.round(value * 100) / 100;
  }

  const parsed = extractNumberFromCell(value, { preferLast: true });
  if (parsed === null) return null;

  const raw = String(value).trim();
  if (raw.includes("%") || raw.includes("(")) {
    return Math.round(parsed * 100) / 100;
  }

  if (parsed >= 0 && parsed <= 1) {
    return Math.round(parsed * 10000) / 100;
  }

  return Math.round(parsed * 100) / 100;
}

function buildTrustWorkbookPayload(workbook: XLSX.WorkBook) {
  const sheetProfiles: Record<
    string,
    Array<{ section: "all_pupils" | "fsm6" | "not_fsm6"; start: number; metrics: string[] }>
  > = {
    EYFS: [
      { section: "all_pupils", start: 8, metrics: ["gld"] },
      { section: "fsm6", start: 16, metrics: ["gld"] },
      { section: "not_fsm6", start: 24, metrics: ["gld"] },
    ],
    "Year 1": [
      {
        section: "all_pupils",
        start: 5,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"],
      },
      {
        section: "fsm6",
        start: 14,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"],
      },
      {
        section: "not_fsm6",
        start: 23,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"],
      },
    ],
    "Year 2": [
      {
        section: "all_pupils",
        start: 5,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"],
      },
      {
        section: "fsm6",
        start: 14,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"],
      },
      {
        section: "not_fsm6",
        start: 23,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"],
      },
    ],
    "Year 3": [
      {
        section: "all_pupils",
        start: 5,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"],
      },
      {
        section: "fsm6",
        start: 13,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"],
      },
      {
        section: "not_fsm6",
        start: 21,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"],
      },
    ],
    "Year 4": [
      {
        section: "all_pupils",
        start: 5,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "mtc"],
      },
      {
        section: "fsm6",
        start: 14,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "mtc"],
      },
      {
        section: "not_fsm6",
        start: 23,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "mtc"],
      },
    ],
    "Year 5": [
      {
        section: "all_pupils",
        start: 5,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"],
      },
      {
        section: "fsm6",
        start: 13,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"],
      },
      {
        section: "not_fsm6",
        start: 21,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"],
      },
    ],
    "Year 6": [
      {
        section: "all_pupils",
        start: 5,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"],
      },
      {
        section: "fsm6",
        start: 13,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"],
      },
      {
        section: "not_fsm6",
        start: 21,
        metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"],
      },
    ],
  };

  const result: Record<string, unknown> = {};

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as Array<Array<unknown>>;
    const profile = sheetProfiles[sheetName];

    if (!profile) {
      result[sheetName] = {
        format: "grid",
        rows,
      };
      continue;
    }

    const headerRowIndex = rows.findIndex((row) =>
      row.some((cell) =>
        String(cell ?? "")
          .toLowerCase()
          .includes("number in cohort"),
      ),
    );
    const trustRowIndex = rows.findIndex(
      (row, idx) =>
        idx > Math.max(0, headerRowIndex) &&
        String(row[0] ?? "").trim().toUpperCase() === "TRUST",
    );

    const schoolRowsStart = trustRowIndex >= 0 ? trustRowIndex + 1 : headerRowIndex + 1;
    const schoolRows: Array<{
      school: string;
      cohort: Record<string, number>;
      values: Record<string, Record<string, number>>;
    }> = [];

    for (let r = schoolRowsStart; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const schoolRaw = String(row[0] ?? "").trim();
      if (!schoolRaw) continue;

      const schoolUpper = schoolRaw.toUpperCase();
      if (schoolUpper === "TRUST") continue;
      if (schoolUpper.startsWith("NATIONAL")) continue;
      if (!/^[A-Z]{2,6}$/.test(schoolUpper)) continue;

      const cohort: Record<string, number> = {};
      const values: Record<string, Record<string, number>> = {};

      const cohortMetrics = [
        { metric: "number_in_cohort", col: 1 },
        { metric: "number_send", col: 2 },
        { metric: "ehcp", col: 3 },
        { metric: "number_fsm", col: 4 },
      ];

      for (const cohortMetric of cohortMetrics) {
        const parsed = parseTrustCell(cohortMetric.metric, row[cohortMetric.col]);
        if (parsed !== null) {
          cohort[cohortMetric.metric] = parsed;
        }
      }

      for (const sectionProfile of profile) {
        const sectionValues: Record<string, number> = {};
        sectionProfile.metrics.forEach((metric, idx) => {
          const parsed = parseTrustCell(metric, row[sectionProfile.start + idx]);
          if (parsed !== null) {
            sectionValues[metric] = parsed;
          }
        });
        values[sectionProfile.section] = sectionValues;
      }

      schoolRows.push({
        school: schoolUpper,
        cohort,
        values,
      });
    }

    result[sheetName] = {
      format: "trust_midyear",
      schoolRows,
      profile,
    };
  }

  return result;
}

// Animation variants for Framer Motion
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function GenerativeIntelligenceCanvas() {
  const [dashboardTitle, setDashboardTitle] = useState("AI Intelligence Canvas");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isConnectorOpen, setIsConnectorOpen] = useState(false);
  
  const [parseError, setParseError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [extractedRawData, setExtractedRawData] = useState("");
  
  // Branding
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // The AI payload response
  const [canvasData, setCanvasData] = useState<any>(null);
  const [activeViewIdx, setActiveViewIdx] = useState(0);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  const sendToGenerativePipeline = async (rawDataString: string, prompt: string) => {
    setIsAnalyzing(true);
    setParseError(null);
    setActiveViewIdx(0); // Reset to first tab on new prompt
    try {
      const response = await fetch("/api/ai/generative-canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData: rawDataString, userPrompt: prompt }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "AI Extraction Failed");
      }

      setCanvasData(resJson.payload);
      setModelUsed(typeof resJson.modelUsed === "string" ? resJson.modelUsed : null);
      
    } catch (e: any) {
      console.error(e);
      setParseError(e.message);
      setModelUsed(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeExtraction = (fileObj: File, customPrompt: string) => {
    const isXlsx = fileObj.name.toLowerCase().endsWith('.xlsx');
    
    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target?.result) return;
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const structuredData = buildTrustWorkbookPayload(workbook);
          const rawText = JSON.stringify(structuredData);
          setExtractedRawData(rawText);
          sendToGenerativePipeline(rawText, customPrompt);
        } catch (err: any) {
          setParseError(`Excel Parse error: ${err.message}`);
          setIsAnalyzing(false);
        }
      };
      reader.readAsArrayBuffer(fileObj);
    } else {
      Papa.parse(fileObj, {
        header: true,
        skipEmptyLines: true,
        error: (err: any) => { setParseError(`CSV Parse error: ${err.message}`); setIsAnalyzing(false); },
        complete: (results) => {
          const structuredData = { "Dataset": results.data };
          const rawText = JSON.stringify(structuredData);
          setExtractedRawData(rawText);
          sendToGenerativePipeline(rawText, customPrompt);
        }
      });
    }
  };

  const handleFileSelect = (fileObj: File) => {
    setIsConnectorOpen(false);
    setParseError(null);
    let titleName = fileObj.name;
    const isXlsx = titleName.toLowerCase().endsWith('.xlsx');
    if (titleName.toLowerCase().endsWith('.csv')) titleName = titleName.slice(0,-4);
    if (isXlsx) titleName = titleName.slice(0,-5);
    setDashboardTitle(titleName);
    setSelectedFileObj(fileObj);

    if (userPrompt) {
      setIsAnalyzing(true);
      executeExtraction(fileObj, userPrompt);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSchoolLogoUrl(url);
    }
  };

  const triggerPrompt = (promptText: string) => {
    if (!selectedFileObj) {
      setParseError("Please select a tracking document via the Connector first.");
      return;
    }
    setUserPrompt(promptText);
    setIsAnalyzing(true);
    if (extractedRawData) {
      sendToGenerativePipeline(extractedRawData, promptText);
    } else {
      executeExtraction(selectedFileObj, promptText);
    }
  };

  const renderVisualCard = (c: any, i: number) => {
    if (c.type === "table") {
      return (
        <motion.div key={i} variants={cardVariant} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-6 mb-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-zinc-100 font-semibold text-lg">
            <BarChart3 size={20} className="text-blue-400" /> {c.title}
          </div>
          {c.subtitle && <div className="text-sm text-slate-400 mb-4">{c.subtitle}</div>}
          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 bg-white/5 uppercase">
                <tr>{c.columns.map((col: string, idx: number) => <th key={idx} className="px-4 py-3 font-medium whitespace-nowrap">{col}</th>)}</tr>
              </thead>
              <tbody>
                {c.rows.map((r: string[], rIdx: number) => (
                  <tr key={rIdx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    {r.map((val, cIdx) => <td key={cIdx} className="px-4 py-3 text-zinc-300">{val}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {c.highlight_rules && <div className="mt-4 text-xs text-amber-400 italic">{c.highlight_rules}</div>}
        </motion.div>
      );
    }
    if (c.type === "red_flags") {
      return (
        <motion.div key={i} variants={cardVariant} className="bg-red-500/5 border border-red-500/30 backdrop-blur-sm rounded-xl p-6 mb-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-red-400 font-semibold text-lg">
            <AlertCircle size={20} /> {c.title}
          </div>
          <ul className="list-disc pl-5 space-y-2 text-red-200/90 text-sm leading-relaxed">
            {c.items.map((it: string, idx: number) => <li key={idx}>{it}</li>)}
          </ul>
        </motion.div>
      );
    }
    if (c.type === "positive_impacts") {
      return (
        <motion.div key={i} variants={cardVariant} className="bg-emerald-500/5 border border-emerald-500/30 backdrop-blur-sm rounded-xl p-6 mb-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-semibold text-lg">
            <Check size={20} /> {c.title}
          </div>
          <ul className="list-disc pl-5 space-y-2 text-emerald-200/90 text-sm leading-relaxed">
            {c.items.map((it: string, idx: number) => <li key={idx}>{it}</li>)}
          </ul>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[100vh] bg-[#0f1117] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Header Area */}
      <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-8 py-8 border-b border-white/10 shadow-lg relative overflow-hidden">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-5">
            {/* Dynamic School Branding */}
            {schoolLogoUrl && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden bg-white shadow-xl shadow-black/20 p-1 flex items-center justify-center shrink-0">
                <img src={schoolLogoUrl} alt="School Crest" className="max-h-full max-w-full object-contain" />
              </motion.div>
            )}
            
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                {schoolLogoUrl && <span className="w-1.5 h-10 bg-blue-500 rounded-full hidden md:block"></span>}
                {dashboardTitle}
              </h1>
              <div className="text-blue-200/70 text-sm md:text-base mt-2 font-medium tracking-wide flex items-center gap-2">
                <BarChart3 size={16} /> Generative Data Intelligence
              </div>
              <div className="text-xs md:text-sm mt-2 text-slate-300/80">
                Pipeline: <span className="text-slate-100 font-medium">Generative Canvas</span>
                {" · "}
                Model: <span className="text-slate-100 font-medium">{modelUsed || "pending"}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Branding Upload Button */}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white px-4 py-2.5 rounded-lg font-medium text-sm">
              <ImageIcon size={16} className="text-zinc-400" /> 
              {schoolLogoUrl ? "Change Badge" : "Add Badge"}
            </button>

            {/* Dataset Connector Button */}
            <button 
              onClick={() => setIsConnectorOpen(!isConnectorOpen)}
              className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md ${selectedFileObj ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' : 'bg-blue-600 hover:bg-blue-500 text-white border border-transparent shadow-blue-500/20 shadow-lg hover:shadow-blue-500/40'}`}>
              <Cloud size={16} /> {selectedFileObj ? "Change Data" : "Connect Data"}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <AnimatePresence>
          {isConnectorOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: "auto", opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl">
              <DriveFilePicker onFileSelected={handleFileSelect} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generative Prompt Area */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-10 shadow-2xl">
          <div className="relative">
            <Search size={22} className="absolute left-5 top-5 text-slate-400" />
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder={selectedFileObj ? "Ask me to analyse specific trends, gaps, or produce a summary..." : "Please attach a document using the Connector first before prompting."}
              disabled={!selectedFileObj || isAnalyzing}
              className={`w-full min-h-[90px] p-5 pl-16 rounded-xl text-lg outline-none resize-y transition-colors border shadow-inner ${selectedFileObj ? 'bg-slate-900/80 border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-slate-800/80 border-slate-700/50 text-slate-500 cursor-not-allowed'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  triggerPrompt(userPrompt);
                }
              }}
            />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-5">
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button 
                  key={idx} 
                  disabled={!selectedFileObj || isAnalyzing}
                  onClick={() => triggerPrompt(qp)}
                  className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {qp}
                </button>
              ))}
            </div>
            
            <button 
              disabled={!selectedFileObj || !userPrompt || isAnalyzing}
              onClick={() => triggerPrompt(userPrompt)}
              className="w-full md:w-auto flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900">
              Generate Insights <Zap size={18} />
            </button>
          </div>
        </motion.div>

        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-blue-500/5 border border-blue-500/20 rounded-2xl backdrop-blur-md mb-10 shadow-2xl">
            <div className="inline-block w-14 h-14 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mb-6 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h3 className="text-2xl font-semibold text-blue-400 tracking-tight">AI Synthesizing Intelligence...</h3>
            <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
              Analyzing your localized dataset against the contextual prompt structure. Cross-referencing logical vectors.
            </p>
          </motion.div>
        )}

        {parseError && !isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-8 text-red-200 flex items-center gap-3 shadow-lg shadow-red-500/5">
            <AlertCircle className="shrink-0 text-red-400" size={24}/>
            <span className="text-sm"><strong>Pipeline Error:</strong> {parseError}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!isAnalyzing && canvasData && (
            <motion.div 
              key={`result-${activeViewIdx}`}
              initial="hidden" animate="show" variants={staggerContainer}
              className="space-y-8">
              
              {/* Backward compatibility and normalization */}
              {(() => {
                 let normalizedViews = canvasData.views || [];
                 if (normalizedViews.length === 0) {
                    // Fallback to Tier 1 old structure if AI hallucinated without views array
                    normalizedViews = [{
                       view_name: "Overview",
                       executive_summary: canvasData.executive_summary,
                       key_metrics: canvasData.key_metrics,
                       visual_cards: canvasData.visual_cards
                    }];
                 }
                 const activeView = normalizedViews[activeViewIdx] || normalizedViews[0];
                 
                 return (
                   <>
                     {/* Tab Menu - Only show if multiple tabs exist */}
                     {normalizedViews.length > 1 && (
                       <motion.div variants={cardVariant} className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide border-b border-white/10">
                         {normalizedViews.map((v: any, idx: number) => (
                           <button 
                             key={idx}
                             onClick={() => setActiveViewIdx(idx)}
                             className={`px-5 py-2.5 rounded-t-lg font-medium whitespace-nowrap transition-all border-b-2 ${activeViewIdx === idx ? 'bg-white/10 text-white border-blue-500' : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'}`}>
                             {v.view_name || `Tab ${idx + 1}`}
                           </button>
                         ))}
                       </motion.div>
                     )}

                     {/* Executive Summary */}
                     <motion.div variants={cardVariant} className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 border border-violet-500/20 backdrop-blur-md rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                        <h2 className="text-xl font-semibold text-violet-300 flex items-center gap-3 mb-5">
                          <MessageSquare className="text-violet-400" size={24} /> {activeView?.view_name || 'Executive Summary'}
                        </h2>
                        <p className="text-violet-100/90 leading-relaxed text-lg tracking-wide relative z-10 font-medium">
                          {activeView?.executive_summary}
                        </p>
                     </motion.div>

                     {/* Key Metrics Grid */}
                     {activeView?.key_metrics && activeView.key_metrics.length > 0 && (
                       <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                          {activeView.key_metrics.map((km: any, idx: number) => (
                             <motion.div key={idx} variants={cardVariant} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg hover:bg-white/10 transition-colors">
                               <div className="text-4xl font-bold tracking-tight text-white mb-2">{km.value}</div>
                               <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{km.label}</div>
                               {km.trendValue && (
                                  <div className={`mt-4 flex justify-center items-center gap-1 text-sm font-semibold rounded-full py-1.5 px-3 inline-flex ${km.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (km.trend === 'down' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20')}`}>
                                    {km.trend === 'up' ? '↑' : (km.trend === 'down' ? '↓' : '→')} {km.trendValue}
                                  </div>
                               )}
                             </motion.div>
                          ))}
                       </motion.div>
                     )}

                      {/* Missing Data Errors */}
                     {canvasData.errors_or_missing_data && canvasData.errors_or_missing_data.length > 0 && (
                       <motion.div variants={cardVariant} className="bg-amber-500/10 border border-amber-500/30 border-dashed rounded-xl p-6 text-amber-300 text-sm shadow-lg">
                        <strong className="flex items-center gap-2 text-amber-400 mb-3 text-base"><AlertCircle size={18}/> AI Context Warning:</strong> 
                        <ul className="list-disc pl-6 space-y-2">
                          {canvasData.errors_or_missing_data.map((err: string, idx: number) => <li key={idx}>{err}</li>)}
                        </ul>
                       </motion.div>
                     )}

                     {/* Visual Cards Mapping */}
                     <div className="space-y-6">
                        {activeView?.visual_cards && activeView.visual_cards.map((c: any, i: number) => renderVisualCard(c, i))}
                     </div>
                   </>
                 );
              })()}

              {/* Product Ecosystem Exporters */}
              <motion.div variants={cardVariant} className="mt-12 pt-10 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-end items-center">
                <span className="text-sm text-slate-400 mr-auto italic tracking-wide">
                  Report generated by Generative Canvas
                  {modelUsed ? ` (${modelUsed})` : ""}.
                </span>
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all group">
                  <FileText size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
                  Generate Trustee PDF Report
                </button>
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 rounded-xl font-semibold transition-all group">
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                  Sync to Ofsted Readiness Module
                </button>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
