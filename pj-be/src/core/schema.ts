import {
  bigint,
  bigserial,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  unique,
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
  ownerId: uuid('owner_id').references(() => users.id),
  cityId: bigint('city_id', { mode: 'number' }).references(() => cities.id),
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

export const savedSpas = pgTable(
  'saved_spas',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    spaId: uuid('spa_id')
      .notNull()
      .references(() => spas.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.spaId] })],
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    spaId: uuid('spa_id')
      .notNull()
      .references(() => spas.id),
    rating: integer('rating').notNull(),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.userId, table.spaId)],
);

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  spaId: uuid('spa_id')
    .notNull()
    .references(() => spas.id),
  dealId: bigint('deal_id', { mode: 'number' }).references(() => deals.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const claimedVouchers = pgTable(
  'claimed_vouchers',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dealId: bigint('deal_id', { mode: 'number' })
      .notNull()
      .references(() => deals.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('available'),
    claimedAt: timestamp('claimed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.dealId] })],
);
