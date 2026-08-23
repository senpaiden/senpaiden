# Senpai Den - Master Stop Script (PowerShell)
Write-Host "===========================================================" -ForegroundColor Red
Write-Host " STOPPING ALL SENPAI DEN SERVICES" -ForegroundColor Red
Write-Host "===========================================================" -ForegroundColor Red

$ports = @(3000, 4000, 7860, 8787)
foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($pidToKill in $processes) {
            Write-Host "Killing process $pidToKill on port $port..." -ForegroundColor Yellow
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "All services stopped." -ForegroundColor Green
