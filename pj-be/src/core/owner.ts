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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Min,
} from 'class-validator';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FileInterceptor } from '@nestjs/platform-express';
import { and, count, eq, inArray } from 'drizzle-orm';
import { Roles } from './auth';
import type { AuthRequest } from './auth';
import { DbService } from './db';
import { bookings, cities, deals, spas, users } from './schema';
import { POSTGRES_UUID, PositiveIntPipe, UuidPipe } from './ids';

export class SpaDto {
  @ApiProperty()
  @IsString()
  @Matches(/\S/, { message: 'name must not be blank' })
  name!: string;
  @ApiProperty()
  @IsString()
  @Matches(/\S/, { message: 'address must not be blank' })
  address!: string;
  @ApiProperty()
  @IsString()
  @Matches(/\S/, { message: 'description must not be blank' })
  description!: string;
  @ApiProperty()
  @IsString()
  @Matches(/\S/, { message: 'phone must not be blank' })
  phone!: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUrl()
  zalo?: string | null;
  @ApiProperty()
  @IsInt()
  @Min(1)
  cityId!: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;
}
// PATCH reuses create rules, but allows omitted fields. Null only clears optional fields.
export class EditSpaDto extends PartialType(SpaDto, {
  skipNullProperties: false,
}) {}
export class DealDto {
  @ApiProperty()
  @Matches(POSTGRES_UUID, { message: 'spaId must be a UUID' })
  spaId!: string;
  @ApiProperty()
  @IsString()
  @Matches(/\S/, { message: 'titleVi must not be blank' })
  titleVi!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;
  @ApiProperty()
  @IsString()
  @Matches(/\S/, { message: 'description must not be blank' })
  description!: string;
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  priceVnd!: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  endAt?: string | null;
}
export class EditDealDto extends PartialType(
  OmitType(DealDto, ['spaId'] as const),
  { skipNullProperties: false },
) {}

@ApiTags('owner')
@ApiBearerAuth()
@Roles('spa_owner')
@Controller('owner')
export class OwnerController {
  constructor(private readonly db: DbService) {}

  @Post('images')
  @ApiOperation({ summary: 'Upload one spa or voucher cover image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  async uploadImage(
    @UploadedFile() file?: { buffer: Buffer; mimetype: string },
  ) {
    if (!file?.buffer) throw new BadRequestException('Choose an image');
    const bytes = file.buffer;
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
    const webp =
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP';
    const extension = png ? 'png' : jpg ? 'jpg' : webp ? 'webp' : null;
    const expectedMime = png
      ? 'image/png'
      : jpg
        ? 'image/jpeg'
        : webp
          ? 'image/webp'
          : null;
    if (!extension || file.mimetype !== expectedMime)
      throw new BadRequestException('Use a PNG, JPEG or WebP image');
    const filename = `${randomUUID()}.${extension}`;
    const directory = resolve(process.cwd(), 'uploads');
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, filename), bytes);
    return { image: `/uploads/${filename}` };
  }

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
        image: spas.spaAvatar,
      })
      .from(spas)
      .where(eq(spas.ownerId, req.identity.userId));
  }

  private async validCity(cityId: number) {
    const city = await this.db.client
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);
    if (!city[0]) throw new BadRequestException('City not found');
  }

  @Post('spas')
  @ApiOperation({ summary: 'Create spa for admin approval' })
  @ApiBody({ type: SpaDto })
  async createSpa(@Req() req: AuthRequest, @Body() input: SpaDto) {
    await this.validCity(input.cityId);
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
      spaAvatar: input.image,
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
    @Param('id', UuidPipe) id: string,
    @Body() input: EditSpaDto,
  ) {
    await this.ownSpa(req.identity.userId, id);
    if (input.cityId !== undefined) await this.validCity(input.cityId);
    await this.db.client
      .update(spas)
      .set({
        name: input.name,
        address: input.address,
        description: input.description,
        phone: input.phone,
        messagingLinkZalo: input.zalo,
        cityId: input.cityId,
        spaAvatar: input.image,
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
        image: deals.coverImageUrl,
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
    @Param('id', PositiveIntPipe) id: number,
    @Body() input: EditDealDto,
  ) {
    await this.ownDeal(req.identity.userId, id);
    await this.db.client
      .update(deals)
      .set({
        titleVi: input.titleVi,
        titleEn: input.titleEn,
        shortDescriptionVi: input.description,
        priceVnd: input.priceVnd,
        coverImageUrl: input.image,
        // undefined keeps the old value; null explicitly clears the expiry.
        endAt: input.endAt == null ? input.endAt : new Date(input.endAt),
        approvalStatus: 'pending',
      })
      .where(eq(deals.id, id));
    return { id: id, approvalStatus: 'pending' };
  }

  @Delete('deals/:id')
  @ApiOperation({ summary: 'Delete my voucher' })
  async deleteDeal(
    @Req() req: AuthRequest,
    @Param('id', PositiveIntPipe) id: number,
  ) {
    await this.ownDeal(req.identity.userId, id);
    const linkedBooking = await this.db.client
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.dealId, id))
      .limit(1);
    if (linkedBooking.length)
      throw new BadRequestException(
        'Voucher has bookings and cannot be deleted',
      );
    await this.db.client.delete(deals).where(eq(deals.id, id));
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
        dealTitle: deals.titleVi,
        scheduledAt: bookings.scheduledAt,
      })
      .from(bookings)
      .innerJoin(spas, eq(bookings.spaId, spas.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .leftJoin(deals, eq(bookings.dealId, deals.id))
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
