const fs = require('fs');
let file = fs.readFileSync('apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx', 'utf8');

file = file.replace(
  'import { useState, useMemo } from "react";',
  `import { useState, useMemo, useRef } from "react";
import Papa from "papaparse";
import { DriveFilePicker } from "@/components/canvas/DriveFilePicker";
import { Cloud, Edit2, Link as LinkIcon, DownloadCloud } from "lucide-react";`
);

// We need to change the constants to DEFAULTS
file = file.replace('const SCHOOLS = [', 'const DEFAULT_SCHOOLS = [');
file = file.replace('const SCHOOL_NAMES = {', 'const DEFAULT_SCHOOL_NAMES = {');
file = file.replace('const DATA = {', 'const DEFAULT_DATA = {');

// Inject the state into TrustAnalysis 
const componentStart = `export default function TrustAnalysis() {
  const [selectedYear, setSelectedYear] = useState("Year 6");`;

const replacement = `export default function TrustAnalysis() {
  const [DATA, setDATA] = useState(DEFAULT_DATA);
  const [SCHOOLS, setSCHOOLS] = useState(DEFAULT_SCHOOLS);
  const [dashboardTitle, setDashboardTitle] = useState("Trust Mid-Year Data Analytics 2025/26");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isConnectorOpen, setIsConnectorOpen] = useState(false);

  const handleFileSelect = (fileObj) => {
    setIsConnectorOpen(false);
    let titleName = fileObj.name;
    if (titleName.toLowerCase().endsWith('.csv')) titleName = titleName.slice(0,-4);
    if (titleName.toLowerCase().endsWith('.xlsx')) titleName = titleName.slice(0,-5);
    setDashboardTitle(titleName);

    Papa.parse(fileObj, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // converts strings like "12" or "0.6" into Numbers
      complete: (results) => {
        const nextData = {
          "EYFS": {}, "Year 1": {}, "Year 2": {}, "Year 3": {}, 
          "Year 4": {}, "Year 5": {}, "Year 6": {}
        };
        const nextSchools = new Set();
        
        results.data.forEach(row => {
          const school = row.School;
          const yg = row.YearGroup;
          if (!school || !yg || !nextData[yg]) return;
          
          nextSchools.add(school);
          const parseNum = (v) => (v === "" || v == null || isNaN(Number(v))) ? null : Number(v);
          
          nextData[yg][school] = {
            cohort: parseNum(row.Cohort),
            send: parseNum(row.SEND),
            ehcp: parseNum(row.EHCP),
            fsm: parseNum(row.FSM),
          };
          
          if (yg === "EYFS") {
             nextData[yg][school].gld_all = parseNum(row.GLD_All);
             nextData[yg][school].gld_fsm = parseNum(row.GLD_FSM);
             nextData[yg][school].gld_notfsm = parseNum(row.GLD_NonFSM);
          } else {
             ['R', 'W', 'M', 'C'].forEach(s => {
                nextData[yg][school][\`\${s}_ARE\`] = parseNum(row[\`\${s}_ARE\`]);
                nextData[yg][school][\`\${s}_GD\`] = parseNum(row[\`\${s}_GD\`]);
             });
             nextData[yg][school].phonics = parseNum(row.Phonics);
             nextData[yg][school].mtc = parseNum(row.MTC);
             
             nextData[yg][school].fsm6 = {};
             nextData[yg][school].notfsm = {};
             
             ['R', 'W', 'M', 'C'].forEach(s => {
                nextData[yg][school].fsm6[\`\${s}_ARE\`] = parseNum(row[\`FSM6_\${s}_ARE\`]);
                nextData[yg][school].notfsm[\`\${s}_ARE\`] = parseNum(row[\`NotFSM_\${s}_ARE\`]);
             });
             if(row.FSM6_Phonics !== undefined) nextData[yg][school].fsm6.phonics = parseNum(row.FSM6_Phonics);
             if(row.NotFSM_Phonics !== undefined) nextData[yg][school].notfsm.phonics = parseNum(row.NotFSM_Phonics);
             if(row.FSM6_MTC !== undefined) nextData[yg][school].fsm6.mtc = parseNum(row.FSM6_MTC);
             if(row.NotFSM_MTC !== undefined) nextData[yg][school].notfsm.mtc = parseNum(row.NotFSM_MTC);
          }
        });
        
        setSCHOOLS(Array.from(nextSchools));
        setDATA(nextData);
      }
    });
  };

  const [selectedYear, setSelectedYear] = useState("Year 6");`;

file = file.replace(componentStart, replacement);

// We need to inject the DriveFilePicker into the Header UI.
const headerTarget = `      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Trust Mid-Year Data Analysis 2025/26</h1>
        <div style={styles.headerSub}>7 schools · EYFS to Year 6 · ARE, GD, FSM6 gap analysis · Ofsted-ready questioning</div>
      </div>`;

const newHeader = `      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {isEditingTitle ? (
              <input 
                autoFocus
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                value={dashboardTitle}
                onChange={e => setDashboardTitle(e.target.value)}
                style={{ ...styles.headerTitle, background: 'transparent', border: '1px dashed #3f3f46', outline: 'none', width: '400px' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={styles.headerTitle} onClick={() => setIsEditingTitle(true)}>{dashboardTitle}</h1>
                <Edit2 size={14} color="#71717a" style={{ cursor: 'pointer' }} onClick={() => setIsEditingTitle(true)} />
              </div>
            )}
            <div style={styles.headerSub}>{SCHOOLS.length} schools · EYFS to Year 6 · Connected Dataset Dashboard</div>
          </div>
          <div>
            <button 
              onClick={() => setIsConnectorOpen(!isConnectorOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: '#2563eb', color: 'white', border: 'none', 
                padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
                fontSize: '14px'
              }}>
              <Cloud size={16} /> Connector
            </button>
          </div>
        </div>
      </div>
      
      {isConnectorOpen && (
        <div style={{ marginBottom: '24px' }}>
          <DriveFilePicker onFileSelected={handleFileSelect} />
        </div>
      )}`;

file = file.replace(headerTarget, newHeader);

// Write it back
fs.writeFileSync('apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx', file);
