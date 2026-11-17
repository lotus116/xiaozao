@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "runtime\node.exe" (
  echo 运行环境缺失，请完整解压部署包后再试。
  pause
  exit /b 1
)
"runtime\node.exe" server\admin.mjs
if errorlevel 1 (
  echo 初始化失败，请保留错误信息。
  pause
  exit /b 1
)
echo 请保持下面打开的服务窗口与网络窗口运行。
start "Xiaozao Server" cmd /k ""%~dp0runtime\node.exe" "%~dp0server\start.mjs""
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Tunnel.ps1"
pause
