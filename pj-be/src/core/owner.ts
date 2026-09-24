import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
} from 'class-validator';
import { randomUUID } from 'node:crypto';
import { and, count, eq, inArray } from 'drizzle-orm';
import { Roles } from './auth';
import type { AuthRequest } from './auth';
import { DbService } from './db';
import { bookings, cities, deals, spas, users } from './schema';

export class SpaDto {
  @ApiProperty()
  @IsString()
  name!: string;
  @ApiProperty()
  @IsString()
  address!: string;
  @ApiProperty()
  @IsString()
  description!: string;
  @ApiProperty()
  @IsString()
  phone!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  zalo?: string;
  @ApiProperty()
  @IsInt()
  cityId!: number;
}
export class EditSpaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  zalo?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cityId?: number;
}
export class DealDto {
  @ApiProperty()
  @IsUUID()
  spaId!: string;
  @ApiProperty()
  @IsString()
  titleVi!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;
  @ApiProperty()
  @IsString()
  description!: string;
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  priceVnd!: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}
export class EditDealDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleVi?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceVnd?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

@ApiTags('owner')
@ApiBearerAuth()
@Roles('spa_owner')
@Controller('owner')
export class OwnerController {
  constructor(private readonly db: DbService) {}

  private async ownSpa(ownerId: string, spaId: string) {
    const row = await this.db.client
      .select({ id: spas.id })
      .from(spas)
      .where(and(eq(spas.id, spaId), eq(spas.ownerId, ownerId)))
      .limit(1);
    if (!row[0]) throw new ForbiddenException('This spa is not yours');
  }

  private async ownDeal(ownerId: string, dealId: number) {
    const row = await this.db.client
      .select({ spaId: spas.id })
      .from(deals)
      .innerJoin(spas, eq(deals.spaId, spas.id))
      .where(and(eq(deals.id, dealId), eq(spas.ownerId, ownerId)))
      .limit(1);
    if (!row[0]) throw new ForbiddenException('This voucher is not yours');
  }

  @Get('spas')
  @ApiOperation({ summary: 'List my spas' })
  listSpas(@Req() req: AuthRequest) {
    return this.db.client
      .select({
        id: spas.id,
        name: spas.name,
        address: spas.address,
        description: spas.description,
        phone: spas.phone,
        zalo: spas.messagingLinkZalo,
        cityId: spas.cityId,
        approvalStatus: spas.approvalStatus,
      })
      .from(spas)
      .where(eq(spas.ownerId, req.identity.userId));
  }

  @Post('spas')
  @ApiOperation({ summary: 'Create spa for admin approval' })
  @ApiBody({ type: SpaDto })
  async createSpa(@Req() req: AuthRequest, @Body() input: SpaDto) {
    const city = await this.db.client
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.id, input.cityId))
      .limit(1);
    if (!city[0]) throw new BadRequestException('City not found');
    const id = randomUUID();
    await this.db.client.insert(spas).values({
      id,
      ownerId: req.identity.userId,
      name: input.name,
      slug: `${input.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')}-${id.slice(0, 8)}`,
      address: input.address,
      description: input.description,
      phone: input.phone,
      messagingLinkZalo: input.zalo,
      cityId: input.cityId,
      approvalStatus: 'pending',
    });
    return { id, approvalStatus: 'pending' };
  }

  @Patch('spas/:id')
  @ApiOperation({ summary: 'Edit my spa and resubmit for approval' })
  @ApiBody({ type: EditSpaDto })
  async editSpa(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() input: EditSpaDto,
  ) {
    await this.ownSpa(req.identity.userId, id);
    await this.db.client
      .update(spas)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.zalo !== undefined && { messagingLinkZalo: input.zalo }),
        ...(input.cityId !== undefined && { cityId: input.cityId }),
        approvalStatus: 'pending',
      })
      .where(eq(spas.id, id));
    return { id, approvalStatus: 'pending' };
  }

  @Get('deals')
  @ApiOperation({ summary: 'List my vouchers' })
  listDeals(@Req() req: AuthRequest) {
    return this.db.client
      .select({
        id: deals.id,
        spaId: deals.spaId,
        spaName: spas.name,
        titleVi: deals.titleVi,
        titleEn: deals.titleEn,
        description: deals.shortDescriptionVi,
        priceVnd: deals.priceVnd,
        endAt: deals.endAt,
        approvalStatus: deals.approvalStatus,
      })
      .from(deals)
      .innerJoin(spas, eq(deals.spaId, spas.id))
      .where(eq(spas.ownerId, req.identity.userId));
  }

  @Post('deals')
  @ApiOperation({ summary: 'Create voucher for admin approval' })
  @ApiBody({ type: DealDto })
  async createDeal(@Req() req: AuthRequest, @Body() input: DealDto) {
    await this.ownSpa(req.identity.userId, input.spaId);
    const [row] = await this.db.client
      .insert(deals)
      .values({
        spaId: input.spaId,
        titleVi: input.titleVi,
        titleEn: input.titleEn,
        shortDescriptionVi: input.description,
        priceVnd: input.priceVnd,
        coverImageUrl: input.image,
        endAt: input.endAt ? new Date(input.endAt) : undefined,
        approvalStatus: 'pending',
      })
      .returning({ id: deals.id });
    return { id: row.id, approvalStatus: 'pending' };
  }

  @Patch('deals/:id')
  @ApiOperation({ summary: 'Edit my voucher and resubmit for approval' })
  @ApiBody({ type: EditDealDto })
  async editDeal(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() input: EditDealDto,
  ) {
    await this.ownDeal(req.identity.userId, Number(id));
    await this.db.client
      .update(deals)
      .set({
        ...(input.titleVi !== undefined && { titleVi: input.titleVi }),
        ...(input.titleEn !== undefined && { titleEn: input.titleEn }),
        ...(input.description !== undefined && {
          shortDescriptionVi: input.description,
        }),
        ...(input.priceVnd !== undefined && { priceVnd: input.priceVnd }),
        ...(input.image !== undefined && { coverImageUrl: input.image }),
        ...(input.endAt !== undefined && { endAt: new Date(input.endAt) }),
        approvalStatus: 'pending',
      })
      .where(eq(deals.id, Number(id)));
    return { id: Number(id), approvalStatus: 'pending' };
  }

  @Delete('deals/:id')
  @ApiOperation({ summary: 'Delete my voucher' })
  async deleteDeal(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.ownDeal(req.identity.userId, Number(id));
    await this.db.client.delete(deals).where(eq(deals.id, Number(id)));
    return { deleted: true };
  }

  @Get('bookings')
  @ApiOperation({ summary: 'List bookings for my spas' })
  bookings(@Req() req: AuthRequest) {
    return this.db.client
      .select({
        id: bookings.id,
        spaName: spas.name,
        userName: users.fullName,
        userPhone: users.phone,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
      })
      .from(bookings)
      .innerJoin(spas, eq(bookings.spaId, spas.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(spas.ownerId, req.identity.userId));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Count my spas, vouchers and bookings' })
  async stats(@Req() req: AuthRequest) {
    const owned = await this.db.client
      .select({ id: spas.id })
      .from(spas)
      .where(eq(spas.ownerId, req.identity.userId));
    const ids = owned.map((row) => row.id);
    if (!ids.length) return { spas: 0, vouchers: 0, bookings: 0 };
    const [voucherCount] = await this.db.client
      .select({ value: count() })
      .from(deals)
      .where(inArray(deals.spaId, ids));
    const [bookingCount] = await this.db.client
      .select({ value: count() })
      .from(bookings)
      .where(inArray(bookings.spaId, ids));
    return {
      spas: ids.length,
      vouchers: voucherCount.value,
      bookings: bookingCount.value,
    };
  }
}
