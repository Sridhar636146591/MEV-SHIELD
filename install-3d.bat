@echo off
echo ========================================
echo Installing 3D Dependencies for MEV Detector
echo ========================================
echo.

cd /d "%~dp0mev-detector"

echo Installing Three.js and React Three Fiber...
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing

echo Installing TypeScript types...
npm install --save-dev @types/three

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update App.js to use MEVApp3D component
echo 2. Run: npm start
echo 3. Enjoy the 3D experience!
echo.
pause
