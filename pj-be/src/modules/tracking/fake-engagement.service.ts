import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { parseEnvFlag } from '../../common/utils/parse-env-flag.util';
import {
  pickDealSeedFakeCount,
  pickSpaSeedFakeCount,
} from '../../common/utils/fake-engagement-random.util';

type EntityType = 'spa' | 'deal';

@Injectable()
export class FakeEngagementService {
  private readonly logger = new Logger(FakeEngagementService.name);
  private readonly enabled = parseEnvFlag(process.env.FAKE_ENGAGEMENT_ENABLED, true);
  /** spaId → fake_count (process-local cache) */
  private readonly spaCache = new Map<string, number>();

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Batch fake cho listing — enrich sau paginate, cache trước DB. */
  async batchSpaFakeByIds(spaIds: string[]): Promise<Map<string, number>> {
    const unique = [...new Set(spaIds.filter(Boolean))];
    const out = new Map<string, number>();
    if (!this.enabled || unique.length === 0) return out;

    const misses: string[] = [];
    for (const id of unique) {
      const cached = this.spaCache.get(id);
      if (cached !== undefined) {
        out.set(id, cached);
      } else {
        misses.push(id);
      }
    }

    if (misses.length > 0) {
      const rows = await this.db
        .select({
          entityId: schema.entityFakeEngagement.entityId,
          fakeCount: schema.entityFakeEngagement.fakeCount,
        })
        .from(schema.entityFakeEngagement)
        .where(
          and(
            eq(schema.entityFakeEngagement.entityType, 'spa'),
            inArray(schema.entityFakeEngagement.entityId, misses),
          ),
        );

      const found = new Set<string>();
      for (const r of rows) {
        const n = Number(r.fakeCount ?? 0);
        this.spaCache.set(r.entityId, n);
        out.set(r.entityId, n);
        found.add(r.entityId);
      }

      const toSeed = misses.filter((id) => !found.has(id));
      if (toSeed.length > 0) {
        await Promise.all(toSeed.map((id) => this.ensureSpaFake(id)));
        for (const id of toSeed) {
          out.set(id, this.spaCache.get(id) ?? 0);
        }
      }
    }

    return out;
  }

  async getSpaFake(spaId: string): Promise<number> {
    if (!this.enabled) return 0;
    const cached = this.spaCache.get(spaId);
    if (cached !== undefined) return cached;
    return this.ensureSpaFake(spaId);
  }

  async getDealFake(dealId: string | number): Promise<number> {
    if (!this.enabled) return 0;
    const id = String(dealId);
    const [row] = await this.db
      .select({ fakeCount: schema.entityFakeEngagement.fakeCount })
      .from(schema.entityFakeEngagement)
      .where(
        and(
          eq(schema.entityFakeEngagement.entityType, 'deal'),
          eq(schema.entityFakeEngagement.entityId, id),
        ),
      )
      .limit(1);

    if (row) return Number(row.fakeCount ?? 0);
    return this.seedDealFake(id);
  }

  async incrementSpa(spaId: string): Promise<void> {
    if (!this.enabled) return;
    await this.ensureSpaFake(spaId);
    const next = (this.spaCache.get(spaId) ?? 0) + 1;
    this.spaCache.set(spaId, next);
    await this.db
      .update(schema.entityFakeEngagement)
      .set({
        fakeCount: sql`${schema.entityFakeEngagement.fakeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.entityFakeEngagement.entityType, 'spa'),
          eq(schema.entityFakeEngagement.entityId, spaId),
        ),
      );
  }

  async incrementDeal(dealId: string | number): Promise<void> {
    if (!this.enabled) return;
    const id = String(dealId);
    await this.getDealFake(id);
    await this.db
      .update(schema.entityFakeEngagement)
      .set({
        fakeCount: sql`${schema.entityFakeEngagement.fakeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.entityFakeEngagement.entityType, 'deal'),
          eq(schema.entityFakeEngagement.entityId, id),
        ),
      );
  }

  async sumDealFakesForSpa(dealIds: string[]): Promise<number> {
    if (!this.enabled || dealIds.length === 0) return 0;
    const rows = await this.db
      .select({ fakeCount: schema.entityFakeEngagement.fakeCount })
      .from(schema.entityFakeEngagement)
      .where(
        and(
          eq(schema.entityFakeEngagement.entityType, 'deal'),
          inArray(schema.entityFakeEngagement.entityId, dealIds),
        ),
      );
    return rows.reduce((s, r) => s + Number(r.fakeCount ?? 0), 0);
  }

  private async ensureSpaFake(spaId: string): Promise<number> {
    const cached = this.spaCache.get(spaId);
    if (cached !== undefined) return cached;

    const [row] = await this.db
      .select({ fakeCount: schema.entityFakeEngagement.fakeCount })
      .from(schema.entityFakeEngagement)
      .where(
        and(
          eq(schema.entityFakeEngagement.entityType, 'spa'),
          eq(schema.entityFakeEngagement.entityId, spaId),
        ),
      )
      .limit(1);

    if (row) {
      const n = Number(row.fakeCount ?? 0);
      this.spaCache.set(spaId, n);
      return n;
    }

    return this.seedSpaFake(spaId);
  }

  private async seedSpaFake(spaId: string): Promise<number> {
    const seed = pickSpaSeedFakeCount();
    await this.insertSeed('spa', spaId, seed);
    const n = await this.readFakeAfterSeed('spa', spaId, seed);
    this.spaCache.set(spaId, n);
    return n;
  }

  private async seedDealFake(dealId: string): Promise<number> {
    const seed = pickDealSeedFakeCount();
    await this.insertSeed('deal', dealId, seed);
    return this.readFakeAfterSeed('deal', dealId, seed);
  }

  private async insertSeed(type: EntityType, entityId: string, seed: number): Promise<void> {
    try {
      await this.db
        .insert(schema.entityFakeEngagement)
        .values({
          entityType: type,
          entityId,
          fakeCount: seed,
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    } catch (e) {
      this.logger.warn(`seed fake ${type}/${entityId}: ${(e as Error).message}`);
    }
  }

  private async readFakeAfterSeed(
    type: EntityType,
    entityId: string,
    fallback: number,
  ): Promise<number> {
    const [row] = await this.db
      .select({ fakeCount: schema.entityFakeEngagement.fakeCount })
      .from(schema.entityFakeEngagement)
      .where(
        and(
          eq(schema.entityFakeEngagement.entityType, type),
          eq(schema.entityFakeEngagement.entityId, entityId),
        ),
      )
      .limit(1);
    return Number(row?.fakeCount ?? fallback);
  }
}
