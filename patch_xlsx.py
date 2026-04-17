import re

with open("/Users/jarvis/dev/Schoolgle_Improvement/apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx", "r") as f:
    content = f.read()

replacement = """  const processParsedData = (data, fields) => {
    if (!data || data.length === 0) {
      setParseError(`The uploaded file was empty or could not be read.`);
      return;
    }

    const nextData = {
      "EYFS": {}, "Year 1": {}, "Year 2": {}, "Year 3": {}, 
      "Year 4": {}, "Year 5": {}, "Year 6": {}
    };
    const nextSchools = new Set();
    
    data.forEach(row => {
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
            nextData[yg][school][`${s}_ARE`] = parseNum(row[`${s}_ARE`]);
            nextData[yg][school][`${s}_GD`] = parseNum(row[`${s}_GD`]);
         });
         nextData[yg][school].phonics = parseNum(row.Phonics);
         nextData[yg][school].mtc = parseNum(row.MTC);
         
         nextData[yg][school].fsm6 = {};
         nextData[yg][school].notfsm = {};
         
         ['R', 'W', 'M', 'C'].forEach(s => {
            nextData[yg][school].fsm6[`${s}_ARE`] = parseNum(row[`FSM6_${s}_ARE`]);
            nextData[yg][school].notfsm[`${s}_ARE`] = parseNum(row[`NotFSM_${s}_ARE`]);
         });
         if(row.FSM6_Phonics !== undefined) nextData[yg][school].fsm6.phonics = parseNum(row.FSM6_Phonics);
         if(row.NotFSM_Phonics !== undefined) nextData[yg][school].notfsm.phonics = parseNum(row.NotFSM_Phonics);
         if(row.FSM6_MTC !== undefined) nextData[yg][school].fsm6.mtc = parseNum(row.FSM6_MTC);
         if(row.NotFSM_MTC !== undefined) nextData[yg][school].notfsm.mtc = parseNum(row.NotFSM_MTC);
      }
    });
    
    setSCHOOLS(Array.from(nextSchools));
    setDATA(nextData);
    
    if (nextSchools.size === 0) {
      const foundHeaders = fields ? fields.join(", ") : "None";
      setParseError(`The file was parsed successfully, but no rows matched the required columns. Expected 'School' and 'YearGroup'. We found: ${foundHeaders}`);
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

    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const fields = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
          processParsedData(jsonData, fields);
        } catch (err) {
          setParseError(`Excel Parse error: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(fileObj);
      return;
    }

    Papa.parse(fileObj, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      error: (err) => setParseError(`Parse error: ${err.message}`),
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.error(results.errors);
        }
        processParsedData(results.data, results.meta && results.meta.fields);
      }
    });
  };"""

# Replace the old handleFileSelect block
start_idx = content.find("  const handleFileSelect = (fileObj) => {")
end_idx = content.find("  const [selectedYear, setSelectedYear] = useState(\"Year 6\");")
if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + replacement + "\n\n" + content[end_idx:]
    with open("/Users/jarvis/dev/Schoolgle_Improvement/apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx", "w") as f:
        f.write(new_content)
    print("Patched successfully")
else:
    print("Could not find boundaries")
