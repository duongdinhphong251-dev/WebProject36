# Quy tắc Flash Sale (Backend)

Tài liệu này mô tả rule hiện tại để lấy dữ liệu flash sale cho:
- `GET /api/v1/deals/flash-sale` (block flash trên Home)
- `GET /api/v1/pages/resolve?url=flash-sale` (hub flash-sale, list theo spa)

Code chính: `src/modules/deals/deals.service.ts` (`resolveFlashSaleWindow()`, `getFlashSale()`, `getDeals()`).

---

## 1) Bảng và cột DB được dùng

### `deals`
- `id` (PK)
- `spa_id` (group theo spa)
- `status` (chỉ lấy `active`)
- `start_at`, `end_at` (khung timestamp fallback + countdown fallback)
- `discount_percent` (xếp hạng deep discount)
- `title_vi`, `title_en`, `title_ko`, `cover_image_url`, `currency`
- `city_id`, `district_id`

### `deal_time_slots`
- `variant_id`
- `day_of_week`
- `start_time`, `end_time` (khung giờ trong ngày)
- `is_active`

### `deal_variants`
- `id`
- `deal_id`
- `is_active`

### `deal_variant_prices`
- `variant_id`
- `sale_price`, `original_price`
- `is_active`

### `spas`
- `id`
- `name`
- `rating_value`, `review_count`
- `photos`, `spa_avatar` (logo/avatar)
- `latitude`, `longitude`

### `cities`
- `id`
- `name_vi`

---

## 2) Rule lọc Flash Sale (window hiện tại)

## Ưu tiên 1: theo `deal_time_slots`
1. Lấy slot theo **ngày trong tuần hiện tại**:
   - `deal_time_slots.day_of_week = now.getDay()`
   - `deal_time_slots.is_active = true`
   - `start_time <= currentTime <= end_time`
2. Chỉ nhận slot có độ dài trong khoảng:
   - `60 <= duration_minutes <= 120`
   - hằng số: `FLASH_APPLICABLE_MIN_MINUTES = 60`, `FLASH_APPLICABLE_MAX_MINUTES = 120`
3. Nhóm theo cùng cặp `(start_time, end_time)`.
4. Chọn nhóm có nhiều `variant_id` nhất.
5. Map `variant_id -> deal_id` qua `deal_variants` với `deal_variants.is_active = true`.

## Fallback: theo `deals.start_at/end_at`
Nếu không có slot hợp lệ:
1. Lọc deal:
   - `deals.status = 'active'`
   - `deals.start_at IS NOT NULL`, `deals.end_at IS NOT NULL`
   - `deals.start_at <= NOW() <= deals.end_at`
2. Chỉ nhận deal có thời lượng:
   - `60 <= (end_at - start_at) <= 120` phút
3. Nhóm theo cùng `(start_at, end_at)`, chọn nhóm có nhiều deal nhất.

---

## 3) Rule đếm và sắp xếp

## Đếm ngược (countdown)
- Countdown dùng **kết thúc khung chung** (`windowEndsAt`), không dùng từng deal riêng lẻ.
- Giá trị trả về API:
  - `endsAt` (ISO)
  - `countdownSeconds = max(0, floor((endsAt - now) / 1000))`
- Có thêm:
  - `startsAt` (ISO)
  - `windowLabel` (vd `21:00–22:00`)
  - `applicableDurationMinutes`

## “Top deep discount”
Áp dụng cho `getFlashSale()` (Home):
1. Trong cùng khung vừa chọn, group theo `spa_id`.
2. Mỗi spa giữ **1 deal** có `discount_percent` cao nhất.
3. Sắp xếp spa giảm dần theo `% discount`.
4. Cắt top N:
   - `FLASH_HOME_TOP_SPAS = 10`

## Hub `/flash-sale` (page resolve)
- `pages.resolve(url=flash-sale)` set `flash_sale_only=true` khi gọi `getDeals()`.
- `getDeals()` lọc theo cùng `dealIds` thuộc khung flash hiện tại.
- Vẫn group theo spa và lấy tối đa 2 deal/spa theo rule listing.

---

## 4) Trường hợp hết giờ

- Khi `now > windowEndsAt`:
  - API flash trả `countdownSeconds = 0` hoặc không còn deal active trong khung mới.
  - FE gọi refresh/reload để lấy khung mới.

---

## 5) Ghi chú seed/test nhanh

Để ép có dữ liệu flash trên Home:
- Script: `scripts/seed-flash-sale-home.mjs`
- Lệnh: `npm run seed:flash-home`
- Script sẽ update một nhóm deal active về cùng khung `start_at/end_at` quanh thời điểm hiện tại.
