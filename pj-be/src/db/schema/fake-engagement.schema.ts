import { integer, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core';

/** Base engagement offset per entity (spa UUID / deal id). Shown as fake_count + real tracking. */
export const entityFakeEngagement = pgTable(
  'entity_fake_engagement',
  {
    entityType: varchar('entity_type', { length: 10 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }).notNull(),
    fakeCount: integer('fake_count').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.entityType, table.entityId] }),
  }),
);
