@echo off
cd /d "%~dp0"
echo Installing Tailwind CSS v3 + PostCSS + Autoprefixer...
npm install -D tailwindcss@3 postcss autoprefixer
echo.
echo Running build verification...
npm run build
echo.
echo Done!
pause
