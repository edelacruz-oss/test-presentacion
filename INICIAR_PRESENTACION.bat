@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  py -m http.server 8080
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  python -m http.server 8080
  goto :eof
)
echo.
echo No se encontro Python en el equipo.
echo Puedes abrir index.html directamente, aunque se recomienda usar un servidor local
pause
