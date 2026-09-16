import { pgTable, uuid, text, numeric, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const spaServiceItems = pgTable('spa_service_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  spaId: uuid('spa_id').notNull(),
  serviceName: text('service_name').notNull(),
  originalPrice: numeric('original_price'),
  discountPrice: numeric('discount_price'),
  durationMinutes: integer('duration_minutes'),
  packageInfo: text('package_info'),
  sourceImageUrl: text('source_image_url'),
  rawOcrJson: jsonb('raw_ocr_json'),
  extractedAt: timestamp('extracted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }),
});
