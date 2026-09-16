import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

async function ensureEssentialSchema(db: ReturnType<typeof drizzle<typeof schema>>) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "banners" (
      "id" bigserial PRIMARY KEY NOT NULL,
      "name" varchar(255) NOT NULL,
      "name_vi" varchar(255),
      "name_en" varchar(255),
      "name_ko" varchar(255),
      "placement" varchar(50) NOT NULL,
      "slot_number" integer,
      "image_url" text NOT NULL,
      "image_url_vi" text,
      "image_url_en" text,
      "image_url_ko" text,
      "target_url" text NOT NULL,
      "ga_click_tag" varchar(255),
      "is_enabled" boolean DEFAULT true NOT NULL,
      "display_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "banners_placement_enabled_order_idx"
    ON "banners" USING btree ("placement","is_enabled","display_order")
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "banners_placement_slot_idx"
    ON "banners" USING btree ("placement","slot_number")
  `);
}

function parseEnvFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export const drizzleProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    // Mặc định 5/instance — Cloud Run max-instances=10 → ~50 conn; tránh vượt max_connections Postgres.
    const poolMax = config.get<number>('DB_POOL_MAX') ?? 5;
    const bootTimeoutMs = config.get<number>('DB_BOOT_TIMEOUT_MS') ?? 12_000;
    const runMigrations = parseEnvFlag(config.get<string>('DB_RUN_MIGRATIONS'), true);
    const bootstrapSchema = parseEnvFlag(config.get<string>('DB_BOOTSTRAP_SCHEMA'), true);

    const pool = new Pool({
      host: config.getOrThrow<string>('DB_HOST'),
      port: config.getOrThrow<number>('DB_PORT'),
      database: config.getOrThrow<string>('DB_NAME'),
      user: config.getOrThrow<string>('DB_USER'),
      password: config.getOrThrow<string>('DB_PASSWORD'),
      max: poolMax,
      connectionTimeoutMillis: bootTimeoutMs,
      idleTimeoutMillis: 30_000,
      allowExitOnIdle: true,
    });

    pool.on('connect', () => console.log('Database connected'));
    pool.on('error', (err) => console.error('Database pool error:', err));

    const db = drizzle(pool, { schema });
    const migrationsFolder = join(process.cwd(), 'drizzle');

    try {
      await withTimeout(pool.query('select 1'), bootTimeoutMs, 'Database connectivity check');
      console.log('Database connectivity check passed.');
    } catch (err) {
      console.error('Database connectivity check failed:', err);
      await pool.end().catch(() => undefined);
      throw err;
    }

    // Tự động chạy migration khi khởi động NestJS
    if (runMigrations) {
      try {
        console.log(`Running database migrations from: ${migrationsFolder}`);

        if (!existsSync(migrationsFolder)) {
          console.warn(`Migrations folder not found: ${migrationsFolder}`);
        } else {
          await withTimeout(
            migrate(db, { migrationsFolder }),
            bootTimeoutMs,
            'Database migrations',
          );
          console.log('Database migrations completed successfully!');
        }
      } catch (err) {
        console.error('Database migration failed:', err);
      }
    } else {
      console.warn('Skipping database migrations because DB_RUN_MIGRATIONS is disabled.');
    }

    if (bootstrapSchema) {
      try {
        await withTimeout(
          ensureEssentialSchema(db),
          bootTimeoutMs,
          'Essential schema bootstrap',
        );
        console.log('Essential schema bootstrap completed successfully.');
      } catch (err) {
        console.error('Essential schema bootstrap failed:', err);
        await pool.end().catch(() => undefined);
        throw err;
      }
    } else {
      console.warn('Skipping essential schema bootstrap because DB_BOOTSTRAP_SCHEMA is disabled.');
    }

    return db;
  },
};
