@echo off
chcp 65001 > nul
title Quản Lý Hợp Đồng Bán Hàng Xuất Khẩu - Web App

echo ========================================================
echo   KHỞI ĐỘNG ỨNG DỤNG QUẢN LÝ HỢP ĐỒNG BÁN HÀNG EXPORT
echo ========================================================
echo.

cd /d "%~dp0"

:: Kiểm tra node_modules
if not exist "node_modules\" (
    echo [INFO] Đang cài đặt thư viện cần thiết lần đầu...
    call npm install
    echo.
)

echo [INFO] Đang khởi chạy máy chủ phát triển Vite...
echo [INFO] Tự động mở trình duyệt và bật chế độ chia sẻ qua mạng nội bộ (--host)
echo [TIP]  Bạn có thể dùng điện thoại kết nối cùng mạng Wi-Fi và truy cập vào địa chỉ IP hiển thị bên dưới!
echo.

npm run dev -- --host --open

pause
