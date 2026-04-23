@echo off
taskkill /PID 63672 /F 2>/dev/null
timeout /t 2 /nobreak >/dev/null
npm run dev
