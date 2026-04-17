import re

content = """"use client";
import * as XLSX from "xlsx";
import { useState, useRef } from "react";
import Papa from "papaparse";
import { Cloud, Edit2, ChevronDown, Check, AlertCircle, BarChart3, MessageSquare, Zap, Search } from "lucide-react";
import DriveFilePicker from "@/components/canvas/DriveFilePicker";

const QUICK_PROMPTS = [
  "Comprehensive Year Group Summary",
  "Analyse SEND Disadvantage Gaps",
  "Identify Critical Data Anomalies",
  "Evaluate Phonics & MTC Results",
  "Executive Summary for Governors"
];

export default function GenerativeIntelligenceCanvas() {
  const [dashboardTitle, setDashboardTitle] = useState("AI Intelligence Canvas");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isConnectorOpen, setIsConnectorOpen] = useState(false);
  
  const [parseError, setParseError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [extractedRawData, setExtractedRawData] = useState("");
  
  // The AI payload response
  const [canvasData, setCanvasData] = useState(null);

  const styles = {
    app: { fontFamily:"'Instrument Sans', 'DM Sans', system-ui, sans-serif", background:"#0f1117", color:"#e4e4e7", minHeight:"100vh", padding:"0" },
    header: { background:"linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", padding:"28px 32px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" },
    headerTitle: { fontSize:"22px", fontWeight:700, color:"#f4f4f5", margin:0, letterSpacing:"-0.3px" },
    content: { padding:"20px 32px 40px", maxWidth: 1400, margin: "0 auto" },
    card: { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"24px", marginBottom:20 },
    cardTitle: { fontSize:16, fontWeight:600, color:"#e4e4e7", marginBottom:16, display: 'flex', alignItems: 'center', gap: 8 },
    statVal: { fontSize:32, fontWeight:700, color:"#f4f4f5" },
    statLabel: { fontSize:12, color:"#a1a1aa", marginTop:4 },
    table: { width:"100%", borderCollapse:"collapse", fontSize:13 },
    th: { textAlign:"left", padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.1)", color:"#a1a1aa", fontWeight:500, fontSize:12, whiteSpace:"nowrap" },
    td: { padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.04)", color:"#d4d4d8" },
    chip: { padding: '6px 14px', borderRadius: 20, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'all 0.2s', marginRight: 10, marginBottom: 10 }
  };

  const sendToGenerativePipeline = async (rawDataString, prompt) => {
    setIsAnalyzing(true);
    setParseError(null);
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
      
    } catch (e) {
      console.error(e);
      setParseError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeExtraction = (fileObj, customPrompt) => {
    const isXlsx = fileObj.name.toLowerCase().endsWith('.xlsx');
    
    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          let combinedData = [];
          workbook.SheetNames.forEach(sheetName => {
             const worksheet = workbook.Sheets[sheetName];
             const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
             const cleanedData = jsonData.filter(r => Object.values(r).some(v => v !== ""));
             combinedData = combinedData.concat(cleanedData);
          });
          const rawText = JSON.stringify(combinedData);
          setExtractedRawData(rawText);
          sendToGenerativePipeline(rawText, customPrompt);
        } catch (err) {
          setParseError(`Excel Parse error: ${err.message}`);
          setIsAnalyzing(false);
        }
      };
      reader.readAsArrayBuffer(fileObj);
    } else {
      Papa.parse(fileObj, {
        header: true,
        skipEmptyLines: true,
        error: (err) => { setParseError(`CSV Parse error: ${err.message}`); setIsAnalyzing(false); },
        complete: (results) => {
          const rawText = JSON.stringify(results.data);
          setExtractedRawData(rawText);
          sendToGenerativePipeline(rawText, customPrompt);
        }
      });
    }
  };

  const handleFileSelect = (fileObj) => {
    setIsConnectorOpen(false);
    setParseError(null);
    let titleName = fileObj.name;
    const isXlsx = titleName.toLowerCase().endsWith('.xlsx');
    if (titleName.toLowerCase().endsWith('.csv')) titleName = titleName.slice(0,-4);
    if (isXlsx) titleName = titleName.slice(0,-5);
    setDashboardTitle(titleName);
    setSelectedFileObj(fileObj);

    // If there is already a prompt typed in, execute, otherwise just wait
    if (userPrompt) {
      setIsAnalyzing(true);
      executeExtraction(fileObj, userPrompt);
    }
  };

  const triggerPrompt = (promptText) => {
    if (!selectedFileObj) {
      setParseError("Please select a tracking document via the Connector first.");
      return;
    }
    setUserPrompt(promptText);
    setIsAnalyzing(true);
    if (extractedRawData) {
      // Re-use already extracted text instantly
      sendToGenerativePipeline(extractedRawData, promptText);
    } else {
      executeExtraction(selectedFileObj, promptText);
    }
  };

  const renderVisualCard = (c, i) => {
    if (c.type === "table") {
      return (
        <div key={i} style={styles.card}>
          <div style={styles.cardTitle}><BarChart3 size={18} color="#60a5fa" /> {c.title}</div>
          {c.subtitle && <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>{c.subtitle}</div>}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>{c.columns.map((col, idx) => <th key={idx} style={styles.th}>{col}</th>)}</tr>
              </thead>
              <tbody>
                {c.rows.map((r, rIdx) => (
                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    {r.map((val, cIdx) => <td key={cIdx} style={styles.td}>{val}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {c.highlight_rules && <div style={{ marginTop: 12, fontSize: 12, color: '#fbbf24', fontStyle: 'italic' }}>{c.highlight_rules}</div>}
        </div>
      );
    }
    if (c.type === "red_flags") {
      return (
        <div key={i} style={{ ...styles.card, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ ...styles.cardTitle, color: '#f87171' }}><AlertCircle size={18} /> {c.title}</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#fca5a5', fontSize: 14, lineHeight: 1.6 }}>
            {c.items.map((it, idx) => <li key={idx} style={{ marginBottom: 8 }}>{it}</li>)}
          </ul>
        </div>
      );
    }
    if (c.type === "positive_impacts") {
      return (
        <div key={i} style={{ ...styles.card, border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
          <div style={{ ...styles.cardTitle, color: '#34d399' }}><Check size={18} /> {c.title}</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#6ee7b7', fontSize: 14, lineHeight: 1.6 }}>
            {c.items.map((it, idx) => <li key={idx} style={{ marginBottom: 8 }}>{it}</li>)}
          </ul>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={styles.headerTitle}>{dashboardTitle}</h1>
            </div>
            <div style={styles.headerSub}>Generative Data Intelligence Canvas</div>
          </div>
          <div>
            <button 
              onClick={() => setIsConnectorOpen(!isConnectorOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: selectedFileObj ? 'rgba(255,255,255,0.1)' : '#2563eb', 
                color: 'white', border: selectedFileObj ? '1px solid rgba(255,255,255,0.2)' : 'none', 
                padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px'
              }}>
              <Cloud size={16} /> {selectedFileObj ? "Change Dataset" : "Connect Dataset"}
            </button>
          </div>
        </div>
      </div>
      
      {isConnectorOpen && (
        <div style={{ marginBottom: '24px' }}>
          <DriveFilePicker onFileSelected={handleFileSelect} />
        </div>
      )}

      <div style={styles.content}>
        
        {/* Generative Prompt Area */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24, marginBottom: 30, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 20 }} />
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={selectedFileObj ? "Ask me to analyse specific trends, gaps, or produce a summary..." : "Please attach a document using the Connector first before prompting."}
                  disabled={!selectedFileObj || isAnalyzing}
                  style={{ 
                    width: '100%', minHeight: '60px', padding: '18px 20px 18px 50px', 
                    background: selectedFileObj ? '#0f172a' : '#1e293b',
                    border: '1px solid #334155', borderRadius: 8, color: '#f8fafc', 
                    fontSize: 16, outline: 'none', resize: 'vertical'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      triggerPrompt(userPrompt);
                    }
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button key={idx} style={styles.chip} onClick={() => triggerPrompt(qp)}>
                      {qp}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={!selectedFileObj || !userPrompt || isAnalyzing}
                  onClick={() => triggerPrompt(userPrompt)}
                  style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, cursor: (!selectedFileObj || !userPrompt || isAnalyzing) ? 'not-allowed' : 'pointer', opacity: (!selectedFileObj || !userPrompt || isAnalyzing) ? 0.5 : 1 }}>
                  Generate Insights <Zap size={14} style={{ marginLeft: 4, display: 'inline' }}/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {isAnalyzing && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: 20 }}>
            <div style={{ display: 'inline-block', width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(59, 130, 246, 0.3)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#60a5fa' }}>AI Synthesizing Intelligence...</h3>
            <p style={{ marginTop: 8, fontSize: 14, color: '#94a3b8', maxWidth: 400, margin: '8px auto 0' }}>
              Analyzing the dataset against your prompt structure.
            </p>
          </div>
        )}

        {parseError && !isAnalyzing && (
          <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.4)", borderRadius: 8, padding: 16, marginBottom: 20, color: "#fca5a5" }}>
            <strong>Error:</strong> {parseError}
          </div>
        )}

        {!isAnalyzing && canvasData && (
          <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            
            {/* Executive Summary */}
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
               <h2 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: 8 }}>
                 <MessageSquare size={20} /> Executive Summary
               </h2>
               <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#ddd6fe' }}>
                 {canvasData.executive_summary}
               </p>
            </div>

            {/* Key Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
               {canvasData.key_metrics && canvasData.key_metrics.map((km, idx) => (
                  <div key={idx} style={{...styles.card, padding: "20px", textAlign: "center", marginBottom: 0}}>
                    <div style={styles.statVal}>{km.value}</div>
                    <div style={styles.statLabel}>{km.label}</div>
                    {km.trendValue && (
                       <div style={{ fontSize: 12, marginTop: 8, color: km.trend === 'up' ? '#10b981' : (km.trend === 'down' ? '#ef4444' : '#94a3b8') }}>
                         {km.trend === 'up' ? '↑ ' : (km.trend === 'down' ? '↓ ' : '→ ')} {km.trendValue}
                       </div>
                    )}
                  </div>
               ))}
            </div>

             {/* Missing Data Errors */}
            {canvasData.errors_or_missing_data && canvasData.errors_or_missing_data.length > 0 && (
              <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px dashed rgba(245, 158, 11, 0.4)", borderRadius: 8, padding: 16, marginBottom: 24, color: "#fcd34d", fontSize: 14 }}>
               <strong>AI Note on Request:</strong> 
               <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                 {canvasData.errors_or_missing_data.map((err, idx) => <li key={idx}>{err}</li>)}
               </ul>
              </div>
            )}

            {/* Visual Cards Mapping */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
               {canvasData.visual_cards && canvasData.visual_cards.map((c, i) => renderVisualCard(c, i))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
"""

with open("/Users/jarvis/dev/Schoolgle_Improvement/apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx", "w") as f:
    f.write(content)

