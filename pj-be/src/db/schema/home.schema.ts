import { pgTable, bigint, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const homepageSlots = pgTable('homepage_slots', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  slotKey: varchar('slot_key', { length: 100 }).notNull(),
  locale: varchar('locale', { length: 10 }),
  cityId: bigint('city_id', { mode: 'number' }),
  dealId: bigint('deal_id', { mode: 'number' }),
  title: varchar('title', { length: 255 }),
  subtitle: text('subtitle'),
  imageUrl: text('image_url'),
  startAt: timestamp('start_at', { withTimezone: true }),
  endAt: timestamp('end_at', { withTimezone: true }),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => {
  return {
    slotKeyIdx: index('slot_key_idx').on(table.slotKey, table.locale)
  }
});
