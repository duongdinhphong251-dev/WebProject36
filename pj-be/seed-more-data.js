const { Client } = require('pg');

async function seedMore() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'tuoi_db',
  });

  await client.connect();

  console.log('Connecting to database...');

  // 1. Spas data
  const spas = [
    // Category 2: Làm đẹp & Tóc (beauty-hair)
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Tokyo Hair Salon & Academy',
      slug: 'tokyo-hair-salon',
      address: '88 Pasteur, Bến Nghé, Quận 1, TP.HCM',
      phone: '0912345601',
      description: 'Salon làm tóc chuẩn phong cách Nhật Bản, chuyên uốn nhuộm phục hồi.',
      province: 'Hồ Chí Minh',
      rating_value: 4.9,
      review_count: 156,
      spa_avatar: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Seoul Nail & Eyelash Art',
      slug: 'seoul-nail-eyelash',
      address: '52 Hàng Bài, Hoàn Kiếm, Hà Nội',
      phone: '0912345602',
      description: 'Chuyên làm móng nghệ thuật, nối mi tự nhiên cao cấp Hàn Quốc.',
      province: 'Hà Nội',
      rating_value: 4.8,
      review_count: 94,
      spa_avatar: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600',
    },

    // Category 3: Ăn uống (food-drink)
    {
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Hương Xưa Restaurant & Lounge',
      slug: 'huong-xua-restaurant',
      address: '24 Bạch Đằng, Hải Châu, Đà Nẵng',
      phone: '0912345603',
      description: 'Nhà hàng ẩm thực Việt truyền thống view sông Hàn lãng mạn.',
      province: 'Đà Nẵng',
      rating_value: 4.7,
      review_count: 210,
      spa_avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    },
    {
      id: '77777777-7777-7777-7777-777777777777',
      name: 'The Coffee Garden Roastery',
      slug: 'the-coffee-garden',
      address: '15 Hàn Thuyên, Bến Nghé, Quận 1, TP.HCM',
      phone: '0912345604',
      description: 'Không gian cà phê xanh mát, cà phê specialty rang xay thủ công.',
      province: 'Hồ Chí Minh',
      rating_value: 4.6,
      review_count: 142,
      spa_avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600',
    },

    // Category 4: Tour & Trải nghiệm (tours)
    {
      id: '88888888-8888-8888-8888-888888888888',
      name: 'Danang Discovery Tours',
      slug: 'danang-discovery-tours',
      address: '102 Nguyễn Văn Linh, Đà Nẵng',
      phone: '0912345605',
      description: 'Đơn vị tổ chức tour trải nghiệm Bà Nà Hills, Cù Lao Chàm, Ngũ Hành Sơn hàng đầu.',
      province: 'Đà Nẵng',
      rating_value: 4.9,
      review_count: 320,
      spa_avatar: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600',
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      name: 'Hanoi Street Food & Cooking Class',
      slug: 'hanoi-food-tour',
      address: '18 Mã Mây, Hàng Buồm, Hoàn Kiếm, Hà Nội',
      phone: '0912345606',
      description: 'Khám phá ẩm thực 36 phố phường và tham gia lớp nấu món ăn truyền thống.',
      province: 'Hà Nội',
      rating_value: 4.8,
      review_count: 180,
      spa_avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    },

    // Category 5: Di chuyển (transport)
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'VIP Airport Limousine',
      slug: 'vip-airport-limousine',
      address: 'Sân bay Tân Sơn Nhất, Quận Tân Bình, TP.HCM',
      phone: '0912345607',
      description: 'Dịch vụ xe Limousine đưa đón sân bay riêng tư, ghế mát-xa, tài xế chuyên nghiệp.',
      province: 'Hồ Chí Minh',
      rating_value: 4.9,
      review_count: 260,
      spa_avatar: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Green Car Rental Hanoi',
      slug: 'green-car-rental-hanoi',
      address: '35 Võ Chí Công, Tây Hồ, Hà Nội',
      phone: '0912345608',
      description: 'Cho thuê xe ô tô tự lái và xe du lịch đời mới giá ưu đãi.',
      province: 'Hà Nội',
      rating_value: 4.7,
      review_count: 115,
      spa_avatar: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    },

    // Category 6: Lưu trú (stay)
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'Son Tra Beachfront Villa & Resort',
      slug: 'son-tra-resort',
      address: 'Hoàng Sa, Thọ Quang, Sơn Trà, Đà Nẵng',
      phone: '0912345609',
      description: 'Resort nghỉ dưỡng ven biển bán đảo Sơn Trà, hồ bơi vô cực và buffet sáng.',
      province: 'Đà Nẵng',
      rating_value: 4.9,
      review_count: 410,
      spa_avatar: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      name: 'Old Quarter Boutique Hotel',
      slug: 'old-quarter-boutique',
      address: '22 Hàng Bè, Hàng Bạc, Hoàn Kiếm, Hà Nội',
      phone: '0912345610',
      description: 'Khách sạn boutique đậm phong cách Indochine ngay trung tâm phố cổ.',
      province: 'Hà Nội',
      rating_value: 4.8,
      review_count: 175,
      spa_avatar: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600',
    },

    // Category 7: Sức khỏe & Y tế (health)
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      name: 'Smile Dental Clinic & Care',
      slug: 'smile-dental-clinic',
      address: '210 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
      phone: '0912345611',
      description: 'Nha khoa thẩm mỹ chuẩn quốc tế, tẩy trắng răng Laser và chăm sóc nụ cười.',
      province: 'Hồ Chí Minh',
      rating_value: 4.8,
      review_count: 130,
      spa_avatar: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600',
    },
    {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      name: 'International Wellness Clinic',
      slug: 'international-wellness-clinic',
      address: '45 Liễu Giai, Ba Đình, Hà Nội',
      phone: '0912345612',
      description: 'Phòng khám đa khoa và trị liệu phục hồi sức khỏe chuyên sâu.',
      province: 'Hà Nội',
      rating_value: 4.7,
      review_count: 88,
      spa_avatar: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600',
    },

    // Category 8: Tiện ích du lịch (essentials)
    {
      id: '10101010-1010-1010-1010-101010101010',
      name: 'VN Telecom & eSIM Station',
      slug: 'vn-telecom-esim',
      address: 'Ga Quốc Tế, Sân bay Tân Sơn Nhất, TP.HCM',
      phone: '0912345613',
      description: 'Cung cấp eSIM 4G/5G du lịch tốc độ cao không giới hạn dữ liệu tại Việt Nam.',
      province: 'Hồ Chí Minh',
      rating_value: 4.9,
      review_count: 240,
      spa_avatar: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600',
    },
    {
      id: '20202020-2020-2020-2020-202020202020',
      name: 'Speedy Luggage & Currency Hub',
      slug: 'speedy-luggage-hub',
      address: '15 Trần Phú, Hải Châu, Đà Nẵng',
      phone: '0912345614',
      description: 'Điểm gửi hành lý an toàn, đổi ngoại tệ tỷ giá tốt và tiện ích du khách.',
      province: 'Đà Nẵng',
      rating_value: 4.8,
      review_count: 110,
      spa_avatar: 'https://images.unsplash.com/photo-1553531384-411a247ccd73?w=600',
    },
  ];

  for (const spa of spas) {
    await client.query(
      `INSERT INTO spas (id, name, slug, address, phone, description, province, rating_value, review_count, spa_avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         address = EXCLUDED.address,
         phone = EXCLUDED.phone,
         description = EXCLUDED.description,
         province = EXCLUDED.province,
         rating_value = EXCLUDED.rating_value,
         review_count = EXCLUDED.review_count,
         spa_avatar = EXCLUDED.spa_avatar`,
      [spa.id, spa.name, spa.slug, spa.address, spa.phone, spa.description, spa.province, spa.rating_value, spa.review_count, spa.spa_avatar]
    );
  }

  // 2. Spa Locations & Spa Services mapping
  const spaLocations = [
    { id: 4, spa_id: '44444444-4444-4444-4444-444444444444', city_id: 2, address_line: '88 Pasteur, Q1', service_id: 2 },
    { id: 5, spa_id: '55555555-5555-5555-5555-555555555555', city_id: 1, address_line: '52 Hàng Bài, Hoàn Kiếm', service_id: 2 },
    { id: 6, spa_id: '66666666-6666-6666-6666-666666666666', city_id: 3, address_line: '24 Bạch Đằng, Hải Châu', service_id: 3 },
    { id: 7, spa_id: '77777777-7777-7777-7777-777777777777', city_id: 2, address_line: '15 Hàn Thuyên, Q1', service_id: 3 },
    { id: 8, spa_id: '88888888-8888-8888-8888-888888888888', city_id: 3, address_line: '102 Nguyễn Văn Linh', service_id: 4 },
    { id: 9, spa_id: '99999999-9999-9999-9999-999999999999', city_id: 1, address_line: '18 Mã Mây, Hoàn Kiếm', service_id: 4 },
    { id: 10, spa_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', city_id: 2, address_line: 'Sân bay Tân Sơn Nhất', service_id: 5 },
    { id: 11, spa_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', city_id: 1, address_line: '35 Võ Chí Công, Tây Hồ', service_id: 5 },
    { id: 12, spa_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', city_id: 3, address_line: 'Hoàng Sa, Sơn Trà', service_id: 6 },
    { id: 13, spa_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', city_id: 1, address_line: '22 Hàng Bè, Hoàn Kiếm', service_id: 6 },
    { id: 14, spa_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', city_id: 2, address_line: '210 Nguyễn Thị Minh Khai, Q3', service_id: 7 },
    { id: 15, spa_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', city_id: 1, address_line: '45 Liễu Giai, Ba Đình', service_id: 7 },
    { id: 16, spa_id: '10101010-1010-1010-1010-101010101010', city_id: 2, address_line: 'Ga Quốc Tế, Tân Sơn Nhất', service_id: 8 },
    { id: 17, spa_id: '20202020-2020-2020-2020-202020202020', city_id: 3, address_line: '15 Trần Phú, Hải Châu', service_id: 8 },
  ];

  for (const loc of spaLocations) {
    await client.query(
      `INSERT INTO spa_locations (id, spa_id, city_id, address_line, is_primary, is_active)
       VALUES ($1, $2, $3, $4, true, true)
       ON CONFLICT (id) DO UPDATE SET
         spa_id = EXCLUDED.spa_id,
         city_id = EXCLUDED.city_id,
         address_line = EXCLUDED.address_line,
         is_primary = true,
         is_active = true`,
      [loc.id, loc.spa_id, loc.city_id, loc.address_line]
    );

    await client.query(
      `INSERT INTO spa_services (spa_id, service_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [loc.spa_id, loc.service_id]
    );
  }

  // 3. Deals data
  const deals = [
    // Category 2: Làm đẹp & Tóc (beauty-hair)
    {
      id: 4,
      spa_id: '44444444-4444-4444-4444-444444444444',
      city_id: 2,
      category_id: 2,
      title_vi: 'Cắt uốn nhuộm tóc chuẩn Hàn Quốc giảm 50%',
      title_en: 'Korean Style Hair Cut & Perm 50% Off',
      slug_vi: 'cat-uon-nhuom-korean',
      slug_en: 'korean-hair-cut-perm',
      short_description_vi: 'Bao gồm gội, cắt thiết kế, uốn hoặc nhuộm phục hồi keratin.',
      cover_image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
      discount_percent: '50%',
      priority_score: 95,
      original_price: 900000,
      sale_price: 450000,
    },
    {
      id: 5,
      spa_id: '55555555-5555-5555-5555-555555555555',
      city_id: 1,
      category_id: 2,
      title_vi: 'Combo làm móng sơn gel & nối mi thiết kế',
      title_en: 'Nail Gel & Eyelash Extension Combo',
      slug_vi: 'combo-nail-eyelash',
      slug_en: 'nail-gel-eyelash-combo',
      short_description_vi: 'Tặng dưỡng móng OPI và dặm mi miễn phí trong 5 ngày.',
      cover_image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800',
      discount_percent: '30%',
      priority_score: 90,
      original_price: 400000,
      sale_price: 280000,
    },

    // Category 3: Ăn uống (food-drink)
    {
      id: 6,
      spa_id: '66666666-6666-6666-6666-666666666666',
      city_id: 3,
      category_id: 3,
      title_vi: 'Set ẩm thực Việt đặc biệt 4 người giảm 33%',
      title_en: 'Special Vietnamese Set Menu for 4',
      slug_vi: 'set-am-thuc-viet-4-nguoi',
      slug_en: 'vietnamese-set-menu-4pax',
      short_description_vi: 'Thực đơn 6 món truyền thống đặc sắc kèm tráng miệng và trà sen.',
      cover_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      discount_percent: '33%',
      priority_score: 95,
      original_price: 750000,
      sale_price: 499000,
    },
    {
      id: 7,
      spa_id: '77777777-7777-7777-7777-777777777777',
      city_id: 2,
      category_id: 3,
      title_vi: 'Voucher cà phê specialty & bánh ngọt cao cấp',
      title_en: 'Specialty Coffee & Pastry Voucher',
      slug_vi: 'voucher-cafe-specialty',
      slug_en: 'specialty-coffee-voucher',
      short_description_vi: 'Áp dụng cho toàn bộ đồ uống signature và bánh ngọt tại quán.',
      cover_image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
      discount_percent: '35%',
      priority_score: 85,
      original_price: 100000,
      sale_price: 65000,
    },

    // Category 4: Tour & Trải nghiệm (tours)
    {
      id: 8,
      spa_id: '88888888-8888-8888-8888-888888888888',
      city_id: 3,
      category_id: 4,
      title_vi: 'Tour Bà Nà Hills trọn gói cáp treo & buffet',
      title_en: 'Ba Na Hills Day Tour with Cable Car & Buffet',
      slug_vi: 'tour-ba-na-hills-tron-goi',
      slug_en: 'bana-hills-day-tour',
      short_description_vi: 'Bao gồm xe đưa đón, vé cáp treo khứ hồi, Cầu Vàng và buffet trưa.',
      cover_image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      discount_percent: '23%',
      priority_score: 100,
      original_price: 1150000,
      sale_price: 890000,
    },
    {
      id: 9,
      spa_id: '99999999-9999-9999-9999-999999999999',
      city_id: 1,
      category_id: 4,
      title_vi: 'Tour ẩm thực phố cổ Hà Nội & lớp nấu ăn',
      title_en: 'Hanoi Old Quarter Street Food & Cooking Class',
      slug_vi: 'tour-am-thuc-pho-co-ha-noi',
      slug_en: 'hanoi-street-food-tour',
      short_description_vi: 'Thưởng thức 7 món phố cổ nức tiếng và học làm phở cuốn, bún chả.',
      cover_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      discount_percent: '35%',
      priority_score: 90,
      original_price: 600000,
      sale_price: 390000,
    },

    // Category 5: Di chuyển (transport)
    {
      id: 10,
      spa_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      city_id: 2,
      category_id: 5,
      title_vi: 'Đưa đón sân bay Tân Sơn Nhất xe Limousine VIP',
      title_en: 'Tan Son Nhat Airport VIP Limousine Transfer',
      slug_vi: 'dua-don-san-bay-tan-son-nhat',
      slug_en: 'airport-limousine-transfer',
      short_description_vi: 'Đưa đón tận nơi các quận trung tâm, nước uống và wifi miễn phí.',
      cover_image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
      discount_percent: '28%',
      priority_score: 95,
      original_price: 350000,
      sale_price: 250000,
    },
    {
      id: 11,
      spa_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      city_id: 1,
      category_id: 5,
      title_vi: 'Thuê xe tự lái 24h xe điện thông minh đời mới',
      title_en: 'Smart Electric Car Rental 24h Hanoi',
      slug_vi: 'thue-xe-tu-lai-24h-ha-noi',
      slug_en: 'electric-car-rental-24h',
      short_description_vi: 'Thủ tục nhanh gọn, giao nhận xe tận nhà, sạc pin miễn phí.',
      cover_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
      discount_percent: '25%',
      priority_score: 85,
      original_price: 800000,
      sale_price: 600000,
    },

    // Category 6: Lưu trú (stay)
    {
      id: 12,
      spa_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      city_id: 3,
      category_id: 6,
      title_vi: 'Phòng Deluxe hướng biển kèm buffet sáng',
      title_en: 'Deluxe Ocean View Room with Breakfast',
      slug_vi: 'phong-deluxe-huong-bien-da-nang',
      slug_en: 'deluxe-ocean-view-room',
      short_description_vi: 'Miễn phí hồ bơi vô cực, trà chiều và đưa đón sân bay Đà Nẵng.',
      cover_image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      discount_percent: '40%',
      priority_score: 100,
      original_price: 2000000,
      sale_price: 1200000,
    },
    {
      id: 13,
      spa_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      city_id: 1,
      category_id: 6,
      title_vi: 'Combo 2N1Đ phòng Suite phong cách phố cổ Hà Nội',
      title_en: '2D1N Hanoi Old Quarter Suite Package',
      slug_vi: 'combo-suite-pho-co-ha-noi',
      slug_en: 'hanoi-suite-combo-2d1n',
      short_description_vi: 'Bao gồm bữa sáng kiểu Âu và voucher massage chân 45 phút.',
      cover_image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      discount_percent: '35%',
      priority_score: 90,
      original_price: 1300000,
      sale_price: 850000,
    },

    // Category 7: Sức khỏe & Y tế (health)
    {
      id: 14,
      spa_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      city_id: 2,
      category_id: 7,
      title_vi: 'Gói cạo vôi răng & tẩy trắng công nghệ Laser',
      title_en: 'Dental Cleaning & Laser Teeth Whitening',
      slug_vi: 'tay-trang-rang-laser',
      slug_en: 'laser-teeth-whitening',
      short_description_vi: 'Bác sĩ chuyên khoa trực tiếp thực hiện, bật 2-3 tông an toàn.',
      cover_image_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800',
      discount_percent: '50%',
      priority_score: 95,
      original_price: 900000,
      sale_price: 450000,
    },
    {
      id: 15,
      spa_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      city_id: 1,
      category_id: 7,
      title_vi: 'Gói khám sức khỏe tổng quát & tầm soát chuyên sâu',
      title_en: 'Comprehensive Health Checkup Package',
      slug_vi: 'kham-suc-khoe-tong-quat',
      slug_en: 'health-checkup-package',
      short_description_vi: 'Xét nghiệm máu, siêu âm tổng quát và tư vấn chế độ dinh dưỡng.',
      cover_image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
      discount_percent: '37%',
      priority_score: 90,
      original_price: 1500000,
      sale_price: 950000,
    },

    // Category 8: Tiện ích du lịch (essentials)
    {
      id: 16,
      spa_id: '10101010-1010-1010-1010-101010101010',
      city_id: 2,
      category_id: 8,
      title_vi: 'eSIM 4G/5G du lịch tốc độ cao không giới hạn',
      title_en: 'Unlimited 4G/5G Tourist eSIM Vietnam',
      slug_vi: 'esim-du-lich-toc-do-cao',
      slug_en: 'unlimited-tourist-esim',
      short_description_vi: 'Kích hoạt tức thì qua mã QR, phủ sóng toàn quốc mạng Viettel/Vinaphone.',
      cover_image_url: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800',
      discount_percent: '40%',
      priority_score: 95,
      original_price: 200000,
      sale_price: 120000,
    },
    {
      id: 17,
      spa_id: '20202020-2020-2020-2020-202020202020',
      city_id: 3,
      category_id: 8,
      title_vi: 'Dịch vụ gửi hành lý cả ngày an toàn tuyệt đối',
      title_en: 'All-Day Secure Luggage Storage',
      slug_vi: 'dich-vu-gui-hanh-ly-da-nang',
      slug_en: 'secure-luggage-storage',
      short_description_vi: 'Bảo hiểm hành lý lên đến 10 triệu, nhận gửi 24/7 gần bãi biển Mỹ Khê.',
      cover_image_url: 'https://images.unsplash.com/photo-1553531384-411a247ccd73?w=800',
      discount_percent: '37%',
      priority_score: 85,
      original_price: 80000,
      sale_price: 50000,
    },
  ];

  for (const deal of deals) {
    await client.query(
      `INSERT INTO deals (id, spa_id, city_id, category_id, title_vi, title_en, slug_vi, slug_en, short_description_vi, cover_image_url, status, start_at, end_at, currency, discount_percent, is_sold_out, priority_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW() + INTERVAL '60 days', 'VND', $11, false, $12)
       ON CONFLICT (id) DO UPDATE SET
         spa_id = EXCLUDED.spa_id,
         city_id = EXCLUDED.city_id,
         category_id = EXCLUDED.category_id,
         title_vi = EXCLUDED.title_vi,
         title_en = EXCLUDED.title_en,
         slug_vi = EXCLUDED.slug_vi,
         slug_en = EXCLUDED.slug_en,
         short_description_vi = EXCLUDED.short_description_vi,
         cover_image_url = EXCLUDED.cover_image_url,
         status = 'active',
         discount_percent = EXCLUDED.discount_percent,
         priority_score = EXCLUDED.priority_score`,
      [deal.id, deal.spa_id, deal.city_id, deal.category_id, deal.title_vi, deal.title_en, deal.slug_vi, deal.slug_en, deal.short_description_vi, deal.cover_image_url, deal.discount_percent, deal.priority_score]
    );

    // Insert deal variant
    await client.query(
      `INSERT INTO deal_variants (id, deal_id, code, name_vi, name_en, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, true, 1)
       ON CONFLICT (id) DO UPDATE SET
         deal_id = EXCLUDED.deal_id,
         name_vi = EXCLUDED.name_vi,
         is_active = true`,
      [deal.id, deal.id, `var-${deal.id}`, deal.title_vi, deal.title_en]
    );

    // Insert deal variant price
    await client.query(
      `INSERT INTO deal_variant_prices (id, variant_id, price_type, original_price, sale_price, currency, is_active)
       VALUES ($1, $2, 'standard', $3, $4, 'VND', true)
       ON CONFLICT (id) DO UPDATE SET
         variant_id = EXCLUDED.variant_id,
         original_price = EXCLUDED.original_price,
         sale_price = EXCLUDED.sale_price,
         is_active = true`,
      [deal.id, deal.id, deal.original_price, deal.sale_price]
    );
  }

  // Also add prices for deals 1, 2, 3 (Massage & Spa)
  const initialPrices = [
    { id: 1, original_price: 600000, sale_price: 300000 },
    { id: 2, original_price: 600000, sale_price: 360000 },
    { id: 3, original_price: 800000, sale_price: 520000 },
  ];

  for (const p of initialPrices) {
    await client.query(
      `INSERT INTO deal_variants (id, deal_id, code, name_vi, is_active, sort_order)
       VALUES ($1, $2, $3, 'Gói tiêu chuẩn', true, 1)
       ON CONFLICT (id) DO UPDATE SET is_active = true`,
      [p.id, p.id, `var-${p.id}`]
    );

    await client.query(
      `INSERT INTO deal_variant_prices (id, variant_id, price_type, original_price, sale_price, currency, is_active)
       VALUES ($1, $2, 'standard', $3, $4, 'VND', true)
       ON CONFLICT (id) DO UPDATE SET
         original_price = EXCLUDED.original_price,
         sale_price = EXCLUDED.sale_price,
         is_active = true`,
      [p.id, p.id, p.original_price, p.sale_price]
    );
  }

  console.log('Successfully seeded 14 new spas, 14 new deals with full locations, services, and prices for all 8 categories!');
  await client.end();
}

seedMore().catch(err => {
  console.error('Seed more error:', err);
  process.exit(1);
});
