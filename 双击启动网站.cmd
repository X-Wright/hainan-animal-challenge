@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js。请先安装 Node.js，或直接打开“海南动物科学知识大挑战-离线版.html”。
  pause
  exit /b 1
)
node scripts/serve.mjs
pause
