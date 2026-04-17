import re

with open("/Users/jarvis/dev/Schoolgle_Improvement/apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx", "r") as f:
    content = f.read()

# 1. Add isAnalyzing state
state_replacement = """  const [dashboardTitle, setDashboardTitle] = useState("Trust Mid-Year Data Analytics 2025/26");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isConnectorOpen, setIsConnectorOpen] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);"""

content = content.replace('  const [isConnectorOpen, setIsConnectorOpen] = useState(false);\n  const [parseError, setParseError] = useState(null);', state_replacement)


# 2. Rewrite handleFileSelect to hit the API route
handle_file_select_replacement = """  const sendToAIPipeline = async (rawDataString) => {
    setIsAnalyzing(true);
    setParseError(null);
    try {
      const response = await fetch("/api/ai/etl/trust-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData: rawDataString }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "AI Extraction Failed");
      }

      setSCHOOLS(resJson.schools);
      setDATA(resJson.data);
      
      if (resJson.schools.length === 0) {
        setParseError("The AI successfully read the document but could not find any valid School or Year Group academic metrics inside it.");
      }
    } catch (e) {
      console.error(e);
      setParseError(e.message);
    } finally {
      setIsAnalyzing(false);
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
          
          let combinedData = [];
          // Extract data from top 3 sheets to prevent context overload
          workbook.SheetNames.slice(0, 3).forEach(sheetName => {
             const worksheet = workbook.Sheets[sheetName];
             const jsonData = XLSX.utils.sheet_to_json(worksheet);
             combinedData = combinedData.concat(jsonData);
          });
          
          sendToAIPipeline(JSON.stringify(combinedData));
        } catch (err) {
          setParseError(`Excel Parse error: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(fileObj);
      return;
    }

    // CSV Parse
    Papa.parse(fileObj, {
      header: true,
      skipEmptyLines: true,
      error: (err) => setParseError(`CSV Parse error: ${err.message}`),
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn("CSV minor errors:", results.errors);
        }
        sendToAIPipeline(JSON.stringify(results.data));
      }
    });
  };"""

# Replace the old blocks
start_idx = content.find("  const processParsedData = (data, fields) => {")
end_idx = content.find("  const [selectedYear, setSelectedYear] = useState(\"Year 6\");")
if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + handle_file_select_replacement + "\n\n" + content[end_idx:]
    with open("/Users/jarvis/dev/Schoolgle_Improvement/apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx", "w") as f:
        f.write(new_content)
    print("Frontend rewrite successful")
else:
    print("Could not find boundaries in frontend page")
