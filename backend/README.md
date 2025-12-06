# Furniture Store Backend (FastAPI)

## Tổng quan

Backend cho hệ thống thương mại điện tử chuyên ngành nội thất, xây dựng theo kiến trúc **modular monolith** trên nền tảng **FastAPI** và **PostgreSQL**. Mã nguồn được tổ chức theo từng module chức năng (users, products, orders, inventory, payments, rewards, cart) giúp dễ dàng mở rộng, bảo trì và triển khai. Ứng dụng hỗ trợ đầy đủ các nghiệp vụ cốt lõi: xác thực (JWT + Google OAuth2), RBAC linh hoạt, quản lý sản phẩm/tồn kho, giỏ hàng – đơn hàng, tích hợp thanh toán đa cổng (thiết kế dạng plugin có fallback), chương trình điểm thưởng và voucher.

## Công nghệ chính

- Python 3.11, FastAPI, Uvicorn
- SQLAlchemy 2.0, Alembic migrations
- PostgreSQL 15, pgAdmin
- JWT Authentication (python-jose), OAuth2 Google (httpx)
- Docker & Docker Compose

## Cấu trúc thư mục chính

```
app/
  core/         # cấu hình, database, security
  users/        # auth, RBAC, quản lý người dùng & địa chỉ
  products/     # sản phẩm, danh mục, tags
  cart/         # giỏ hàng
  orders/       # đơn hàng, xử lý đặt mua & trạng thái
  inventory/    # nhà cung cấp, phiếu nhập kho
  payments/     # models + router + kiến trúc plugin gateway
  rewards/      # điểm thưởng, voucher, lịch sử giao dịch
  schemas/      # base schema dùng chung
alembic/        # cấu hình migrations (env.py, versions/)
Dockerfile
docker-compose.yml
.env.example
requirements.txt
README.md
```

## Chuẩn bị môi trường cục bộ

1. **Cài đặt phụ thuộc** (khuyến nghị dùng virtualenv):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
2. **Tạo file `.env`** dựa trên `.env.example` rồi cập nhật thông tin thực tế:
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`, `JWT_REFRESH_SECRET_KEY`
   - Thông số Google OAuth2 (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`)
   - Cấu hình loyalty (tỷ lệ tích điểm, mệnh giá voucher, …)
3. **Khởi chạy FastAPI**:
   ```bash
   uvicorn app.main:app --reload
   ```
   Tài liệu OpenAPI: `http://localhost:8000/api/docs`

## Triển khai với Docker

```bash
docker compose up --build
```

- Service `api`: chạy FastAPI + Uvicorn (hot reload, cổng 8000)
- Service `db`: PostgreSQL 15 (cổng 5432)
- Service `pgadmin`: quản trị database (cổng 8080)

> Lưu ý: cập nhật `.env` trước khi chạy docker compose để API kết nối đúng tới database trong container.

## Quản lý database

- Tạo migration mới:
  ```bash
  alembic revision --autogenerate -m "Add new tables"
  ```
- Apply migration:
  ```bash
  alembic upgrade head
  ```

Alembic sử dụng `app.core.database.Base.metadata` nên cần đảm bảo import đủ model trong `app/core/models.py` trước khi autogenerate.

## Module & API chính

- **Auth & Users (`/api/auth`, `/api/users`)**
  - Đăng ký nội bộ (JWT), đăng nhập, refresh token
  - Google OAuth2 callback (trả về JWT + flag người dùng mới)
  - RBAC dựa trên role động (root/admin/staff/customer)
  - Quản lý người dùng & vai trò, địa chỉ nhận hàng
- **Products (`/api/products`)**
  - CRUD sản phẩm, danh mục, tag (admin)
  - Lọc, tìm kiếm, gợi ý autocomplete (public)
  - Quản lý ảnh sản phẩm (metadata lưu DB, file để trong `static/images/`)
- **Cart (`/api/cart`)**
  - Thêm/sửa/xóa sản phẩm trong giỏ, làm trống giỏ (yêu cầu đăng nhập)
- **Orders (`/api/orders`)**
  - Tạo đơn từ giỏ hàng, tự động trừ tồn kho, áp dụng voucher/điểm thưởng
  - Cơ chế thanh toán fallback qua module `payments` (plugin gateway)
  - Cập nhật trạng thái đơn, hủy đơn, dashboard admin
- **Inventory (`/api/inventory`)**
  - Quản lý nhà cung cấp, phiếu nhập kho, cập nhật tồn
- **Payments (`/api/payments`)**
  - Kiến trúc gateway dạng plugin, mô phỏng sẵn các cổng MoMo, ZaloPay, VNPay, Google Pay & COD
  - REST API webhook callback cho từng gateway (cần bổ sung chữ ký bảo mật khi tích hợp thực)
- **Rewards (`/api/rewards`)**
  - Dashboard điểm thưởng, lịch sử giao dịch
  - Redeem điểm đổi voucher, áp dụng điểm khi đặt hàng

Mỗi module có `models.py`, `schemas.py`, `services.py`, `routes.py` riêng để tách bạch tầng ORM – business – API.

## RBAC & Bảo mật

- JWT Access/Refresh token, grant type password theo OAuth2
- Dependency `require_roles()` kiểm tra quyền động (root bypass mọi kiểm tra)
- Token chứa danh sách role để tiện phân quyền phía client nếu cần
- Google OAuth2: sử dụng `httpx` gọi token exchange + userinfo; cần cấu hình redirect URL chính xác trên Google Cloud Console

## Thanh toán & Fallback Strategy

- `app/payments/services/__init__.py` định nghĩa interface `PaymentGateway` và cơ chế đăng ký gateway
- `SimulatedOnlineGateway` mô phỏng link thanh toán (cần thay bằng tích hợp thực: MoMo/ZaloPay/VNPay/Google Pay)
- Hàm `initiate_with_fallback` thử lần lượt gateway ưu tiên -> fallback nếu thất bại; luôn ghi log Payment vào DB (trạng thái pending/failed/success)
- Callback endpoint cập nhật trạng thái Payment và Order (cần bổ sung xác thực chữ ký, mã hóa theo chuẩn cổng thanh toán khi triển khai thực tế)

## Điểm thưởng & Voucher

- Quy tắc tích điểm: `order_total * REWARD_POINT_RATE`
- Quy tắc quy đổi: `POINTS_PER_VOUCHER` điểm đổi `VOUCHER_VALUE` VND (config trong `.env`)
- Khi đặt hàng: có thể sử dụng điểm (tự động trừ toàn bộ gói voucher phù hợp) và/hoặc nhập voucher code
- Khi hủy đơn: hoàn lại tồn kho + refund điểm đã sử dụng

## Công việc tiếp theo đề xuất

1. Viết test (pytest) cho từng module, đặc biệt các flow quan trọng: đăng ký/đăng nhập, tạo đơn hàng, thanh toán, tích điểm.
2. Hoàn thiện tích hợp thực tế cho các cổng thanh toán (SDK, chữ ký, webhook).
3. Bổ sung cơ chế refresh token (endpoint riêng), logout, chính sách đặt lại mật khẩu.
4. Bổ sung rate limiting, logging tập trung, tracing (OpenTelemetry) cho môi trường production.
5. Tách file static sang CDN hoặc S3, sử dụng reverse proxy (Nginx) phục vụ file tĩnh.

## Tài khoản Admin mặc định

Email: admin2@gmail.com
Password: Admin123

netstat -aon | findstr ":5432"
tasklist /fi "PID eq 10168"
docker-compose up -d

IID Email Họ tên Vai trò Mật khẩu
18 root@gmail.com Root Administrator root Password123
19 admin@gmail.com Admin User admin Password123
20 manager@gmail.com Business Manager manager Password123
21 staff@gmail.com Staff Member staff Password123
22 customer@example.com John Customer customer Password123
