# Đánh giá Schema C2C Marketplace (MySQL 8.0)

Tổng quan:
- Kiến trúc phân mô-đun đầy đủ (Identity, Shop, Catalog, Orders, Fulfillment, Payments, Ledger, Messaging, Reviews, Promotions, Trust & Safety, Notifications, Analytics).
- Dùng UUID dạng BINARY(16) với UUID_TO_BIN(...,1) tối ưu thứ tự, UTC DATETIME(6), cập nhật updated_at tự động, nhiều FK và index cần thiết, có full-text cho tìm kiếm listing — đều là thực hành tốt.
- Nhiều quan hệ ON DELETE thiết kế hợp lý (CASCADE/RESTRICT/SET NULL), hỗ trợ lịch sử giá và ledger.

Các điều chỉnh/ bổ sung khuyến nghị (ưu tiên cao):
1) Notification templates versioning
- Vấn đề: Chỉ unique theo “code”, khó lưu nhiều phiên bản template.
- Đề xuất: Dùng unique composite (code, version). Index thêm theo (code DESC, version DESC) để truy vấn template mới nhất.

2) Địa chỉ mặc định của người dùng
- Vấn đề: Tồn tại song song default_address_id (ở profile) và is_default (ở addresses) dễ lệch dữ liệu.
- Đề xuất: Chọn một nguồn sự thật:
  - Cách A: Giữ default_address_id ở profile, bỏ is_default ở addresses.
  - Cách B: Giữ is_default ở addresses, bỏ default_address_id. Cần đảm bảo “mỗi user chỉ có 1 địa chỉ mặc định”.
- Nếu vẫn giữ cả hai: thêm FK default_address_id → addresses.id; và ràng buộc nghiệp vụ (trigger/logic) để đảm bảo địa chỉ mặc định thuộc đúng user và duy nhất/ user.

3) Messaging read markers
- Vấn đề: Dùng JSON read_by trong messages khó index/truy vấn hiệu quả.
- Đề xuất: Thêm bảng messaging_read_markers (conversation_id, user_id, last_read_message_id, last_read_at) với PK (conversation_id, user_id). Điều này giúp tính badge/ unread nhanh và index được.

4) Promotions / Vouchers
- Vấn đề: Thiếu ràng buộc thời gian; “per_user_limit” chưa có ràng buộc unique tương ứng; “free_ship” và “value” có thể không đồng nhất.
- Đề xuất:
  - Thêm CHECK (ends_at IS NULL OR ends_at > starts_at).
  - Cân nhắc thêm max_discount, active/disabled, và usage_count (hoặc materialized view) để kiểm quota nhanh.
  - Thêm index tổng hợp (scope, shop_id, starts_at, ends_at, code).
  - Với per_user_limit > 1, thiết kế tích lũy redemption (dựa trên voucher_id, user_id, redeemed_at) và kiểm tra trong logic. Nếu limit = 1, có thể thêm unique (voucher_id, user_id) để enforce cứng.

5) Notification deliveries
- Đề xuất: Thêm index cho (delivery_status, created_at) để dễ xử lý hàng đợi/ truy vấn retry.

6) Reviews và moderation
- Vấn đề: Mặc định “approved” có thể không phù hợp nếu cần duyệt trước.
- Đề xuất: Đặt mặc định “pending” (tùy quy trình). Cân nhắc index (listing_id, status, created_at) cho trang hiển thị và (shop_id, status) phục vụ dashboard người bán.

7) Order returns
- Vấn đề: status ở returns là chuỗi tự do, không đồng nhất với enum ở nơi khác; chưa hạn chế “một return mở cho cùng item”.
- Đề xuất: Dùng ENUM cho status (requested/approved/rejected/refunded/closed), thêm unique logic đảm bảo chỉ có 1 return “open” cho mỗi order_item (bằng trigger hoặc unique trên (order_item_id, is_open) với generated column), và thêm trường resolution/ resolved_at.

8) Catalog listing variants
- Đề xuất: Unique theo (listing_id, variant_sku) để tránh trùng SKU trong cùng listing. Cân nhắc thêm barcode, weight/dimensions cho vận chuyển. Nếu cần bảo toàn thứ tự hiển thị biến thể, thêm sort_order và unique (listing_id, sort_order).

9) Media của listing
- Đề xuất: Thêm is_primary hoặc unique (listing_id, sort_order) để đảm bảo 1 ảnh chính và thứ tự ảnh ổn định. Cân nhắc index/unique content_hash trong phạm vi listing để tránh trùng.

10) Indexing cho tìm kiếm/ lọc
- Catalog:
  - Thêm composite index (category_id, status, moderation_status, price) để lọc theo danh mục + tình trạng + sort theo giá.
  - Index (shop_id, status, updated_at DESC) cho trang cửa hàng.
- Orders:
  - Thêm (buyer_id, created_at DESC) để lịch sử đơn nhanh.
- Payments:
  - Thêm (order_id, status, created_at DESC) phục vụ đối soát và retry.
- Trust & Safety:
  - Thêm (status, created_at DESC) cho hàng đợi duyệt.
- Vouchers:
  - Như trên (scope, shop_id, starts_at, ends_at, code).
- JSON attrs:
  - Nếu lọc theo thuộc tính (ví dụ màu/kích thước), cân nhắc cột generated (virtual/stored) trích xuất từ JSON và index các cột này.

11) Charset/ Collation
- Đề xuất: Gắn DEFAULT CHARSET=utf8mb4 và COLLATE=utf8mb4_0900_ai_ci ở từng bảng để không phụ thuộc cấu hình DB.

12) Soft-delete vs hard-delete
- Nếu dùng soft-delete cho users/listings, cân nhắc đổi một số ON DELETE CASCADE thành RESTRICT/ SET NULL để tránh xóa dây chuyền ngoài ý muốn. Hoặc tách logic xóa cứng chỉ dành cho dữ liệu test/ sandbox.

13) Giỏ hàng, yêu thích, theo dõi shop (tùy roadmap)
- Bổ sung các bảng:
  - carts, cart_items (để mua nhiều đợt).
  - favorites_wishlist (user_id, listing_id).
  - shop_followers (user_id, shop_id).
- Dự phòng inventory: bảng reservations (listing_id/variant_id, qty, expires_at) để chống oversell trong lúc thanh toán.

14) Payments & Idempotency
- Idempotency key đã có theo provider. Cân nhắc tách payment_intents/ payment_charges nếu tích hợp nhiều provider hoặc cần pre-auth vs capture. Logic ứng dụng nên đảm bảo “chỉ 1 bản ghi captured hợp lệ/đơn”.

15) Ledger và đối soát
- Đề xuất bổ sung trigger/ job kiểm tra cân bằng bút toán (tổng debit = tổng credit theo journal). Thêm index (order_id, account_id) để truy vấn theo đơn + tài khoản.

16) Bảo mật & PII
- Đảm bảo email/phone được normalize; có thể thêm cột email_normalized (generated) để index và enforce unique ổn định bất chấp viết hoa/thường/ khoảng trắng. Với phone, chuẩn hóa E.164 ở tầng ứng dụng.

Lưu ý tương thích:
- MySQL 8.0.16+ mới enforce CHECK; bạn đã target 8.0.19+, ổn. Enum thay đổi sẽ cần ALTER; cân nhắc bảng tham chiếu nếu domain thay đổi thường xuyên.

Tóm lại:
- Schema hiện tại rất tốt cho MVP nâng cao. Các bổ sung trên tập trung vào: tính toàn vẹn dữ liệu (FK/unique/enum), hiệu năng truy vấn (index tổng hợp, generated columns cho JSON), tính năng UX (giỏ hàng, wishlist, read markers), và vận hành (voucher/quota, notification versioning, returns/ moderation chặt chẽ, ledger cân đối). Đề xuất bạn duyệt tài liệu này, chọn ưu tiên và mình sẽ tạo patch SQL cụ thể tương ứng.
