@echo off
title Remix 3D Studio - Local Server
cls
echo ========================================================
echo        REMIX 3D STUDIO - LOCAL DEV SERVER
echo ========================================================
echo.
echo Launching local development server on http://localhost:5174 ...
echo Phone link: http://192.168.0.22:5174
echo.

npx vite --host=0.0.0.0 --port=5174

pause
