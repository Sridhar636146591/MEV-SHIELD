@echo off
echo ========================================================
echo           Starting MEV Detector Servers
echo ========================================================

echo [1/2] Starting backend server on port 3001...
cd /d "%~dp0server"
start "MEV Backend Server (Port 3001)" cmd /k "npm start"

timeout /t 3 >nul

echo [2/2] Starting frontend React dashboard on port 3000...
cd /d "%~dp0mev-detector"
start "MEV Frontend Dashboard (Port 3000)" cmd /k "npm start"

echo.
echo ========================================================
echo Servers launched in separate command windows!
echo - Frontend Dashboard: http://localhost:3000
echo - Backend API:        http://localhost:3001
echo - Backend Health:     http://localhost:3001/api/health
echo ========================================================
pause
