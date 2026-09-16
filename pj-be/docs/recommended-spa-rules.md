# Quy tắc lấy Spa đề xuất (Home)

Tài liệu này mô tả rule hiện tại để lấy dữ liệu cho:
- `GET /api/v1/spas/recommended`

Code chính: `src/modules/spas/spas.service.ts` (`getRecommendedSpas()`).

---

## 1) Mục tiêu business

- Ưu tiên **spa có đánh giá cao**.
- Nếu người dùng **chia sẻ vị trí** (`lat/lng`), ưu tiên **spa gần người dùng** trước.
- Trong trường hợp khoảng cách gần tương đương, ưu tiên spa có chất lượng tốt hơn (rating/review).

---

## 2) Input API

- `lat` (optional)
- `lng` (optional)
- `limit` (optional, mặc định 10, max 50)
- `radiusKm` (optional, mặc định ~1200km, min 100, max 3000 trong service)

`hasGeo = true` khi `lat/lng` là số hợp lệ.

---

## 3) Bảng và cột DB dùng

### `spas`
- `id`, `slug`, `name`
- `rating_value`, `review_count`
- `photos`, `spa_avatar`
- `latitude`, `longitude`

### `spa_locations`
- `spa_id`, `city_id`
- `is_primary`

### `cities`
- `id`, `name_vi`

### `deals`
- `spa_id`, `status`
- dùng để đếm `activeDealCount` (status = `active`)

---

## 4) Rule query và sort

## Trường hợp A — Không có vị trí người dùng

1. Query danh sách spa + city + số deal active.
2. Sort mặc định:
   - `rating_value` giảm dần
   - tie-break: `review_count` giảm dần
3. Trả về `limit` phần tử đầu.

## Trường hợp B — Có vị trí người dùng (`lat/lng`)

1. Lọc ứng viên theo bbox quanh user (từ `radiusKm`) và yêu cầu có tọa độ spa.
2. Tính `distanceKm` bằng Haversine cho từng spa.
3. Chỉ giữ spa tính được khoảng cách.
4. Sort theo thứ tự:
   1) `distanceKm` tăng dần (gần hơn đứng trước)  
   2) tie-break: `rating_value` giảm dần  
   3) tie-break tiếp: `review_count` giảm dần
5. Trả về `limit` phần tử đầu.

---

## 5) Trường dữ liệu trả về

`RecommendedSpaDto`:
- `id`, `slug`, `name`
- `ratingValue`, `reviewCount`
- `photoName`, `spaAvatarUrl`
- `cityName`
- `activeDealCount`
- `distanceKm` (chỉ meaningful khi có `lat/lng`)

---

## 6) Ghi chú

- Khi có geo, “gần” là tiêu chí chính để cá nhân hóa theo vị trí user.
- “Đánh giá cao” luôn được dùng làm tiêu chí chính khi không có geo, và là tie-break khi có geo.
