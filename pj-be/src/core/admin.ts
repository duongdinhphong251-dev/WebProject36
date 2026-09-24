import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { count, eq } from 'drizzle-orm';
import { Roles } from './auth';
import { DbService } from './db';
import { deals, spas, users } from './schema';

export class ApprovalDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';
}
export class BanDto {
  @ApiProperty({ enum: ['active', 'banned'] })
  @IsIn(['active', 'banned'])
  status!: 'active' | 'banned';
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly db: DbService) {}

  @Get('users')
  @ApiOperation({ summary: 'List accounts without password hashes' })
  users() {
    return this.db.client
      .select({
        id: users.id,
        phone: users.phone,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users);
  }

  @Get('spas')
  @ApiOperation({ summary: 'List every spa' })
  spas() {
    return this.db.client
      .select({
        id: spas.id,
        name: spas.name,
        ownerId: spas.ownerId,
        cityId: spas.cityId,
        approvalStatus: spas.approvalStatus,
      })
      .from(spas);
  }

  @Get('deals')
  @ApiOperation({ summary: 'List every voucher' })
  deals() {
    return this.db.client
      .select({
        id: deals.id,
        spaId: deals.spaId,
        titleVi: deals.titleVi,
        approvalStatus: deals.approvalStatus,
      })
      .from(deals);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Count accounts, spas and vouchers' })
  async stats() {
    const [[u], [s], [d]] = await Promise.all([
      this.db.client.select({ value: count() }).from(users),
      this.db.client.select({ value: count() }).from(spas),
      this.db.client.select({ value: count() }).from(deals),
    ]);
    return { users: u.value, spas: s.value, vouchers: d.value };
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Ban or unban a user' })
  @ApiBody({ type: BanDto })
  async ban(@Param('id') id: string, @Body() input: BanDto) {
    const target = await this.db.client
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!target[0] || target[0].role === 'admin')
      throw new BadRequestException(
        'Only user and owner accounts can be changed',
      );
    await this.db.client
      .update(users)
      .set({ status: input.status, updatedAt: new Date() })
      .where(eq(users.id, id));
    return { id, status: input.status };
  }

  @Patch('spas/:id/approval')
  @ApiOperation({ summary: 'Approve or reject a spa' })
  @ApiBody({ type: ApprovalDto })
  async spaApproval(@Param('id') id: string, @Body() input: ApprovalDto) {
    await this.db.client
      .update(spas)
      .set({ approvalStatus: input.status })
      .where(eq(spas.id, id));
    return { id, approvalStatus: input.status };
  }

  @Patch('deals/:id/approval')
  @ApiOperation({ summary: 'Approve or reject a voucher' })
  @ApiBody({ type: ApprovalDto })
  async dealApproval(@Param('id') id: string, @Body() input: ApprovalDto) {
    await this.db.client
      .update(deals)
      .set({ approvalStatus: input.status })
      .where(eq(deals.id, Number(id)));
    return { id: Number(id), approvalStatus: input.status };
  }
}
