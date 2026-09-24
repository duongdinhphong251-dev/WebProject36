import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { hash } from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { count, eq, sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { cities, deals, spas, users } from './schema';

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5433),
    database: process.env.DB_NAME || 'tuoi_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  const db = drizzle(pool);
  try {
    await db.execute(
      sql.raw(
        readFileSync(resolve('drizzle/20260924_restructure.sql'), 'utf8'),
      ),
    );
    const accounts = [
      {
        role: 'admin',
        phone: process.env.SEED_ADMIN_PHONE || '0900000001',
        name: 'Admin',
        password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
      },
      {
        role: 'spa_owner',
        phone: process.env.SEED_OWNER_PHONE || '0900000002',
        name: 'Spa Owner',
        password: process.env.SEED_OWNER_PASSWORD || 'Owner@123456',
      },
      {
        role: 'user',
        phone: process.env.SEED_USER_PHONE || '0900000003',
        name: 'Demo User',
        password: process.env.SEED_USER_PASSWORD || 'User@123456',
      },
    ] as const;
    for (const account of accounts) {
      await db
        .insert(users)
        .values({
          id: randomUUID(),
          phone: account.phone,
          passwordHash: await hash(account.password, 12),
          fullName: account.name,
          role: account.role,
        })
        .onConflictDoNothing();
    }
    const owner = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, accounts[1].phone))
      .limit(1);
    const [cityCount] = await db.select({ value: count() }).from(cities);
    if (cityCount.value === 0) {
      await db.insert(cities).values([
        { id: 1, nameVi: 'Hà Nội', nameEn: 'Hanoi', slug: 'ha-noi' },
        {
          id: 2,
          nameVi: 'Hồ Chí Minh',
          nameEn: 'Ho Chi Minh City',
          slug: 'ho-chi-minh',
        },
        { id: 3, nameVi: 'Đà Nẵng', nameEn: 'Da Nang', slug: 'da-nang' },
      ]);
    }
    const [spaCount] = await db.select({ value: count() }).from(spas);
    if (spaCount.value === 0 && owner[0]) {
      const examples = [
        { name: 'Spa Hà Nội', cityId: 1, address: 'Hà Nội' },
        { name: 'Spa Sài Gòn', cityId: 2, address: 'TP. Hồ Chí Minh' },
        { name: 'Spa Đà Nẵng', cityId: 3, address: 'Đà Nẵng' },
      ];
      for (const example of examples) {
        const id = randomUUID();
        await db.insert(spas).values({
          id,
          name: example.name,
          slug: `demo-${example.cityId}`,
          address: example.address,
          phone: '0900000002',
          description: 'Spa mẫu để thực hành.',
          ownerId: owner[0].id,
          cityId: example.cityId,
          approvalStatus: 'approved',
        });
        await db.insert(deals).values({
          spaId: id,
          cityId: example.cityId,
          titleVi: `Voucher ${example.name}`,
          titleEn: `${example.name} voucher`,
          shortDescriptionVi: 'Voucher mẫu',
          priceVnd: 100000,
          approvalStatus: 'approved',
        });
      }
    }
    if (owner[0]) {
      await db
        .update(spas)
        .set({ ownerId: owner[0].id, approvalStatus: 'approved' })
        .where(sql`${spas.ownerId} IS NULL`);
    }
    console.log('Schema and demo accounts are ready.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
