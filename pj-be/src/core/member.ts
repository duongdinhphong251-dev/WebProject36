import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
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
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { Roles } from './auth';
import type { AuthRequest } from './auth';
import { DbService } from './db';
import {
  bookings,
  claimedVouchers,
  deals,
  reviews,
  savedSpas,
  spas,
} from './schema';
import { POSTGRES_UUID, PositiveIntPipe, UuidPipe } from './ids';

export class ReviewDto {
  @ApiProperty()
  @Matches(POSTGRES_UUID, { message: 'spaId must be a UUID' })
  spaId!: string;
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
  @ApiProperty()
  @IsString()
  @Matches(/\S/, { message: 'comment must not be blank' })
  comment!: string;
}
export class BookingDto {
  @ApiProperty()
  @Matches(POSTGRES_UUID, { message: 'spaId must be a UUID' })
  spaId!: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  dealId?: number;
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  scheduledAt!: string;
}

@ApiTags('member')
@ApiBearerAuth()
@Roles('user')
@Controller('me')
export class MemberController {
  constructor(private readonly db: DbService) {}

  private async approvedSpa(id: string) {
    const row = await this.db.client
      .select({ id: spas.id })
      .from(spas)
      .where(and(eq(spas.id, id), eq(spas.approvalStatus, 'approved')))
      .limit(1);
    if (!row[0]) throw new NotFoundException('Spa not found');
  }

  @Get('saved')
  @ApiOperation({ summary: 'List saved spas' })
  saved(@Req() req: AuthRequest) {
    return this.db.client
      .select({
        id: spas.id,
        name: spas.name,
        address: spas.address,
        image: spas.spaAvatar,
      })
      .from(savedSpas)
      .innerJoin(spas, eq(savedSpas.spaId, spas.id))
      .where(
        and(
          eq(savedSpas.userId, req.identity.userId),
          eq(spas.approvalStatus, 'approved'),
        ),
      );
  }

  @Post('saved/:spaId')
  @ApiOperation({ summary: 'Save a spa' })
  async save(@Req() req: AuthRequest, @Param('spaId', UuidPipe) spaId: string) {
    await this.approvedSpa(spaId);
    await this.db.client
      .insert(savedSpas)
      .values({ userId: req.identity.userId, spaId })
      .onConflictDoNothing();
    return { saved: true };
  }

  @Delete('saved/:spaId')
  @ApiOperation({ summary: 'Remove a saved spa' })
  async unsave(
    @Req() req: AuthRequest,
    @Param('spaId', UuidPipe) spaId: string,
  ) {
    await this.db.client
      .delete(savedSpas)
      .where(
        and(
          eq(savedSpas.userId, req.identity.userId),
          eq(savedSpas.spaId, spaId),
        ),
      );
    return { saved: false };
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List my reviews' })
  myReviews(@Req() req: AuthRequest) {
    return this.db.client
      .select({
        id: reviews.id,
        spaId: reviews.spaId,
        spaName: spas.name,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(spas, eq(reviews.spaId, spas.id))
      .where(eq(reviews.userId, req.identity.userId))
      .orderBy(desc(reviews.createdAt));
  }

  @Post('reviews')
  @ApiOperation({ summary: 'Review a spa once' })
  @ApiBody({ type: ReviewDto })
  async review(@Req() req: AuthRequest, @Body() input: ReviewDto) {
    await this.approvedSpa(input.spaId);
    const id = randomUUID();
    // The unique constraint also prevents duplicate concurrent requests.
    const inserted = await this.db.client
      .insert(reviews)
      .values({
        id,
        userId: req.identity.userId,
        spaId: input.spaId,
        rating: input.rating,
        comment: input.comment.trim(),
      })
      .onConflictDoNothing()
      .returning({ id: reviews.id });
    if (!inserted.length)
      throw new BadRequestException('You already reviewed this spa');
    return { id };
  }

  @Get('bookings')
  @ApiOperation({ summary: 'List my bookings' })
  myBookings(@Req() req: AuthRequest) {
    return this.db.client
      .select({
        id: bookings.id,
        spaId: bookings.spaId,
        spaName: spas.name,
        dealId: bookings.dealId,
        dealTitle: deals.titleVi,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
      })
      .from(bookings)
      .innerJoin(spas, eq(bookings.spaId, spas.id))
      .leftJoin(deals, eq(bookings.dealId, deals.id))
      .where(eq(bookings.userId, req.identity.userId))
      .orderBy(desc(bookings.scheduledAt));
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Book a spa visit' })
  @ApiBody({ type: BookingDto })
  async book(@Req() req: AuthRequest, @Body() input: BookingDto) {
    await this.approvedSpa(input.spaId);
    if (new Date(input.scheduledAt) <= new Date())
      throw new BadRequestException('Choose a future time');
    if (input.dealId !== undefined) {
      const voucher = await this.db.client
        .select({ id: deals.id })
        .from(deals)
        .where(
          and(
            eq(deals.id, input.dealId),
            eq(deals.spaId, input.spaId),
            eq(deals.approvalStatus, 'approved'),
            or(isNull(deals.endAt), gt(deals.endAt, new Date())),
          ),
        )
        .limit(1);
      if (!voucher[0]) throw new BadRequestException('Voucher is unavailable');
    }
    const id = randomUUID();
    // Consuming the voucher and creating the booking must succeed together.
    await this.db.client.transaction(async (tx) => {
      if (input.dealId !== undefined) {
        const used = await tx
          .update(claimedVouchers)
          .set({ status: 'used', usedAt: new Date() })
          .where(
            and(
              eq(claimedVouchers.userId, req.identity.userId),
              eq(claimedVouchers.dealId, input.dealId),
              eq(claimedVouchers.status, 'available'),
            ),
          )
          .returning({ dealId: claimedVouchers.dealId });
        if (!used.length)
          throw new BadRequestException(
            'Claim this voucher before booking, or it has already been used',
          );
      }
      await tx.insert(bookings).values({
        id,
        userId: req.identity.userId,
        spaId: input.spaId,
        dealId: input.dealId,
        scheduledAt: new Date(input.scheduledAt),
      });
    });
    return { id, status: 'pending' };
  }

  @Get('vouchers')
  @ApiOperation({ summary: 'List my claimed vouchers' })
  vouchers(@Req() req: AuthRequest) {
    return this.db.client
      .select({
        dealId: claimedVouchers.dealId,
        spaId: deals.spaId,
        spaName: spas.name,
        titleVi: deals.titleVi,
        titleEn: deals.titleEn,
        status: claimedVouchers.status,
        endAt: deals.endAt,
        approvalStatus: deals.approvalStatus,
        spaApprovalStatus: spas.approvalStatus,
      })
      .from(claimedVouchers)
      .innerJoin(deals, eq(claimedVouchers.dealId, deals.id))
      .innerJoin(spas, eq(deals.spaId, spas.id))
      .where(eq(claimedVouchers.userId, req.identity.userId))
      .orderBy(desc(claimedVouchers.claimedAt));
  }

  @Post('vouchers/:dealId')
  @ApiOperation({ summary: 'Claim an approved voucher once' })
  async claimVoucher(
    @Req() req: AuthRequest,
    @Param('dealId', PositiveIntPipe) dealId: number,
  ) {
    const available = await this.db.client
      .select({ id: deals.id })
      .from(deals)
      .innerJoin(spas, eq(deals.spaId, spas.id))
      .where(
        and(
          eq(deals.id, dealId),
          eq(deals.approvalStatus, 'approved'),
          eq(spas.approvalStatus, 'approved'),
          or(isNull(deals.endAt), gt(deals.endAt, new Date())),
        ),
      )
      .limit(1);
    if (!available.length)
      throw new BadRequestException('Voucher is unavailable');
    const claimed = await this.db.client
      .insert(claimedVouchers)
      .values({ userId: req.identity.userId, dealId })
      .onConflictDoNothing()
      .returning({ dealId: claimedVouchers.dealId });
    if (!claimed.length)
      throw new BadRequestException('You already claimed this voucher');
    return { dealId, status: 'available' };
  }
}
