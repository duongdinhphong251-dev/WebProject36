-- 8 nhóm dịch vụ chính (Main Service Hubs)
INSERT INTO services (id, code, name_vi, name_en, name_ko, slug_vi, slug_en, slug_ko, slug_global, is_active, sort_order)
VALUES
  (1, 'massage-spa', 'Massage & Spa', 'Massage & Spa', '마사지 & 스파', 'massage-spa', 'massage-spa', 'masaji-seupa', 'massage-spa', true, 1),
  (2, 'beauty-hair', 'Làm đẹp & Tóc', 'Beauty & Hair', '뷰티 & 헤어', 'lam-dep', 'beauty-hair', 'byuti-he-eo', 'beauty-hair', true, 2),
  (3, 'food-drink', 'Ăn uống', 'Food & Drink', '맛집 & 카페', 'an-uong', 'food-drink', 'matjib-kape', 'food-drink', true, 3),
  (4, 'tours', 'Tour & Trải nghiệm', 'Tours & Experiences', '투어 & 액티비티', 'tour-trai-nghiem', 'tours-experiences', 'tueo-aegtibiti', 'tours', true, 4),
  (5, 'transport', 'Di chuyển', 'Transport', '교통 & 이동', 'di-chuyen', 'transport', 'gyotong-idong', 'transport', true, 5),
  (6, 'stay', 'Lưu trú', 'Stay', '숙소', 'luu-tru', 'stay', 'sugso', 'stay', true, 6),
  (7, 'health', 'Sức khỏe & Y tế', 'Health & Medical', '건강 & 의료', 'suc-khoe-y-te', 'health-medical', 'geongang-uiryo', 'health', true, 7),
  (8, 'essentials', 'Tiện ích du lịch', 'Travel Essentials', '여행 편의시설', 'tien-ich-du-lich', 'travel-essentials', 'yeohaeng-pyeon-ui-siseol', 'essentials', true, 8)
ON CONFLICT (id) DO UPDATE SET
  name_vi = EXCLUDED.name_vi,
  name_en = EXCLUDED.name_en,
  name_ko = EXCLUDED.name_ko,
  slug_vi = EXCLUDED.slug_vi,
  slug_en = EXCLUDED.slug_en,
  slug_ko = EXCLUDED.slug_ko,
  slug_global = EXCLUDED.slug_global,
  is_active = true;

-- Gán dịch vụ Massage & Spa cho các Spa mẫu
INSERT INTO spa_services (spa_id, service_id)
VALUES
  ('11111111-1111-1111-1111-111111111111', 1),
  ('22222222-2222-2222-2222-222222222222', 1),
  ('33333333-3333-3333-3333-333333333333', 1)
ON CONFLICT DO NOTHING;

-- Cập nhật status thành active và gán category_id cho các Deals mẫu
UPDATE deals SET status = 'active', category_id = 1;
