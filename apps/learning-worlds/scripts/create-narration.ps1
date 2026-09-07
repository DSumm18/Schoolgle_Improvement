$ErrorActionPreference = 'Stop'
$appDirectory = Split-Path -Parent $PSScriptRoot
Push-Location $appDirectory
try {
    node --input-type=module -e "import {missions} from './src/content.js'; import {controlNarration} from './src/controls-content.js'; import fs from 'node:fs'; fs.writeFileSync('scripts/narration.json', JSON.stringify([...missions.map(m=>({file:m.type,text:m.intro})),...Object.entries(controlNarration).map(([device,text])=>({file:'controls-'+device,text}))],null,2));"
    if ($LASTEXITCODE -ne 0) { throw 'Could not read the mission narration.' }
    Add-Type -AssemblyName System.Speech
    $nileVoice = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $nileVoice.SelectVoice('Microsoft Hazel Desktop')
    $nileVoice.Rate = -1
    foreach ($line in (Get-Content -LiteralPath 'scripts/narration.json' -Raw | ConvertFrom-Json)) {
        $audioPath = Join-Path $appDirectory ('public/audio/' + $line.file + '.wav')
        $nileVoice.SetOutputToWaveFile($audioPath)
        $nileVoice.Speak($line.text)
    }
    $nileVoice.Dispose()
    Write-Output 'Mission and controls narration files generated locally.'
} finally { Pop-Location }
