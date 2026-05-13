export function buildStyledTemplateExcelHtml({
  title,
  guidance,
  tip,
  descriptions,
  headers,
  rows,
}: {
  title: string;
  guidance: string;
  tip: string;
  descriptions: string[];
  headers: string[];
  rows: string[][];
}) {
  const rowCount = headers.length;
  const templateRows = [descriptions, headers, ...rows];

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Aptos, Arial, sans-serif; color: #0f172a; }
    table { border-collapse: collapse; }
    td { border: 1px solid #dbe3ef; padding: 8px 10px; mso-number-format: "\\@"; vertical-align: top; }
    .title td { background: #0f766e; color: #ffffff; font-size: 18px; font-weight: 700; border-color: #0f766e; }
    .subtitle td { background: #ecfdf5; color: #065f46; font-weight: 600; border-color: #a7f3d0; }
    .note td { background: #fff7ed; color: #9a3412; font-weight: 600; border-color: #fed7aa; }
    .description td { background: #f8fafc; color: #334155; font-style: italic; }
    .header td { background: #1e3a8a; color: #ffffff; font-weight: 700; }
    .example td { background: #ffffff; }
  </style>
</head>
<body>
  <table>
    <tr class="title"><td colspan="${rowCount}">${escapeHtml(title)}</td></tr>
    <tr class="subtitle"><td colspan="${rowCount}">${escapeHtml(guidance)}</td></tr>
    <tr class="note"><td colspan="${rowCount}">${escapeHtml(tip)}</td></tr>
    ${templateRows.map((row, index) => `<tr class="${index === 0 ? "description" : index === 1 ? "header" : "example"}">${row
      .map((value) => `<td>${escapeHtml(value)}</td>`)
      .join("")}</tr>`).join("\n")}
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
