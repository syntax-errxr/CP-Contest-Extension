# CP Extension Dev Services Launcher
# Run this script in PowerShell to boot up the backend and frontend servers.

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         CP EXTENSION DEVELOPMENT LAUNCHER" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Express Backend in a new window
Write-Host "[1/2] Launching Express Backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# 2. Start Vite Frontend Dev Server in a new window
Write-Host "[2/2] Launching React Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "All processes started in separate windows!" -ForegroundColor Green
Write-Host "- Backend API: http://localhost:8000" -ForegroundColor Green
Write-Host "- Swagger Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "To load the Chrome Extension:" -ForegroundColor White
Write-Host "1. Run 'npm run build' inside `/frontend` to package" -ForegroundColor White
Write-Host "2. Open chrome://extensions/ in Chrome" -ForegroundColor White
Write-Host "3. Turn on 'Developer mode' (top-right)" -ForegroundColor White
Write-Host "4. Click 'Load unpacked' and select '/frontend/dist' folder" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
