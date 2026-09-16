import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { applySeoPattern } from './apply-seo-pattern.util';
import type { SeoComposeInput, SeoRenderedFields } from './seo.types';

export type SeoNodeType = 'category' | 'city' | 'district' | 'ward';

/** Default copy when no seo_node or no template row exists. */
function fallbackCopy(input: SeoComposeInput, pageKind: 'category' | 'city' | 'district'): SeoRenderedFields {
  const { entities: e, dealCount, locale } = input;
  const brand = 'Glow Explore';
  const s = e.serviceName || (locale === 'en' ? 'Deals' : locale === 'ko' ? '딜' : 'Ưu đãi');
  const sl = s.toLowerCase();

  if (locale === 'vi') {
    switch (pageKind) {
      case 'city':
        return {
          h1: `${s} ${e.cityName}`,
          title: `${s} ${e.cityName} — deals gần bạn`,
          metaDescription: `Khám phá ${dealCount}+ deal ${sl} tại ${e.cityName} — so sánh giá và đặt nhanh trên ${brand}.`,
        };
      case 'district':
        return {
          h1: `${s} ${e.districtName}, ${e.cityName}`,
          title: `${s} ${e.districtName} · ${e.cityName}`,
          metaDescription: `Ưu đãi ${sl} tại ${e.districtName}, ${e.cityName}: ${dealCount}+ lựa chọn. Xem ngay trên ${brand}.`,
        };
      default:
        return {
          h1: s,
          title: `${s} giá tốt`,
          metaDescription: `Tổng hợp ${dealCount}+ deal ${sl} chất lượng, cập nhật liên tục trên ${brand}.`,
        };
    }
  }

  if (locale === 'ko') {
    switch (pageKind) {
      case 'city':
        return {
          h1: `${e.cityName} ${s}`,
          title: `${e.cityName} ${s} 추천`,
          metaDescription: `${e.cityName} ${sl} ${dealCount}개 이상 한눈에 보기. 가격 비교 후 ${brand}에서 예약하세요.`,
        };
      case 'district':
        return {
          h1: `${e.cityName} ${e.districtName} ${s}`,
          title: `${e.districtName}, ${e.cityName} ${s}`,
          metaDescription: `${e.cityName} ${e.districtName} 인근 ${sl} ${dealCount}개+. ${brand}에서 바로 확인.`,
        };
      default:
        return {
          h1: s,
          title: `${s} 베스트 특가`,
          metaDescription: `${brand}에서 검증된 ${sl} ${dealCount}개 이상. 실시간 업데이트.`,
        };
    }
  }

  // en
  switch (pageKind) {
    case 'city':
      return {
        h1: `${s} ${e.cityName}`,
        title: `${s} ${e.cityName} — book near you`,
        metaDescription: `Browse ${dealCount}+ verified ${sl} deals in ${e.cityName}. Compare options on ${brand}.`,
      };
    case 'district':
      return {
        h1: `${s} ${e.districtName}, ${e.cityName}`,
        title: `${s} near ${e.districtName}, ${e.cityName}`,
        metaDescription: `${dealCount}+ ${sl} picks near ${e.districtName}, ${e.cityName}. Best prices on ${brand}.`,
      };
    default:
      return {
        h1: s,
        title: `${s} — curated deals`,
        metaDescription: `${dealCount}+ ${sl} offers in one place — ${brand}.`,
      };
  }
}

/** Ward node: copy references ward when present. */
function fallbackWardCopy(input: SeoComposeInput): SeoRenderedFields {
  const { entities: e, dealCount, locale } = input;
  const brand = 'Glow Explore';
  const s = e.serviceName || (locale === 'en' ? 'Deals' : locale === 'ko' ? '딜' : 'Ưu đãi');
  const sl = s.toLowerCase();
  const loc = e.wardName ? `${e.wardName}, ${e.districtName}, ${e.cityName}` : `${e.districtName}, ${e.cityName}`;

  if (locale === 'vi') {
    return {
      h1: `${s} ${loc}`,
      title: `${s} ${loc}`,
      metaDescription: `${dealCount}+ ưu đãi ${sl} gần ${loc}. Xem và so sánh trên ${brand}.`,
    };
  }
  if (locale === 'ko') {
    return {
      h1: `${loc} ${s}`,
      title: `${loc} ${s}`,
      metaDescription: `${loc} 주변 ${sl} ${dealCount}개+. ${brand}에서 빠르게 예약.`,
    };
  }
  return {
    h1: `${s} ${loc}`,
    title: `${s} near ${loc}`,
    metaDescription: `${dealCount}+ ${sl} options near ${loc} on ${brand}.`,
  };
}

@Injectable()
export class SeoTemplateService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private buildVarMap(input: SeoComposeInput): Record<string, string> {
    const e = input.entities;
    const dc = String(input.dealCount);
    const sc = String(input.spaCount ?? input.seoNode?.spaCount ?? 0);
    return {
      service: e.serviceName,
      city: e.cityName,
      district: e.districtName,
      ward: e.wardName,
      deal_count: dc,
      spa_count: sc,
      brand: 'Glow Explore',
    };
  }

  /** Prefer node.template_id when set; else match node_type + locale (with vi fallback). */
  async loadTemplateForNode(node: { templateId: number | null; nodeType: string | null }, locale: string) {
    const wanted = locale.toLowerCase();
    if (node.templateId != null) {
      const [byId] = await this.db
        .select()
        .from(schema.seoTemplates)
        .where(and(eq(schema.seoTemplates.id, node.templateId), eq(schema.seoTemplates.isActive, true)))
        .limit(1);
      if (byId && (byId.locale ?? '').toLowerCase() === wanted) {
        return byId;
      }
    }
    return this.loadTemplateRow(node.nodeType ?? 'category', locale);
  }

  private async loadTemplateRow(nodeType: string, locale: string) {
    const wanted = locale.toLowerCase();
    const [exact] = await this.db
      .select()
      .from(schema.seoTemplates)
      .where(
        and(
          eq(schema.seoTemplates.nodeType, nodeType),
          eq(schema.seoTemplates.locale, wanted),
          eq(schema.seoTemplates.isActive, true),
        ),
      )
      .orderBy(desc(schema.seoTemplates.id))
      .limit(1);
    if (exact) return exact;
    if (wanted === 'vi') return null;
    const [viFallback] = await this.db
      .select()
      .from(schema.seoTemplates)
      .where(
        and(
          eq(schema.seoTemplates.nodeType, nodeType),
          eq(schema.seoTemplates.locale, 'vi'),
          eq(schema.seoTemplates.isActive, true),
        ),
      )
      .orderBy(desc(schema.seoTemplates.id))
      .limit(1);
    return viFallback ?? null;
  }

  /**
   * Priority: per-field override on seo_node → template patterns → stored node h1/title/meta → code fallback.
   */
  async composePageSeo(
    input: SeoComposeInput,
    pageKindForFallback: 'category' | 'city' | 'district',
  ): Promise<SeoRenderedFields> {
    const node = input.seoNode;
    const nodeType = (node?.nodeType ?? 'category') as string;
    const vars = this.buildVarMap(input);
    const localeStr = input.locale;

    const tpl = node ? await this.loadTemplateForNode(node, localeStr) : null;
    const fromTemplate: SeoRenderedFields | null = tpl
      ? {
          h1: applySeoPattern(tpl.h1Pattern, vars),
          title: applySeoPattern(tpl.titlePattern, vars),
          metaDescription: applySeoPattern(tpl.metaPattern, vars),
        }
      : null;

    /** Vi-only seo_nodes are reused for en/ko URLs; stored h1/title/meta stay Vietnamese — skip them. */
    const skipNodeStoredCopy =
      !!node && (node.locale ?? '').toLowerCase() !== localeStr.toLowerCase();

    const fromNodeStored: SeoRenderedFields | null = node
      ? {
          h1: skipNodeStoredCopy ? '' : (node.h1 ?? ''),
          title: skipNodeStoredCopy ? '' : (node.title ?? ''),
          metaDescription: skipNodeStoredCopy ? '' : (node.metaDescription ?? ''),
        }
      : null;

    const fb =
      nodeType === 'ward'
        ? fallbackWardCopy(input)
        : fallbackCopy(input, pageKindForFallback);

    const base: SeoRenderedFields = {
      h1: fromTemplate?.h1 || fromNodeStored?.h1 || fb.h1,
      title: fromTemplate?.title || fromNodeStored?.title || fb.title,
      metaDescription: fromTemplate?.metaDescription || fromNodeStored?.metaDescription || fb.metaDescription,
    };

    return {
      h1: node?.h1Override?.trim() || base.h1,
      title: node?.titleOverride?.trim() || base.title,
      metaDescription: node?.metaOverride?.trim() || base.metaDescription,
    };
  }
}
