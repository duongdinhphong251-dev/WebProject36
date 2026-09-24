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
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { Roles } from './auth';
import type { AuthRequest } from './auth';
import { DbService } from './db';
import { bookings, deals, reviews, savedSpas, spas } from './schema';

export class ReviewDto {
  @ApiProperty()
  @IsUUID()
  spaId!: string;
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
  @ApiProperty()
  @IsString()
  comment!: string;
}
export class BookingDto {
  @ApiProperty()
  @IsUUID()
  spaId!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
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
  async save(@Req() req: AuthRequest, @Param('spaId') spaId: string) {
    await this.approvedSpa(spaId);
    await this.db.client
      .insert(savedSpas)
      .values({ userId: req.identity.userId, spaId })
      .onConflictDoNothing();
    return { saved: true };
  }

  @Delete('saved/:spaId')
  @ApiOperation({ summary: 'Remove a saved spa' })
  async unsave(@Req() req: AuthRequest, @Param('spaId') spaId: string) {
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
    const previous = await this.db.client
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, req.identity.userId),
          eq(reviews.spaId, input.spaId),
        ),
      )
      .limit(1);
    if (previous.length)
      throw new BadRequestException('You already reviewed this spa');
    const id = randomUUID();
    await this.db.client.insert(reviews).values({
      id,
      userId: req.identity.userId,
      spaId: input.spaId,
      rating: input.rating,
      comment: input.comment.trim(),
    });
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
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
      })
      .from(bookings)
      .innerJoin(spas, eq(bookings.spaId, spas.id))
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
    if (input.dealId) {
      const voucher = await this.db.client
        .select({ id: deals.id })
        .from(deals)
        .where(
          and(
            eq(deals.id, input.dealId),
            eq(deals.spaId, input.spaId),
            eq(deals.approvalStatus, 'approved'),
          ),
        )
        .limit(1);
      if (!voucher[0]) throw new BadRequestException('Voucher is unavailable');
    }
    const id = randomUUID();
    await this.db.client.insert(bookings).values({
      id,
      userId: req.identity.userId,
      spaId: input.spaId,
      dealId: input.dealId,
      scheduledAt: new Date(input.scheduledAt),
    });
    return { id, status: 'pending' };
  }
}
