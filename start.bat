@echo off
title FinSight AI Launcher
echo ===================================================
echo           Starting FinSight AI Platform
echo ===================================================
echo.
echo 1. Starting FastAPI Backend (Port 8000)...
start "FinSight AI - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

echo 2. Starting Vite Frontend (Port 3000)...
start "FinSight AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo FinSight AI is running!
echo - Frontend:  http://localhost:3000
echo - Backend:   http://localhost:8000
echo - Swagger:   http://localhost:8000/docs
echo ===================================================
timeout /t 3 >nul
start http://localhost:3000
