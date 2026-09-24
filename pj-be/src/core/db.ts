import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5433),
    database: process.env.DB_NAME || 'tuoi_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 5,
  });
  readonly client = drizzle(this.pool);
  async onModuleDestroy() {
    await this.pool.end();
  }
}
