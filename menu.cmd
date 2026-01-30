@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\tools\menu.ps1"
pause
