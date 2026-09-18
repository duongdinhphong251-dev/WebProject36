const { Client } = require('pg');

async function seed() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'tuoi_db',
  });

  await client.connect();

  const servicesData = [
    { id: 1, code: 'massage-spa', name_vi: 'Massage & Spa', name_en: 'Massage & Spa', name_ko: '마사지 & 스파', slug_vi: 'massage-spa', slug_en: 'massage-spa', slug_ko: 'masaji-seupa', slug_global: 'massage-spa', sort_order: 1 },
    { id: 2, code: 'beauty-hair', name_vi: 'Làm đẹp & Tóc', name_en: 'Beauty & Hair', name_ko: '뷰티 & 헤어', slug_vi: 'lam-dep', slug_en: 'beauty-hair', slug_ko: 'byuti-he-eo', slug_global: 'beauty-hair', sort_order: 2 },
    { id: 3, code: 'food-drink', name_vi: 'Ăn uống', name_en: 'Food & Drink', name_ko: '맛집 & 카페', slug_vi: 'an-uong', slug_en: 'food-drink', slug_ko: 'matjib-kape', slug_global: 'food-drink', sort_order: 3 },
    { id: 4, code: 'tours', name_vi: 'Tour & Trải nghiệm', name_en: 'Tours & Experiences', name_ko: '투어 & 액티비티', slug_vi: 'tour-trai-nghiem', slug_en: 'tours-experiences', slug_ko: 'tueo-aegtibiti', slug_global: 'tours', sort_order: 4 },
    { id: 5, code: 'transport', name_vi: 'Di chuyển', name_en: 'Transport', name_ko: '교통 & 이동', slug_vi: 'di-chuyen', slug_en: 'transport', slug_ko: 'gyotong-idong', slug_global: 'transport', sort_order: 5 },
    { id: 6, code: 'stay', name_vi: 'Lưu trú', name_en: 'Stay', name_ko: '숙소', slug_vi: 'luu-tru', slug_en: 'stay', slug_ko: 'sugso', slug_global: 'stay', sort_order: 6 },
    { id: 7, code: 'health', name_vi: 'Sức khỏe & Y tế', name_en: 'Health & Medical', name_ko: '건강 & 의료', slug_vi: 'suc-khoe-y-te', slug_en: 'health-medical', slug_ko: 'geongang-uiryo', slug_global: 'health', sort_order: 7 },
    { id: 8, code: 'essentials', name_vi: 'Tiện ích du lịch', name_en: 'Travel Essentials', name_ko: '여행 편의시설', slug_vi: 'tien-ich-du-lich', slug_en: 'travel-essentials', slug_ko: 'yeohaeng-pyeon-ui-siseol', slug_global: 'essentials', sort_order: 8 },
  ];

  for (const s of servicesData) {
    await client.query(
      `INSERT INTO services (id, code, name_vi, name_en, name_ko, slug_vi, slug_en, slug_ko, slug_global, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
       ON CONFLICT (id) DO UPDATE SET
         name_vi = EXCLUDED.name_vi,
         name_en = EXCLUDED.name_en,
         name_ko = EXCLUDED.name_ko,
         slug_vi = EXCLUDED.slug_vi,
         slug_en = EXCLUDED.slug_en,
         slug_ko = EXCLUDED.slug_ko,
         slug_global = EXCLUDED.slug_global,
         is_active = true`,
      [s.id, s.code, s.name_vi, s.name_en, s.name_ko, s.slug_vi, s.slug_en, s.slug_ko, s.slug_global, s.sort_order]
    );
  }

  // Link spas to service 1 (massage-spa)
  await client.query(`
    INSERT INTO spa_services (spa_id, service_id)
    VALUES
      ('11111111-1111-1111-1111-111111111111', 1),
      ('22222222-2222-2222-2222-222222222222', 1),
      ('33333333-3333-3333-3333-333333333333', 1)
    ON CONFLICT DO NOTHING
  `);

  // Update deals status to 'active' and category_id to 1 (massage-spa)
  await client.query(`UPDATE deals SET status = 'active', category_id = 1`);

  console.log('Seeded services, spa_services, and updated deals status to active successfully!');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
