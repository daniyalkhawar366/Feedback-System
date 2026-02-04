# Start Backend and Frontend

Write-Host "🚀 Starting Feedback System..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python -m uvicorn main:app --port 8000 --reload"

Start-Sleep -Seconds 3

# Start Frontend  
Write-Host "🎨 Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "✅ Both servers starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Docs:     http://localhost:8000/docs" -ForegroundColor Cyan
