import { pgTable, bigint, varchar, boolean, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const services = pgTable('services', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  code: varchar('code', { length: 100 }),
  nameVi: varchar('name_vi', { length: 255 }),
  nameEn: varchar('name_en', { length: 255 }),
  nameKo: varchar('name_ko', { length: 255 }),
  slugVi: varchar('slug_vi', { length: 255 }),
  slugEn: varchar('slug_en', { length: 255 }),
  slugKo: varchar('slug_ko', { length: 255 }),
  slugGlobal: varchar('slug_global', { length: 255 }),
  categoryId: bigint('category_id', { mode: 'number' }),
  isActive: boolean('is_active'),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    slugGlobalIdx: uniqueIndex('slug_global_idx').on(table.slugGlobal),
    slugViIdx: uniqueIndex('services_slug_vi_idx').on(table.slugVi),
    slugEnIdx: uniqueIndex('services_slug_en_idx').on(table.slugEn),
    slugKoIdx: uniqueIndex('services_slug_ko_idx').on(table.slugKo)
  }
});

