$ErrorActionPreference = 'Stop'
$nilePort = Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue
if ($nilePort) {
    $nilePage = Invoke-WebRequest -Uri 'http://127.0.0.1:4173' -UseBasicParsing
    if ($nilePage.Content -notmatch 'Nile Quest') { throw 'Port 4173 belongs to another app. Please choose another port in package.json.' }
    Write-Output 'Nile Quest is already running: http://127.0.0.1:4173'
    return
}
$nileNode = (Get-Command node -ErrorAction Stop).Source
$nileVite = Join-Path $PSScriptRoot 'node_modules/vite/bin/vite.js'
if (-not (Test-Path -LiteralPath $nileVite)) { throw 'Run npm ci --workspaces=false in this app directory first.' }
Start-Process -FilePath $nileNode -ArgumentList @(('"' + $nileVite + '"'), '--host', '127.0.0.1', '--port', '4173', '--strictPort') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'server-error.log')
Write-Output 'Nile Quest is starting: http://127.0.0.1:4173'
