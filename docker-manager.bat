@echo off
REM Script quản lý Docker cho dự án TMDT

echo ========================================
echo     Furniture Store - Docker Manager
echo ========================================
echo.

:menu
echo Chọn một tùy chọn:
echo.
echo 1. Khởi động containers (docker-compose up -d)
echo 2. Dừng containers (docker-compose stop)
echo 3. Dừng và xóa containers (docker-compose down)
echo 4. Xem logs
echo 5. Rebuild và khởi động lại
echo 6. Reset hoàn toàn (xóa cả dữ liệu)
echo 7. Kiểm tra trạng thái
echo 8. Chạy migrations
echo 9. Truy cập shell của API container
echo 0. Thoát
echo.

set /p choice="Nhập lựa chọn (0-9): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto down
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto rebuild
if "%choice%"=="6" goto reset
if "%choice%"=="7" goto status
if "%choice%"=="8" goto migrate
if "%choice%"=="9" goto shell
if "%choice%"=="0" goto end
goto menu

:start
echo.
echo Đang khởi động containers...
cd backend
docker-compose up -d
echo.
echo Hoàn thành! API đang chạy tại http://localhost:8000
echo API Docs: http://localhost:8000/api/docs
pause
goto menu

:stop
echo.
echo Đang dừng containers...
cd backend
docker-compose stop
echo Hoàn thành!
pause
goto menu

:down
echo.
echo Đang dừng và xóa containers...
cd backend
docker-compose down
echo Hoàn thành!
pause
goto menu

:logs
echo.
echo Đang xem logs (Ctrl+C để thoát)...
cd backend
docker-compose logs -f
pause
goto menu

:rebuild
echo.
echo Đang rebuild và khởi động lại...
cd backend
docker-compose up -d --build
echo Hoàn thành!
pause
goto menu

:reset
echo.
echo CẢNH BÁO: Thao tác này sẽ xóa TOÀN BỘ dữ liệu!
set /p confirm="Bạn có chắc chắn? (y/n): "
if /i "%confirm%"=="y" (
    cd backend
    docker-compose down -v
    docker-compose up -d --build
    echo Hoàn thành! Database đã được reset.
) else (
    echo Đã hủy.
)
pause
goto menu

:status
echo.
echo Trạng thái containers:
cd backend
docker-compose ps
echo.
echo Chi tiết containers:
docker ps --filter "name=furniture"
pause
goto menu

:migrate
echo.
echo Đang chạy migrations...
cd backend
docker-compose exec api alembic upgrade head
echo Hoàn thành!
pause
goto menu

:shell
echo.
echo Truy cập shell của API container (gõ 'exit' để thoát)...
cd backend
docker-compose exec api bash
pause
goto menu

:end
echo.
echo Tạm biệt!
exit
