import {
  bigint,
  bigserial,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cities = pgTable('cities', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  nameVi: text('name_vi'),
  nameEn: text('name_en'),
  slug: text('slug'),
});

export const spas = pgTable('spas', {
  id: uuid('id').primaryKey(),
  name: text('name'),
  slug: varchar('slug', { length: 255 }),
  address: text('address'),
  phone: text('phone'),
  description: text('description'),
  messagingLinkZalo: text('messaging_link_zalo'),
  spaAvatar: text('spa_avatar'),
  ownerId: uuid('owner_id'),
  cityId: bigint('city_id', { mode: 'number' }),
  approvalStatus: varchar('approval_status', { length: 20 })
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const deals = pgTable('deals', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  spaId: uuid('spa_id'),
  cityId: bigint('city_id', { mode: 'number' }),
  slugVi: varchar('slug_vi', { length: 255 }),
  titleVi: varchar('title_vi', { length: 500 }),
  titleEn: varchar('title_en', { length: 500 }),
  shortDescriptionVi: text('short_description_vi'),
  coverImageUrl: text('cover_image_url'),
  discountPercent: varchar('discount_percent', { length: 20 }),
  priceVnd: integer('price_vnd'),
  endAt: timestamp('end_at', { withTimezone: true }),
  approvalStatus: varchar('approval_status', { length: 20 })
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const savedSpas = pgTable('saved_spas', {
  userId: uuid('user_id').notNull(),
  spaId: uuid('spa_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  spaId: uuid('spa_id').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  spaId: uuid('spa_id').notNull(),
  dealId: bigint('deal_id', { mode: 'number' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
