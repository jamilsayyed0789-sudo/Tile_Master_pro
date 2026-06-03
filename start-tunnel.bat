@echo off
REM Start backend
cd /d "%~dp0backend"
start "" /B ".\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

REM Start frontend
cd /d "%~dp0frontend"
start "" /B cmd /c "npx next dev --hostname 0.0.0.0 --port 3000"

REM Wait for servers
timeout /t 5 /nobreak >nul

REM Start bore tunnel for frontend
echo Starting bore tunnel for frontend (port 3000)...
start "" /B cmd /c "npx bore local 3000 --to bore.pub"

REM Start bore tunnel for backend  
echo Starting bore tunnel for backend (port 8001)...
start "" /B cmd /c "npx bore local 8001 --to bore.pub"

echo.
echo ============================================
echo Servers and tunnels starting...
echo.
echo Check the tunnel windows for public URLs.
echo Frontend URL: http://localhost:3000
echo.
echo Share the public URL with your phone!
echo ============================================
pause
