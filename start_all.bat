@echo off
echo ===========================================================
echo  STARTING ALL SENPAI DEN PROJECT SERVICES
echo ===========================================================
echo.

cd /d "%~dp0"
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [Docker] Starting MinIO and Worker containers...
    docker compose up -d
)

cd /d "%~dp0frontend"
echo [Frontend] Starting Next.js Dev Server on http://localhost:3000 ...
npm run dev
