import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE } from '../../db/db.provider';
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from '../../db/schema';
import { ServiceSuggestResponseDto } from "./dto/search-suggest.dto";
import { and, ilike, eq, or, sql, isNull } from "drizzle-orm";
import { dealWithinPublicationWindow } from '../../common/utils/deal-publication-window.util';


@Injectable()
export class SearchService {
    constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) { }
    async suggest(keyword: string, lang: string = 'vi'): Promise<ServiceSuggestResponseDto> {
        const searchTerm = `%${keyword}%`;

        const serviceRows = await this.db.select({
            id: schema.services.id,
            nameVi: schema.services.nameVi,
            nameEn: schema.services.nameEn,
            nameKo: schema.services.nameKo,
            slugVi: schema.services.slugVi,
            slugEn: schema.services.slugEn,
            slugKo: schema.services.slugKo,
        })
            .from(schema.services)
            .where(
                and(
                    eq(schema.services.isActive, true),
                    or(
                        ilike(schema.services.nameVi, searchTerm),
                        ilike(schema.services.nameEn, searchTerm),
                        ilike(schema.services.nameKo, searchTerm)
                    )
                )
            )
            .limit(5);

        const cityRows = await this.db.select({
            id: schema.cities.id,
            nameVi: schema.cities.nameVi,
            nameEn: schema.cities.nameEn,
            nameKo: schema.cities.nameKo,
            url: schema.cities.slug
        })
            .from(schema.cities)
            .where(
                and(
                    eq(schema.cities.isActive, true),
                    or(
                        ilike(schema.cities.nameVi, searchTerm),
                        ilike(schema.cities.nameEn, searchTerm),
                        ilike(schema.cities.nameKo, searchTerm)
                    )
                )
            )
            .limit(5);

        const districtRows = await this.db.select({
            id: schema.districts.id,
            nameVi: schema.districts.nameVi,
            nameEn: schema.districts.nameEn,
            nameKo: schema.districts.nameKo,
            url: schema.districts.slug,
            citySlug: schema.cities.slug,
        })
            .from(schema.districts)
            .leftJoin(schema.cities, eq(schema.districts.cityId, schema.cities.id))
            .where(
                and(
                    eq(schema.districts.isActive, true),
                    ilike(schema.districts.nameVi, searchTerm)
                )
            )
            .limit(5);

        const spaRows = await this.db.select({
            numId: schema.spas.numId,
            name: schema.spas.name,
            url: schema.spas.slug
        })
            .from(schema.spas)
            .where(
                and(
                    sql`${schema.spas.isTest} IS NOT TRUE`,
                    ilike(schema.spas.name, searchTerm)
                )
            )
            .limit(5);

        const dealRows = await this.db.select({
            id: schema.deals.id,
            titleVi: schema.deals.titleVi,
            titleEn: schema.deals.titleEn,
            titleKo: schema.deals.titleKo,
            slugVi: schema.deals.slugVi,
            slugEn: schema.deals.slugEn,
            slugKo: schema.deals.slugKo,
        })
            .from(schema.deals)
            .where(
                and(
                    or(
                        ilike(schema.deals.titleVi, searchTerm),
                        ilike(schema.deals.titleEn, searchTerm),
                        ilike(schema.deals.titleKo, searchTerm)
                    ),
                    eq(schema.deals.status, 'active'),
                    dealWithinPublicationWindow(),
                    or(isNull(schema.deals.isSoldOut), eq(schema.deals.isSoldOut, false))
                )
            )
            .limit(5);

        const getLocalized = (vi: string | null, en: string | null, ko: string | null, defaultVal: string = "") => {
            if (lang === 'en' && en) return en;
            if (lang === 'ko' && ko) return ko;
            return vi || defaultVal;
        };

        const service = serviceRows.map(s => ({
            id: Number(s.id),
            name: getLocalized(s.nameVi, s.nameEn, s.nameKo, ""),
            url: `/${getLocalized(s.slugVi, s.slugEn, s.slugKo, "")}`
        }));

        const spa = spaRows.map(s => ({
            id: Number(s.numId),
            name: s.name ?? "",
            url: `/${s.url ?? ""}`
        }))
        const deal = dealRows.map(d => ({
            id: Number(d.id),
            name: getLocalized(d.titleVi, d.titleEn, d.titleKo, ""),
            url: `/${getLocalized(d.slugVi, d.slugEn, d.slugKo, "")}`
        }))
        const location = [
            ...cityRows.map(c => ({
                id: Number(c.id),
                name: getLocalized(c.nameVi, c.nameEn, c.nameKo, ""),
                url: `/${c.url}`,
            })),
            ...districtRows.map(d => ({
                id: Number(d.id),
                name: getLocalized(d.nameVi, d.nameEn, d.nameKo, ""),
                url: `/${d.citySlug}/${d.url}`,
            }))
        ];
        return { service, spa, deal, location }
    }
}
