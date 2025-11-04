#!/bin/bash

# Script để kiểm tra kết nối API

echo "=== Kiểm tra Backend API ==="
echo ""

# Kiểm tra backend có đang chạy không
echo "1. Kiểm tra backend server..."
curl -s http://localhost:8000/api/products > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Backend đang chạy!"
else
    echo "✗ Backend không chạy. Vui lòng khởi động backend trước."
    echo "   cd backend && python -m uvicorn app.main:app --reload"
    exit 1
fi

echo ""
echo "2. Kiểm tra API Products..."
curl -s http://localhost:8000/api/products | jq '.items | length' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    PRODUCT_COUNT=$(curl -s http://localhost:8000/api/products | jq '.total')
    echo "✓ API Products hoạt động! Tìm thấy $PRODUCT_COUNT sản phẩm"
else
    echo "✗ Không thể kết nối API Products"
fi

echo ""
echo "3. Kiểm tra API Categories..."
curl -s http://localhost:8000/api/categories > /dev/null 2>&1
if [ $? -eq 0 ]; then
    CATEGORY_COUNT=$(curl -s http://localhost:8000/api/categories | jq 'length')
    echo "✓ API Categories hoạt động! Tìm thấy $CATEGORY_COUNT danh mục"
else
    echo "✗ Không thể kết nối API Categories"
fi

echo ""
echo "=== Hoàn thành kiểm tra ==="
