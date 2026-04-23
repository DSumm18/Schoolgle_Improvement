@echo off
echo ============================================
echo   Ed Browser Extension - Quick Setup
echo ============================================
echo.
echo This will install dependencies and start the server.
echo A black window will stay open - that's the server running.
echo.
echo [STEP 1/3] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm install failed. Make sure Node.js is installed.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo.
echo [STEP 2/3] Generating extension icons...
call node generate-icons.js
if %ERRORLEVEL% NEQ 0 (
    echo.
echo WARNING: Icon generation had issues. Installing canvas library...
    call npm install canvas
    call node generate-icons.js
)
echo.
echo [STEP 3/3] Starting Ed's WebSocket server...
echo.
echo ============================================
echo   Server is running! Leave this window open.
echo ============================================
echo.
echo Now go to Chrome and load the extension:
echo   1. Open Chrome
echo   2. Type: chrome://extensions  (press Enter)
echo   3. Toggle "Developer mode" (top right) to ON
echo   4. Click "Load unpacked" (top left)
echo   5. Select THIS folder
echo.
echo When you see the Ed extension icon, click it and press Connect!
echo.
echo Press Ctrl+C to stop the server when done.
echo.
node server.js
pause
