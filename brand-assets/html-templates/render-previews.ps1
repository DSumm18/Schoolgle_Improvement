$ErrorActionPreference = "Stop"

$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)

$browser = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
  throw "Could not find Chrome or Edge in the standard Windows install paths."
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $root "previews"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$templates = @("letterhead", "proposal", "invoice", "meeting-notes", "email-signature")

foreach ($name in $templates) {
  $html = Join-Path $root "$name.html"
  $png = Join-Path $out "$name.png"
  $pdf = Join-Path $out "$name.pdf"
  $url = "file:///" + ($html -replace "\\", "/")

  & $browser --headless=new --disable-gpu --hide-scrollbars --window-size=1400,1200 --screenshot="$png" "$url" | Out-Null
  & $browser --headless=new --disable-gpu --print-to-pdf="$pdf" "$url" | Out-Null

  Write-Output "Rendered $name"
}
