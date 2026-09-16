INSERT INTO cities (id, name_vi, name_en, slug, is_active, priority)
VALUES
  (1, 'Hà Nội', 'Hanoi', 'ha-noi', true, 10),
  (2, 'TP. Hồ Chí Minh', 'Ho Chi Minh City', 'ho-chi-minh', true, 20),
  (3, 'Đà Nẵng', 'Da Nang', 'da-nang', true, 30);

INSERT INTO banners (name, placement, slot_number, image_url, target_url, is_enabled, display_order)
VALUES
  ('Banner 1', 'home_top', 1, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200', '/vi/deals', true, 1),
  ('Banner 2', 'home_top', 2, 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200', '/vi/deals', true, 2),
  ('Banner 3', 'home_top', 3, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200', '/vi/deals', true, 3);

INSERT INTO spas (id, name, slug, address, phone, description, province, rating_value, review_count, spa_avatar)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Serenity Spa', 'serenity-spa', '123 Nguyễn Huệ, Q1, TP.HCM', '0901234567', 'Spa cao cấp', 'Hồ Chí Minh', 4.8, 120, 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600'),
  ('22222222-2222-2222-2222-222222222222', 'Zen Massage', 'zen-massage', '456 Lê Lợi, Q3, TP.HCM', '0902345678', 'Massage thư giãn', 'Hồ Chí Minh', 4.6, 85, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600'),
  ('33333333-3333-3333-3333-333333333333', 'Lotus Beauty', 'lotus-beauty', '789 Trần Hưng Đạo, Hà Nội', '0903456789', 'Chăm sóc da', 'Hà Nội', 4.7, 200, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600');

INSERT INTO deals (id, spa_id, city_id, title_vi, title_en, slug_vi, slug_en, short_description_vi, cover_image_url, status, start_at, end_at, currency, discount_percent, is_sold_out, priority_score)
VALUES
  (1, '11111111-1111-1111-1111-111111111111', 2, 'Massage body 90 phút giảm 50%', 'Full body massage 50% off', 'massage-body-90p', 'massage-body-90min', 'Thư giãn toàn thân', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800', 'published', NOW(), NOW() + INTERVAL '30 days', 'VND', '50%', false, 100),
  (2, '22222222-2222-2222-2222-222222222222', 2, 'Facial treatment giảm 40%', 'Facial 40% off', 'facial-40', 'facial-40off', 'Chăm sóc da mặt', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', 'published', NOW(), NOW() + INTERVAL '30 days', 'VND', '40%', false, 90),
  (3, '33333333-3333-3333-3333-333333333333', 1, 'Trị mụn công nghệ cao', 'Acne treatment', 'tri-mun', 'acne-treatment', 'Điều trị mụn', 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=800', 'published', NOW(), NOW() + INTERVAL '30 days', 'VND', '35%', false, 95);
