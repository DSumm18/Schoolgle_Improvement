import re

with open("/Users/jarvis/dev/Schoolgle_Improvement/apps/platform/src/components/canvas/DriveFilePicker.tsx", "r") as f:
    content = f.read()

replacement = """      // Convert to File object for the ingest pipeline
      let ext = "";
      if (file.mimeType === "application/vnd.google-apps.spreadsheet") ext = ".csv";
      else if (file.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ext = ".xlsx";
      
      const fileName = file.name.includes(".")
        ? file.name
        : `${file.name}${ext}`;"""

# Replace the old ext logic
start_idx = content.find("      // Convert to File object for the ingest pipeline")
end_idx = content.find("      const fileObj = new globalThis.File([blob], fileName, {")

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + replacement + "\n" + content[end_idx:]
    with open("/Users/jarvis/dev/Schoolgle_Improvement/apps/platform/src/components/canvas/DriveFilePicker.tsx", "w") as f:
        f.write(new_content)
    print("DrivePicker patched successfully")
else:
    print("Could not find boundaries in DrivePicker")
