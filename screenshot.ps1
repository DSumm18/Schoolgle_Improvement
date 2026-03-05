Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Wait 3 seconds to allow switching to browser
Write-Host "Switch to your browser with http://localhost:3000/estates-compliance now..."
Write-Host "Capturing in 3 seconds..."
Start-Sleep -Seconds 3

# Capture the primary screen
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)

$outputPath = "C:\Git\Schoolgle_Improvement\screenshots\estates-updated-ux.png"
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Screenshot saved to $outputPath"
Write-Host "File exists: $(Test-Path $outputPath)"
