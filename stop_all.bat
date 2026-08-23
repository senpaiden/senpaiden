@echo off
echo ===========================================================
echo  STOPPING ALL SENPAI DEN PROJECT SERVICES
echo ===========================================================
echo.

echo Freeing port 3000 (Next.js)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

echo Services stopped.
