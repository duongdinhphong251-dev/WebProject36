import { bigserial, boolean, index, integer, pgTable, text, timestamp, varchar, uuid } from 'drizzle-orm/pg-core';

export const banners = pgTable('banners', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  nameVi: varchar('name_vi', { length: 255 }),
  nameEn: varchar('name_en', { length: 255 }),
  nameKo: varchar('name_ko', { length: 255 }),
  placement: varchar('placement', { length: 50 }).notNull(),
  slotNumber: integer('slot_number'),
  imageUrl: text('image_url').notNull(),
  imageUrlVi: text('image_url_vi'),
  imageUrlEn: text('image_url_en'),
  imageUrlKo: text('image_url_ko'),
  targetUrl: text('target_url').notNull(),
  gaClickTag: varchar('ga_click_tag', { length: 255 }),
  spaId: uuid('spa_id'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    placementEnabledOrderIdx: index('banners_placement_enabled_order_idx').on(
      table.placement,
      table.isEnabled,
      table.displayOrder,
    ),
    placementSlotIdx: index('banners_placement_slot_idx').on(table.placement, table.slotNumber),
  };
});
