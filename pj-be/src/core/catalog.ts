import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { and, eq, desc, lt } from 'drizzle-orm';
import { DbService } from './db';
import { cities, deals, reviews, spas, users } from './schema';
import { POSTGRES_UUID, PositiveIntPipe, UuidPipe } from './ids';

export class CityQueryDto {
  @ApiPropertyOptional({ example: 'ha-noi' })
  @IsOptional()
  @IsString()
  city?: string;
}

export class DealQueryDto extends CityQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(POSTGRES_UUID)
  spaId?: string;
}

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly db: DbService) {}

  private async expireDeals() {
    await this.db.client
      .update(deals)
      .set({ approvalStatus: 'expired' })
      .where(
        and(eq(deals.approvalStatus, 'approved'), lt(deals.endAt, new Date())),
      );
  }

  @Get('cities')
  @ApiOperation({ summary: 'List cities' })
  cities() {
    return this.db.client.select().from(cities).orderBy(cities.id);
  }

  @Get('spas')
  @ApiOperation({ summary: 'List approved spas, optionally by city' })
  @ApiQuery({ name: 'city', required: false })
  spas(@Query() query: CityQueryDto) {
    return this.db.client
      .select({
        id: spas.id,
        name: spas.name,
        slug: spas.slug,
        address: spas.address,
        description: spas.description,
        image: spas.spaAvatar,
        city: cities.slug,
      })
      .from(spas)
      .leftJoin(cities, eq(spas.cityId, cities.id))
      .where(
        and(
          eq(spas.approvalStatus, 'approved'),
          query.city ? eq(cities.slug, query.city) : undefined,
        ),
      )
      .orderBy(desc(spas.createdAt));
  }

  @Get('spas/:id')
  @ApiOperation({ summary: 'Get an approved spa and its reviews' })
  async spa(@Param('id', UuidPipe) id: string) {
    const row = await this.db.client
      .select({
        id: spas.id,
        name: spas.name,
        slug: spas.slug,
        address: spas.address,
        description: spas.description,
        phone: spas.phone,
        zalo: spas.messagingLinkZalo,
        image: spas.spaAvatar,
        city: cities.slug,
      })
      .from(spas)
      .leftJoin(cities, eq(spas.cityId, cities.id))
      .where(and(eq(spas.id, id), eq(spas.approvalStatus, 'approved')))
      .limit(1);
    if (!row[0]) throw new NotFoundException();
    const spaReviews = await this.db.client
      .select({
        rating: reviews.rating,
        comment: reviews.comment,
        author: users.fullName,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.spaId, id))
      .orderBy(desc(reviews.createdAt));
    return { ...row[0], reviews: spaReviews };
  }

  @Get('deals')
  @ApiOperation({ summary: 'List approved vouchers, optionally by city' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'spaId', required: false })
  async deals(@Query() query: DealQueryDto) {
    await this.expireDeals();
    return this.db.client
      .select({
        id: deals.id,
        spaId: deals.spaId,
        spaName: spas.name,
        titleVi: deals.titleVi,
        titleEn: deals.titleEn,
        description: deals.shortDescriptionVi,
        image: deals.coverImageUrl,
        priceVnd: deals.priceVnd,
        discountPercent: deals.discountPercent,
        city: cities.slug,
      })
      .from(deals)
      .innerJoin(spas, eq(deals.spaId, spas.id))
      .leftJoin(cities, eq(spas.cityId, cities.id))
      .where(
        and(
          eq(deals.approvalStatus, 'approved'),
          eq(spas.approvalStatus, 'approved'),
          query.city ? eq(cities.slug, query.city) : undefined,
          query.spaId ? eq(spas.id, query.spaId) : undefined,
        ),
      )
      .orderBy(desc(deals.createdAt));
  }

  @Get('deals/:id')
  @ApiOperation({ summary: 'Get an approved voucher' })
  async deal(@Param('id', PositiveIntPipe) id: number) {
    await this.expireDeals();
    const row = await this.db.client
      .select({
        id: deals.id,
        spaId: deals.spaId,
        spaName: spas.name,
        titleVi: deals.titleVi,
        titleEn: deals.titleEn,
        description: deals.shortDescriptionVi,
        image: deals.coverImageUrl,
        priceVnd: deals.priceVnd,
        discountPercent: deals.discountPercent,
      })
      .from(deals)
      .innerJoin(spas, eq(deals.spaId, spas.id))
      .where(
        and(
          eq(deals.id, id),
          eq(deals.approvalStatus, 'approved'),
          eq(spas.approvalStatus, 'approved'),
        ),
      )
      .limit(1);
    if (!row[0]) throw new NotFoundException();
    return row[0];
  }
}
