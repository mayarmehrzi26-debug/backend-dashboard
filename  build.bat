@echo off
echo 🚀 BUILD SAV BALANCES
echo.

echo 📦 1. Build Frontend...
cd sav-balances-frontend
call npm install
call npm run build -- --configuration=production
cd ..
echo ✅ Frontend build OK
echo.

echo 📦 2. Copier frontend vers backend...
if not exist src\main\resources\static mkdir src\main\resources\static
xcopy sav-balances-frontend\dist\sav-balances-frontend\browser\* src\main\resources\static\ /E /I /Y
echo ✅ Copie OK
echo.

echo 📦 3. Build Backend (sans frontend)...
call .\mvnw clean package -DskipTests -Dfrontend.skip=true
echo ✅ Backend build OK
echo.

echo 🎉 BUILD TERMINE !
echo.
echo Pour lancer l'application :
echo java -jar target\*.jar
echo.
pause