# Senpai Den - Master Startup Script (PowerShell)
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " STARTING ALL SENPAI DEN PROJECT SERVICES" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $ScriptDir

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "🐳 Starting Docker MinIO and Worker containers..." -ForegroundColor Yellow
    docker compose up -d
}

Set-Location -Path "$ScriptDir\frontend"

Write-Host "🚀 Starting Frontend Next.js Server on http://localhost:3000..." -ForegroundColor Green
npm run dev
