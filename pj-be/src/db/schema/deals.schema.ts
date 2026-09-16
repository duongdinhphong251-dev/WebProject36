import { pgTable, bigint, uuid, varchar, text, boolean, integer, numeric, timestamp, smallint, jsonb, index } from 'drizzle-orm/pg-core';

export const deals = pgTable('deals', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  legacyDealId: uuid('legacy_deal_id'),
  spaId: uuid('spa_id'),
  categoryId: bigint('category_id', { mode: 'number' }),
  cityId: bigint('city_id', { mode: 'number' }),
  districtId: bigint('district_id', { mode: 'number' }),
  wardId: bigint('ward_id', { mode: 'number' }),
  placeId: bigint('place_id', { mode: 'number' }),
  slugVi: varchar('slug_vi', { length: 255 }),
  slugEn: varchar('slug_en', { length: 255 }),
  slugKo: varchar('slug_ko', { length: 255 }),
  titleVi: varchar('title_vi', { length: 500 }),
  titleEn: varchar('title_en', { length: 500 }),
  titleKo: varchar('title_ko', { length: 500 }),
  shortDescriptionVi: text('short_description_vi'),
  shortDescriptionEn: text('short_description_en'),
  shortDescriptionKo: text('short_description_ko'),
  contentVi: text('content_vi'),
  contentEn: text('content_en'),
  contentKo: text('content_ko'),
  coverImageUrl: text('cover_image_url'),
  status: varchar('status', { length: 50 }),
  startAt: timestamp('start_at', { withTimezone: true }),
  endAt: timestamp('end_at', { withTimezone: true }),
  isSoldOut: boolean('is_sold_out'),
  priorityScore: integer('priority_score'),
  currency: varchar('currency', { length: 10 }),
  discountPercent: varchar('discount_percent', { length: 20 }),
  discountedService: text('discounted_service'),
  priceRange: text('price_range'),
  serviceTags: text('service_tags').array(),
  serviceCategories: text('service_categories').array(),
  source: text('source'),
  reportCount: integer('report_count'),
  extraAttributes: jsonb('extra_attributes'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    spaIdIdx: index('deals_spa_id_idx').on(table.spaId),
    categoryIdIdx: index('deals_category_id_idx').on(table.categoryId),
    cityIdIdx: index('deals_city_id_idx').on(table.cityId),
    districtIdIdx: index('deals_district_id_idx').on(table.districtId),
    statusIdx: index('deals_status_idx').on(table.status),
    wardIdIdx: index('deals_ward_id_idx').on(table.wardId),
    placeIdIdx: index('deals_place_id_idx').on(table.placeId)
  }
});

export const dealVariants = pgTable('deal_variants', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  dealId: bigint('deal_id', { mode: 'number' }),
  code: varchar('code', { length: 100 }),
  nameVi: varchar('name_vi', { length: 500 }),
  nameEn: varchar('name_en', { length: 500 }),
  nameKo: varchar('name_ko', { length: 500 }),
  durationMin: integer('duration_min'),
  pax: integer('pax'),
  descriptionVi: text('description_vi'),
  qtySold: integer('qty_sold'),
  qtyTotal: integer('qty_total'),
  isActive: boolean('is_active'),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    dealIdIdx: index('deal_variants_deal_id_idx').on(table.dealId)
  }
});

export const dealVariantPrices = pgTable('deal_variant_prices', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  variantId: bigint('variant_id', { mode: 'number' }),
  priceType: varchar('price_type', { length: 50 }),
  listPrice: numeric('list_price'),
  originalPrice: numeric('original_price'),
  salePrice: numeric('sale_price'),
  currency: varchar('currency', { length: 10 }),
  startAt: timestamp('start_at', { withTimezone: true }),
  endAt: timestamp('end_at', { withTimezone: true }),
  isActive: boolean('is_active'),
  priority: integer('priority'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    variantIdIdx: index('deal_variant_prices_variant_id_idx').on(table.variantId)
  }
});

export const dealMedia = pgTable('deal_media', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  dealId: bigint('deal_id', { mode: 'number' }),
  mediaUrl: text('media_url'),
  mediaType: varchar('media_type', { length: 50 }),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: true }),
});

export const dealTimeSlots = pgTable('deal_time_slots', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  variantId: bigint('variant_id', { mode: 'number' }),
  dayOfWeek: smallint('day_of_week'),
  startTime: text('start_time'),  // time stored as text for portability
  endTime: text('end_time'),
  capacity: integer('capacity'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});
