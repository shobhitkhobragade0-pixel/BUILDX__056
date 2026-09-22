@echo off
echo ===================================================
echo   LIFELINK NAGPUR - Starting Fullstack Prototype
echo ===================================================

echo [1/2] Launching Backend Server on port 5000...
start cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend on port 5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo Application launched!
echo Open your browser at: http://localhost:5173
echo ===================================================
