-- ==============================================================================
-- BỔ SUNG DỮ LIỆU ĐẦY ĐỦ CHO TẤT CẢ 8 NHÓM DỊCH VỤ CHÍNH
-- ==============================================================================

-- 1. Thêm các Spa / Cơ sở dịch vụ mới
INSERT INTO spas (id, name, slug, address, phone, description, province, rating_value, review_count, spa_avatar)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'Tokyo Hair Salon & Academy', 'tokyo-hair-salon', '88 Pasteur, Bến Nghé, Quận 1, TP.HCM', '0912345601', 'Salon làm tóc chuẩn phong cách Nhật Bản, chuyên uốn nhuộm phục hồi.', 'Hồ Chí Minh', 4.9, 156, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600'),
  ('55555555-5555-5555-5555-555555555555', 'Seoul Nail & Eyelash Art', 'seoul-nail-eyelash', '52 Hàng Bài, Hoàn Kiếm, Hà Nội', '0912345602', 'Chuyên làm móng nghệ thuật, nối mi tự nhiên cao cấp Hàn Quốc.', 'Hà Nội', 4.8, 94, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600'),
  ('66666666-6666-6666-6666-666666666666', 'Hương Xưa Restaurant & Lounge', 'huong-xua-restaurant', '24 Bạch Đằng, Hải Châu, Đà Nẵng', '0912345603', 'Nhà hàng ẩm thực Việt truyền thống view sông Hàn lãng mạn.', 'Đà Nẵng', 4.7, 210, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'),
  ('77777777-7777-7777-7777-777777777777', 'The Coffee Garden Roastery', 'the-coffee-garden', '15 Hàn Thuyên, Bến Nghé, Quận 1, TP.HCM', '0912345604', 'Không gian cà phê xanh mát, cà phê specialty rang xay thủ công.', 'Hồ Chí Minh', 4.6, 142, 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600'),
  ('88888888-8888-8888-8888-888888888888', 'Danang Discovery Tours', 'danang-discovery-tours', '102 Nguyễn Văn Linh, Đà Nẵng', '0912345605', 'Đơn vị tổ chức tour trải nghiệm Bà Nà Hills, Cù Lao Chàm, Ngũ Hành Sơn hàng đầu.', 'Đà Nẵng', 4.9, 320, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600'),
  ('99999999-9999-9999-9999-999999999999', 'Hanoi Street Food & Cooking Class', 'hanoi-food-tour', '18 Mã Mây, Hàng Buồm, Hoàn Kiếm, Hà Nội', '0912345606', 'Khám phá ẩm thực 36 phố phường và tham gia lớp nấu món ăn truyền thống.', 'Hà Nội', 4.8, 180, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VIP Airport Limousine', 'vip-airport-limousine', 'Sân bay Tân Sơn Nhất, Quận Tân Bình, TP.HCM', '0912345607', 'Dịch vụ xe Limousine đưa đón sân bay riêng tư, ghế mát-xa, tài xế chuyên nghiệp.', 'Hồ Chí Minh', 4.9, 260, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Green Car Rental Hanoi', 'green-car-rental-hanoi', '35 Võ Chí Công, Tây Hồ, Hà Nội', '0912345608', 'Cho thuê xe ô tô tự lái và xe du lịch đời mới giá ưu đãi.', 'Hà Nội', 4.7, 115, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Son Tra Beachfront Villa & Resort', 'son-tra-resort', 'Hoàng Sa, Thọ Quang, Sơn Trà, Đà Nẵng', '0912345609', 'Resort nghỉ dưỡng ven biển bán đảo Sơn Trà, hồ bơi vô cực và buffet sáng.', 'Đà Nẵng', 4.9, 410, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Old Quarter Boutique Hotel', 'old-quarter-boutique', '22 Hàng Bè, Hàng Bạc, Hoàn Kiếm, Hà Nội', '0912345610', 'Khách sạn boutique đậm phong cách Indochine ngay trung tâm phố cổ.', 'Hà Nội', 4.8, 175, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Smile Dental Clinic & Care', 'smile-dental-clinic', '210 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', '0912345611', 'Nha khoa thẩm mỹ chuẩn quốc tế, tẩy trắng răng Laser và chăm sóc nụ cười.', 'Hồ Chí Minh', 4.8, 130, 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'International Wellness Clinic', 'international-wellness-clinic', '45 Liễu Giai, Ba Đình, Hà Nội', '0912345612', 'Phòng khám đa khoa và trị liệu phục hồi sức khỏe chuyên sâu.', 'Hà Nội', 4.7, 88, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600'),
  ('10101010-1010-1010-1010-101010101010', 'VN Telecom & eSIM Station', 'vn-telecom-esim', 'Ga Quốc Tế, Sân bay Tân Sơn Nhất, TP.HCM', '0912345613', 'Cung cấp eSIM 4G/5G du lịch tốc độ cao không giới hạn dữ liệu tại Việt Nam.', 'Hồ Chí Minh', 4.9, 240, 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600'),
  ('20202020-2020-2020-2020-202020202020', 'Speedy Luggage & Currency Hub', 'speedy-luggage-hub', '15 Trần Phú, Hải Châu, Đà Nẵng', '0912345614', 'Điểm gửi hành lý an toàn, đổi ngoại tệ tỷ giá tốt và tiện ích du khách.', 'Đà Nẵng', 4.8, 110, 'https://images.unsplash.com/photo-1553531384-411a247ccd73?w=600')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  address = EXCLUDED.address,
  province = EXCLUDED.province,
  rating_value = EXCLUDED.rating_value,
  review_count = EXCLUDED.review_count,
  spa_avatar = EXCLUDED.spa_avatar;

-- 2. Thêm địa điểm và liên kết dịch vụ
INSERT INTO spa_locations (id, spa_id, city_id, address_line, is_primary, is_active)
VALUES
  (4, '44444444-4444-4444-4444-444444444444', 2, '88 Pasteur, Q1', true, true),
  (5, '55555555-5555-5555-5555-555555555555', 1, '52 Hàng Bài, Hoàn Kiếm', true, true),
  (6, '66666666-6666-6666-6666-666666666666', 3, '24 Bạch Đằng, Hải Châu', true, true),
  (7, '77777777-7777-7777-7777-777777777777', 2, '15 Hàn Thuyên, Q1', true, true),
  (8, '88888888-8888-8888-8888-888888888888', 3, '102 Nguyễn Văn Linh', true, true),
  (9, '99999999-9999-9999-9999-999999999999', 1, '18 Mã Mây, Hoàn Kiếm', true, true),
  (10, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Sân bay Tân Sơn Nhất', true, true),
  (11, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, '35 Võ Chí Công, Tây Hồ', true, true),
  (12, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 'Hoàng Sa, Sơn Trà', true, true),
  (13, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, '22 Hàng Bè, Hoàn Kiếm', true, true),
  (14, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, '210 Nguyễn Thị Minh Khai, Q3', true, true),
  (15, 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, '45 Liễu Giai, Ba Đình', true, true),
  (16, '10101010-1010-1010-1010-101010101010', 2, 'Ga Quốc Tế, Tân Sơn Nhất', true, true),
  (17, '20202020-2020-2020-2020-202020202020', 3, '15 Trần Phú, Hải Châu', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spa_services (spa_id, service_id)
VALUES
  ('44444444-4444-4444-4444-444444444444', 2),
  ('55555555-5555-5555-5555-555555555555', 2),
  ('66666666-6666-6666-6666-666666666666', 3),
  ('77777777-7777-7777-7777-777777777777', 3),
  ('88888888-8888-8888-8888-888888888888', 4),
  ('99999999-9999-9999-9999-999999999999', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 6),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 6),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 7),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 7),
  ('10101010-1010-1010-1010-101010101010', 8),
  ('20202020-2020-2020-2020-202020202020', 8)
ON CONFLICT DO NOTHING;

-- 3. Thêm Deals cho từng danh mục
INSERT INTO deals (id, spa_id, city_id, category_id, title_vi, title_en, slug_vi, slug_en, short_description_vi, cover_image_url, status, start_at, end_at, currency, discount_percent, is_sold_out, priority_score)
VALUES
  (4, '44444444-4444-4444-4444-444444444444', 2, 2, 'Cắt uốn nhuộm tóc chuẩn Hàn Quốc giảm 50%', 'Korean Style Hair Cut & Perm 50% Off', 'cat-uon-nhuom-korean', 'korean-hair-cut-perm', 'Bao gồm gội, cắt thiết kế, uốn hoặc nhuộm phục hồi keratin.', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '50%', false, 95),
  (5, '55555555-5555-5555-5555-555555555555', 1, 2, 'Combo làm móng sơn gel & nối mi thiết kế', 'Nail Gel & Eyelash Extension Combo', 'combo-nail-eyelash', 'nail-gel-eyelash-combo', 'Tặng dưỡng móng OPI và dặm mi miễn phí trong 5 ngày.', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '30%', false, 90),
  (6, '66666666-6666-6666-6666-666666666666', 3, 3, 'Set ẩm thực Việt đặc biệt 4 người giảm 33%', 'Special Vietnamese Set Menu for 4', 'set-am-thuc-viet-4-nguoi', 'vietnamese-set-menu-4pax', 'Thực đơn 6 món truyền thống đặc sắc kèm tráng miệng và trà sen.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '33%', false, 95),
  (7, '77777777-7777-7777-7777-777777777777', 2, 3, 'Voucher cà phê specialty & bánh ngọt cao cấp', 'Specialty Coffee & Pastry Voucher', 'voucher-cafe-specialty', 'specialty-coffee-voucher', 'Áp dụng cho toàn bộ đồ uống signature và bánh ngọt tại quán.', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '35%', false, 85),
  (8, '88888888-8888-8888-8888-888888888888', 3, 4, 'Tour Bà Nà Hills trọn gói cáp treo & buffet', 'Ba Na Hills Day Tour with Cable Car & Buffet', 'tour-ba-na-hills-tron-goi', 'bana-hills-day-tour', 'Bao gồm xe đưa đón, vé cáp treo khứ hồi, Cầu Vàng và buffet trưa.', 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '23%', false, 100),
  (9, '99999999-9999-9999-9999-999999999999', 1, 4, 'Tour ẩm thực phố cổ Hà Nội & lớp nấu ăn', 'Hanoi Old Quarter Street Food & Cooking Class', 'tour-am-thuc-pho-co-ha-noi', 'hanoi-street-food-tour', 'Thưởng thức 7 món phố cổ nức tiếng và học làm phở cuốn, bún chả.', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '35%', false, 90),
  (10, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 5, 'Đưa đón sân bay Tân Sơn Nhất xe Limousine VIP', 'Tan Son Nhat Airport VIP Limousine Transfer', 'dua-don-san-bay-tan-son-nhat', 'airport-limousine-transfer', 'Đưa đón tận nơi các quận trung tâm, nước uống và wifi miễn phí.', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '28%', false, 95),
  (11, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 5, 'Thuê xe tự lái 24h xe điện thông minh đời mới', 'Smart Electric Car Rental 24h Hanoi', 'thue-xe-tu-lai-24h-ha-noi', 'electric-car-rental-24h', 'Thủ tục nhanh gọn, giao nhận xe tận nhà, sạc pin miễn phí.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '25%', false, 85),
  (12, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 6, 'Phòng Deluxe hướng biển kèm buffet sáng', 'Deluxe Ocean View Room with Breakfast', 'phong-deluxe-huong-bien-da-nang', 'deluxe-ocean-view-room', 'Miễn phí hồ bơi vô cực, trà chiều và đưa đón sân bay Đà Nẵng.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '40%', false, 100),
  (13, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 6, 'Combo 2N1Đ phòng Suite phong cách phố cổ Hà Nội', '2D1N Hanoi Old Quarter Suite Package', 'combo-suite-pho-co-ha-noi', 'hanoi-suite-combo-2d1n', 'Bao gồm bữa sáng kiểu Âu và voucher massage chân 45 phút.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '35%', false, 90),
  (14, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, 7, 'Gói cạo vôi răng & tẩy trắng công nghệ Laser', 'Dental Cleaning & Laser Teeth Whitening', 'tay-trang-rang-laser', 'laser-teeth-whitening', 'Bác sĩ chuyên khoa trực tiếp thực hiện, bật 2-3 tông an toàn.', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '50%', false, 95),
  (15, 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, 7, 'Gói khám sức khỏe tổng quát & tầm soát chuyên sâu', 'Comprehensive Health Checkup Package', 'kham-suc-khoe-tong-quat', 'health-checkup-package', 'Xét nghiệm máu, siêu âm tổng quát và tư vấn chế độ dinh dưỡng.', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '37%', false, 90),
  (16, '10101010-1010-1010-1010-101010101010', 2, 8, 'eSIM 4G/5G du lịch tốc độ cao không giới hạn', 'Unlimited 4G/5G Tourist eSIM Vietnam', 'esim-du-lich-toc-do-cao', 'unlimited-tourist-esim', 'Kích hoạt tức thì qua mã QR, phủ sóng toàn quốc mạng Viettel/Vinaphone.', 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '40%', false, 95),
  (17, '20202020-2020-2020-2020-202020202020', 3, 8, 'Dịch vụ gửi hành lý cả ngày an toàn tuyệt đối', 'All-Day Secure Luggage Storage', 'dich-vu-gui-hanh-ly-da-nang', 'secure-luggage-storage', 'Bảo hiểm hành lý lên đến 10 triệu, nhận gửi 24/7 gần bãi biển Mỹ Khê.', 'https://images.unsplash.com/photo-1553531384-411a247ccd73?w=800', 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', '37%', false, 85)
ON CONFLICT (id) DO NOTHING;

-- 4. Thêm biến thể và giá bán cho tất cả các Deals
INSERT INTO deal_variants (id, deal_id, code, name_vi, is_active, sort_order)
VALUES
  (1, 1, 'var-1', 'Gói tiêu chuẩn', true, 1),
  (2, 2, 'var-2', 'Gói tiêu chuẩn', true, 1),
  (3, 3, 'var-3', 'Gói tiêu chuẩn', true, 1),
  (4, 4, 'var-4', 'Gói tiêu chuẩn', true, 1),
  (5, 5, 'var-5', 'Gói tiêu chuẩn', true, 1),
  (6, 6, 'var-6', 'Gói tiêu chuẩn', true, 1),
  (7, 7, 'var-7', 'Gói tiêu chuẩn', true, 1),
  (8, 8, 'var-8', 'Gói tiêu chuẩn', true, 1),
  (9, 9, 'var-9', 'Gói tiêu chuẩn', true, 1),
  (10, 10, 'var-10', 'Gói tiêu chuẩn', true, 1),
  (11, 11, 'var-11', 'Gói tiêu chuẩn', true, 1),
  (12, 12, 'var-12', 'Gói tiêu chuẩn', true, 1),
  (13, 13, 'var-13', 'Gói tiêu chuẩn', true, 1),
  (14, 14, 'var-14', 'Gói tiêu chuẩn', true, 1),
  (15, 15, 'var-15', 'Gói tiêu chuẩn', true, 1),
  (16, 16, 'var-16', 'Gói tiêu chuẩn', true, 1),
  (17, 17, 'var-17', 'Gói tiêu chuẩn', true, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO deal_variant_prices (id, variant_id, price_type, original_price, sale_price, currency, is_active)
VALUES
  (1, 1, 'standard', 600000, 300000, 'VND', true),
  (2, 2, 'standard', 600000, 360000, 'VND', true),
  (3, 3, 'standard', 800000, 520000, 'VND', true),
  (4, 4, 'standard', 900000, 450000, 'VND', true),
  (5, 5, 'standard', 400000, 280000, 'VND', true),
  (6, 6, 'standard', 750000, 499000, 'VND', true),
  (7, 7, 'standard', 100000, 65000, 'VND', true),
  (8, 8, 'standard', 1150000, 890000, 'VND', true),
  (9, 9, 'standard', 600000, 390000, 'VND', true),
  (10, 10, 'standard', 350000, 250000, 'VND', true),
  (11, 11, 'standard', 800000, 600000, 'VND', true),
  (12, 12, 'standard', 2000000, 1200000, 'VND', true),
  (13, 13, 'standard', 1300000, 850000, 'VND', true),
  (14, 14, 'standard', 900000, 450000, 'VND', true),
  (15, 15, 'standard', 1500000, 950000, 'VND', true),
  (16, 16, 'standard', 200000, 120000, 'VND', true),
  (17, 17, 'standard', 80000, 50000, 'VND', true)
ON CONFLICT (id) DO NOTHING;
