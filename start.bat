@echo off
echo ==============================================================================
echo  Starting ColdReach.ai (Unified Frontend + Backend)
echo ==============================================================================
echo.
echo [1/2] Building frontend static bundle...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo [2/2] Launching unified FastAPI server (Serving UI + API together)...
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
