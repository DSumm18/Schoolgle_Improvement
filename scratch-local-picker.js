const fs = require('fs');

let file = fs.readFileSync('apps/platform/src/components/canvas/DriveFilePicker.tsx', 'utf8');

const targetStr = `
  // Not connected — show connect button
  if (!isConnected) {
    return (
      <div className="border border-dashed border-border rounded-xl p-6 text-center">
        <Cloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
        <p className="text-sm font-semibold mb-1">Connect Google Drive</p>
        <p className="text-xs text-muted-foreground mb-3">
          Browse your Drive and pick a spreadsheet. Read-only access — we never
          modify your files.
        </p>
        <button
          onClick={handleConnect}
          disabled={authLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {authLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Cloud className="w-3 h-3" />
          )}
          Connect Google Drive
        </button>
      </div>
    );
  }`;

const newStr = `
  // Not connected — show connect button
  if (!isConnected) {
    return (
      <div className="border border-dashed border-border rounded-xl p-6 text-center">
        <Cloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
        <p className="text-sm font-semibold mb-1">Connect Google Drive</p>
        <p className="text-xs text-muted-foreground mb-3">
          Browse your Drive and pick a spreadsheet. Read-only access — we never
          modify your files.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleConnect}
            disabled={authLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {authLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Cloud className="w-3 h-3" />
            )}
            Connect Google Drive
          </button>
          
          <div className="relative w-full max-w-[200px] mt-2 pt-3 border-t border-border">
            <input 
              type="file" 
              accept=".csv,.xlsx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onFileSelected(e.target.files[0]);
                }
              }}
            />
            <button className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
              <File className="w-3 h-3" />
              Upload Local File
            </button>
          </div>
        </div>
      </div>
    );
  }`;

file = file.replace(targetStr, newStr);
fs.writeFileSync('apps/platform/src/components/canvas/DriveFilePicker.tsx', file);
console.log("DriveFilePicker updated with Local Upload bypass for testing.");
