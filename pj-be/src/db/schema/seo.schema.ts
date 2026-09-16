import { pgTable, bigint, varchar, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const seoNodes = pgTable('seo_nodes', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  locale: varchar('locale', { length: 10 }),
  nodeType: varchar('node_type', { length: 100 }),
  url: varchar('url', { length: 500 }),
  templateId: bigint('template_id', { mode: 'number' }),
  categoryId: bigint('category_id', { mode: 'number' }),
  cityId: bigint('city_id', { mode: 'number' }),
  districtId: bigint('district_id', { mode: 'number' }),
  wardId: bigint('ward_id', { mode: 'number' }),
  placeId: bigint('place_id', { mode: 'number' }),
  h1: varchar('h1', { length: 500 }),
  title: varchar('title', { length: 500 }),
  metaDescription: text('meta_description'),
  h1Override: varchar('h1_override', { length: 500 }),
  titleOverride: varchar('title_override', { length: 500 }),
  metaOverride: text('meta_override'),
  publishStatus: varchar('publish_status', { length: 50 }),
  indexable: boolean('indexable'),
  inSitemap: boolean('in_sitemap'),
  dealCount: integer('deal_count'),
  spaCount: integer('spa_count'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    urlLocaleIdx: index('url_locale_idx').on(table.url, table.locale, table.publishStatus),
  }
});


export const seoTemplates = pgTable('seo_templates', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  nodeType: varchar('node_type', { length: 100 }),
  locale: varchar('locale', { length: 10 }),
  code: varchar('code', { length: 100 }),
  h1Pattern: varchar('h1_pattern', { length: 500 }),
  titlePattern: varchar('title_pattern', { length: 500 }),
  metaPattern: text('meta_pattern'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});
