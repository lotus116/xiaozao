@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 请先关闭服务窗口，再按任意键备份。不要在数据库写入时复制。
pause
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Backup.ps1"
pause
