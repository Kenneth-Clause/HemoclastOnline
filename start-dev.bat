@echo off
echo Starting HemoclastOnline Development Environment...
echo.

echo Checking Docker...
docker --version
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop and ensure it's running
    pause
    exit /b 1
)

echo.
echo Starting services with Docker Compose...
docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 10

echo.
echo Checking service status...
docker-compose ps

echo.
echo Services should be available at:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000
echo - API Documentation: http://localhost:8000/docs
echo.

echo Press any key to view logs...
pause
docker-compose logs -f
