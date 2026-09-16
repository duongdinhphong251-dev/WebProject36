import { pgTable, bigint, varchar, boolean, integer, numeric, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const cities = pgTable('cities', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  nameVi: varchar('name_vi', { length: 255 }),
  nameEn: varchar('name_en', { length: 255 }),
  nameKo: varchar('name_ko', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  isActive: boolean('is_active'),
  priority: integer('priority'),
  adminCode: varchar('admin_code', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    slugCityIdIdx: uniqueIndex('slug_city_id_idx').on(table.slug)
  }
});

export const districts = pgTable('districts', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  cityId: bigint('city_id', { mode: 'number' }),
  nameVi: varchar('name_vi', { length: 255 }),
  nameEn: varchar('name_en', { length: 255 }),
  nameKo: varchar('name_ko', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  isActive: boolean('is_active'),
  priority: integer('priority'),
  adminCode: varchar('admin_code', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    slugDistrictIdIdx: uniqueIndex('slug_district_id_idx').on(table.slug)
  }
});

export const wards = pgTable('wards', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  cityId: bigint('city_id', { mode: 'number' }),
  districtId: bigint('district_id', { mode: 'number' }),
  nameVi: varchar('name_vi', { length: 255 }),
  nameEn: varchar('name_en', { length: 255 }),
  nameKo: varchar('name_ko', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  isActive: boolean('is_active'),
  priority: integer('priority'),
  adminCode: varchar('admin_code', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    slugWardIdIdx: uniqueIndex('slug_ward_id_idx').on(table.slug)
  }
});

export const places = pgTable('places', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  cityId: bigint('city_id', { mode: 'number' }),
  districtId: bigint('district_id', { mode: 'number' }),
  wardId: bigint('ward_id', { mode: 'number' }),
  type: varchar('type', { length: 50 }),
  nameVi: varchar('name_vi', { length: 255 }),
  nameEn: varchar('name_en', { length: 255 }),
  nameKo: varchar('name_ko', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  lat: numeric('lat'),
  lng: numeric('lng'),
  isActive: boolean('is_active'),
  priority: integer('priority'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    slugPlaceIdIdx: uniqueIndex('slug_place_id_idx').on(table.slug)
  }
});
