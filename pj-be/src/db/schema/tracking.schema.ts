import { pgTable, bigserial, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export const trackingEvents = pgTable('tracking_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entitySlug: varchar('entity_slug', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return { enityTpeSlugTypeIdx: index('entity_type_slug_type_idx').on(table.entityType, table.entitySlug, table.eventType) }
});

