@echo off
chcp 65001 >nul
cd /d "%~dp0"
"runtime\node.exe" server\admin.mjs
if errorlevel 1 goto end
start "" http://127.0.0.1:8787
"runtime\node.exe" server\start.mjs
:end
pause
