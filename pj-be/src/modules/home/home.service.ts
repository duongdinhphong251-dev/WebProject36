import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { HeroBannerResponseDto, PromoBannerResponseDto } from './dto/banner-response.dto';

// Điều kiện thời gian: start_at IS NULL hoặc start_at <= NOW()
//                   + end_at IS NULL hoặc end_at >= NOW()
const timeCondition = and(
  or(isNull(schema.homepageSlots.startAt), sql`${schema.homepageSlots.startAt} <= NOW()`),
  or(isNull(schema.homepageSlots.endAt), sql`${schema.homepageSlots.endAt} >= NOW()`),
);

@Injectable()
export class HomeService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getHeroBanners(locale?: string): Promise<HeroBannerResponseDto[]> {
    const rows = await this.db
      .select()
      .from(schema.homepageSlots)
      .where(
        and(
          eq(schema.homepageSlots.isActive, true),
          sql`${schema.homepageSlots.slotKey} LIKE ${'hero%'}`,
          this.localeCondition(locale),
          timeCondition,
        ),
      )
      .orderBy(schema.homepageSlots.id);

    return rows.map((r) => ({
      id: r.id,
      slotKey: r.slotKey,
      title: r.title ?? null,
      subtitle: r.subtitle ?? null,
      imageUrl: r.imageUrl ?? null,
      dealId: r.dealId ?? null,
      startAt: r.startAt ?? null,
      endAt: r.endAt ?? null,
    }));
  }

  async getPromoBanners(locale?: string): Promise<PromoBannerResponseDto[]> {
    const rows = await this.db
      .select()
      .from(schema.homepageSlots)
      .where(
        and(
          eq(schema.homepageSlots.isActive, true),
          sql`${schema.homepageSlots.slotKey} LIKE ${'promo%'}`,
          this.localeCondition(locale),
          timeCondition,
        ),
      )
      .orderBy(schema.homepageSlots.id);

    return rows.map((r) => ({
      id: r.id,
      slotKey: r.slotKey,
      title: r.title ?? null,
      subtitle: r.subtitle ?? null,
      imageUrl: r.imageUrl ?? null,
      dealId: r.dealId ?? null,
      startAt: r.startAt ?? null,
      endAt: r.endAt ?? null,
      // "promo_after_flash" → "after_flash"
      position: r.slotKey.startsWith('promo_') ? r.slotKey.slice('promo_'.length) : null,
    }));
  }

  /** Nếu locale được truyền: lấy bản ghi có locale khớp HOẶC locale IS NULL */
  private localeCondition(locale?: string) {
    if (!locale) return undefined;
    return or(eq(schema.homepageSlots.locale, locale), isNull(schema.homepageSlots.locale));
  }
}
