# Bảng `deals`

Đầy đủ các cột trong `CREATE TABLE deals`. Cột đánh dấu *(declare-only)* chỉ có trong schema, repo này không đọc/ghi — có thể bên backend khác tạo thêm.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | `bigserial` PK | Khoá chính. |
| `legacy_deal_id` | `uuid` UNIQUE | Không sử dụng , có thể xóa sau này |
| `spa_id` | `uuid` FK → `spas` | Spa sở hữu deal. |
| `category_id` | `bigint` | *(declare-only)* — có thể bên backend khác tạo thêm (FK danh mục). |
| `city_id` / `district_id` / `ward_id` | `bigint` | Đơn vị hành chính, propagate từ `spa_locations`. |
| `place_id` | `bigint` | *(declare-only)* — có thể bên backend khác tạo thêm. |
| `slug_vi` / `slug_en` / `slug_ko` | `varchar(255)` UNIQUE | backend sử dụng và thêm vào |
| `title_vi` / `title_en` / `title_ko` | `varchar(255)` NOT NULL | Tiêu đề deal. |
| `short_description_vi/en/ko` | `text` | Tóm tắt ngắn. |
| `content_vi/en/ko` | `text` | Nội dung chi tiết. |
| `service_info_vi/en/ko` | `text` | Phạm vi dịch vụ áp dụng. |
| `status` | `varchar(20)` | `draft` / `active` / `expired` / `inactive`. |
| `start_at` / `end_at` | `timestamptz` | Hiệu lực deal; `end_at` NULL = không giới hạn. |
| `is_sold_out` | `boolean` default `false` | *(declare-only)* — có thể bên backend khác tạo thêm (cờ hết suất). |
| `cover_image_url` | `text` | *(declare-only)* — có thể bên backend khác tạo thêm (ảnh bìa). |
| `priority_score` | `int` default `0` | *(declare-only)* — có thể bên backend khác tạo thêm (điểm ưu tiên hiển thị). |
| `menu_url` | `text` | Link menu. |
| `website_url` | `text` | Link website. |
| `source` | `text` | `chatbot_extracted`, `scraped`, … |
| `raw_source_url` | `text` | URL nguồn gốc (post FB, web…). |
| `currency` | `varchar(10)` default `VND` | Đơn vị tiền tệ. |
| `service_tags` | `text[]` | Mảng nhãn dịch vụ. |
| `created_at` / `updated_at` | `timestamptz` | Audit. |

Giá thực tế (`original_price`, `sale_price`) **không** nằm trong `deals`, mà ở `deal_variant_prices` (qua `deal_variants`). View `v_deals_read_model` join sẵn để code legacy đọc theo schema cũ.
