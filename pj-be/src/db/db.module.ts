import { Global, Module } from '@nestjs/common';
import { drizzleProvider } from './db.provider';

/**
 * Một `pg.Pool` / process (inject `DRIZZLE` ở mọi service).
 * Query song song trong cùng request vẫn dùng chung pool nhưng có thể checkout tới `DB_POOL_MAX` connection cùng lúc.
 */
@Global()
@Module({
  providers: [drizzleProvider],
  exports: [drizzleProvider],
})
export class DbModule {}
