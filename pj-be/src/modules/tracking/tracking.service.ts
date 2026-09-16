import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { canonicalDealSlug } from '../../common/utils/canonical-deal-slug.util';
import { FakeEngagementService } from './fake-engagement.service';

type EntityType = 'deal' | 'spa';

@Injectable()
export class TrackingService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly fakeEngagement: FakeEngagementService,
  ) {}

  private async getRealEngagementCount(slug: string, entityType: EntityType): Promise<number> {
    const [result] = await this.db
      .select({ viewCount: count() })
      .from(schema.trackingEvents)
      .where(
        and(
          eq(schema.trackingEvents.entitySlug, slug),
          eq(schema.trackingEvents.entityType, entityType),
          inArray(schema.trackingEvents.eventType, ['view', 'click']),
        ),
      );

    return Number(result?.viewCount ?? 0);
  }

  private async batchRealSpaEngagementBySlug(slugs: string[]): Promise<Map<string, number>> {
    const unique = [...new Set(slugs.filter(Boolean))];
    if (unique.length === 0) return new Map();

    const rows = await this.db
      .select({
        slug: schema.trackingEvents.entitySlug,
        c: count(),
      })
      .from(schema.trackingEvents)
      .where(
        and(
          eq(schema.trackingEvents.entityType, 'spa'),
          inArray(schema.trackingEvents.entitySlug, unique),
          inArray(schema.trackingEvents.eventType, ['view', 'click']),
        ),
      )
      .groupBy(schema.trackingEvents.entitySlug);

    return new Map(rows.map((r) => [r.slug, Number(r.c ?? 0)]));
  }

  /** Enrich sau paginate: fake (cache + DB) + tracking thật theo slug. */
  async batchSpaDisplayEngagement(
    entries: Array<{ spaId: string; slug: string }>,
  ): Promise<Map<string, number>> {
    const uniqueEntries = entries.filter((e) => e.spaId && e.slug);
    if (uniqueEntries.length === 0) return new Map();

    const spaIds = uniqueEntries.map((e) => e.spaId);
    const slugs = uniqueEntries.map((e) => e.slug);

    const [fakeBySpaId, realBySlug] = await Promise.all([
      this.fakeEngagement.batchSpaFakeByIds(spaIds),
      this.batchRealSpaEngagementBySlug(slugs),
    ]);

    const out = new Map<string, number>();
    for (const { spaId, slug } of uniqueEntries) {
      const fake = fakeBySpaId.get(spaId) ?? 0;
      const real = realBySlug.get(slug) ?? 0;
      out.set(slug, fake + real);
    }
    return out;
  }

  async getEngagementCount(slug: string, entityType: EntityType): Promise<number> {
    const real = await this.getRealEngagementCount(slug, entityType);
    if (!this.fakeEngagement.isEnabled()) return real;

    if (entityType === 'spa') {
      const spaId = await this.resolveSpaIdBySlug(slug);
      const fake = spaId ? await this.fakeEngagement.getSpaFake(spaId) : 0;
      return fake + real;
    }

    const dealId = await this.resolveDealIdBySlug(slug);
    const fake = dealId ? await this.fakeEngagement.getDealFake(dealId) : 0;
    return fake + real;
  }

  async getSpaStoreEngagementCount(spaId: string): Promise<number> {
    const [spaRow] = await this.db
      .select({ slug: schema.spas.slug })
      .from(schema.spas)
      .where(eq(schema.spas.id, spaId))
      .limit(1);

    if (!spaRow?.slug) return 0;

    const dealRows = await this.db
      .select({ slugVi: schema.deals.slugVi, id: schema.deals.id })
      .from(schema.deals)
      .where(eq(schema.deals.spaId, spaId));

    const dealSlugs = [...new Set(dealRows.map((r) => canonicalDealSlug(r.slugVi, r.id)))];
    const dealIds = dealRows.map((r) => String(r.id));

    const parts = [
      and(eq(schema.trackingEvents.entityType, 'spa'), eq(schema.trackingEvents.entitySlug, spaRow.slug)),
      ...dealSlugs.map((s) =>
        and(eq(schema.trackingEvents.entityType, 'deal'), eq(schema.trackingEvents.entitySlug, s)),
      ),
    ];

    const [result] = await this.db
      .select({ c: count() })
      .from(schema.trackingEvents)
      .where(and(inArray(schema.trackingEvents.eventType, ['view', 'click']), or(...parts)));

    const real = Number(result?.c ?? 0);
    if (!this.fakeEngagement.isEnabled()) return real;

    const [spaFake, dealFakeSum] = await Promise.all([
      this.fakeEngagement.getSpaFake(spaId),
      this.fakeEngagement.sumDealFakesForSpa(dealIds),
    ]);
    return spaFake + dealFakeSum + real;
  }

  async getDealEngagementCount(slugVi: string | null | undefined, dealId: number): Promise<number> {
    const canonical = canonicalDealSlug(slugVi, dealId);
    const rawPrefix = slugVi?.split('#')[0]?.trim() ?? '';
    const slugVariants = [...new Set([canonical, rawPrefix].filter((s) => s.length > 0))];

    const parts = slugVariants.map((s) =>
      and(eq(schema.trackingEvents.entityType, 'deal'), eq(schema.trackingEvents.entitySlug, s)),
    );

    const [result] = await this.db
      .select({ c: count() })
      .from(schema.trackingEvents)
      .where(and(inArray(schema.trackingEvents.eventType, ['view', 'click']), or(...parts)));

    const real = Number(result?.c ?? 0);
    if (!this.fakeEngagement.isEnabled()) return real;

    const fake = await this.fakeEngagement.getDealFake(dealId);
    return fake + real;
  }

  async recordView(
    slug: string,
    entityType: EntityType,
    ip?: string,
    userAgent?: string,
  ): Promise<number> {
    await this.db.insert(schema.trackingEvents).values({
      entitySlug: slug,
      entityType,
      eventType: 'view',
      ipAddress: ip ?? null,
      userAgent: userAgent ?? null,
    });

    return this.getEngagementCount(slug, entityType);
  }

  async recordClick(
    slug: string,
    entityType: EntityType,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.db.insert(schema.trackingEvents).values({
      entitySlug: slug,
      entityType,
      eventType: 'click',
      ipAddress: ip ?? null,
      userAgent: userAgent ?? null,
    });
  }

  private async resolveSpaIdBySlug(slug: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: schema.spas.id })
      .from(schema.spas)
      .where(eq(schema.spas.slug, slug))
      .limit(1);
    return row?.id ?? null;
  }

  private async resolveDealIdBySlug(slug: string): Promise<string | null> {
    const idSuffix = slug.match(/-(\d+)$/)?.[1];
    if (idSuffix) {
      const dealId = Number.parseInt(idSuffix, 10);
      if (Number.isFinite(dealId)) {
        const [byId] = await this.db
          .select({ id: schema.deals.id })
          .from(schema.deals)
          .where(eq(schema.deals.id, dealId))
          .limit(1);
        if (byId?.id != null) return String(byId.id);
      }
    }

    const rawPrefix = slug.split('#')[0]?.trim() ?? '';
    const slugCandidates = [...new Set([slug, rawPrefix].filter((s) => s.length > 0))];
    if (slugCandidates.length === 0) return null;

    const [bySlug] = await this.db
      .select({ id: schema.deals.id })
      .from(schema.deals)
      .where(or(...slugCandidates.map((s) => eq(schema.deals.slugVi, s))))
      .limit(1);

    return bySlug?.id != null ? String(bySlug.id) : null;
  }
}
