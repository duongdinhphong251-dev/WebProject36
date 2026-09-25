import {
  BadRequestException,
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  Post,
  Req,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { sign, verify } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { DbService } from './db';
import { users } from './schema';

export type Role = 'user' | 'spa_owner' | 'admin';
export type Identity = { userId: string; role: Role };
export type AuthRequest = Request & { identity: Identity };
export const Public = () => SetMetadata('public', true);
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

export class RegisterDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  @Matches(/^0\d{9,10}$/)
  phone!: string;
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'fullName must not be blank' })
  fullName!: string;
}

export class LoginDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  @Matches(/^0\d{9,10}$/)
  phone!: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly db: DbService) {}

  private token(userId: string, role: Role) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET must be configured');
    return sign({ userId, role }, secret, { expiresIn: '7d' });
  }

  async register(input: RegisterDto, role: 'user' | 'spa_owner') {
    const id = randomUUID();
    const inserted = await this.db.client
      .insert(users)
      .values({
        id,
        phone: input.phone,
        fullName: input.fullName.trim(),
        passwordHash: await hash(input.password, 12),
        role,
      })
      .onConflictDoNothing()
      .returning({ id: users.id });
    if (!inserted.length)
      throw new BadRequestException('Phone number is already registered');
    return {
      token: this.token(id, role),
      user: { id, phone: input.phone, fullName: input.fullName.trim(), role },
    };
  }

  async login(input: LoginDto) {
    const row = await this.db.client
      .select()
      .from(users)
      .where(eq(users.phone, input.phone))
      .limit(1);
    const user = row[0];
    if (!user || !(await compare(input.password, user.passwordHash)))
      throw new UnauthorizedException('Invalid phone or password');
    if (user.status === 'banned')
      throw new ForbiddenException('Account is banned');
    return {
      token: this.token(user.id, user.role as Role),
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async me(id: string) {
    const row = await this.db.client
      .select({
        id: users.id,
        phone: users.phone,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!row[0] || row[0].status === 'banned')
      throw new UnauthorizedException();
    return row[0];
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>('public', [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = request.headers.authorization?.replace(/^Bearer /i, '');
    if (!token || !process.env.JWT_SECRET) throw new UnauthorizedException();
    try {
      const payload = verify(token, process.env.JWT_SECRET);
      if (
        typeof payload !== 'object' ||
        !('userId' in payload) ||
        !('role' in payload)
      )
        throw new Error('Invalid token');
      const user = await this.auth.me(String(payload.userId));
      request.identity = { userId: user.id, role: user.role as Role };
    } catch {
      throw new UnauthorizedException();
    }
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && !roles.includes(request.identity.role))
      throw new ForbiddenException();
    return true;
  }
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiBody({ type: RegisterDto })
  register(@Body() input: RegisterDto) {
    return this.auth.register(input, 'user');
  }

  @Public()
  @Post('register/owner')
  @ApiOperation({ summary: 'Register spa owner' })
  @ApiBody({ type: RegisterDto })
  registerOwner(@Body() input: RegisterDto) {
    return this.auth.register(input, 'spa_owner');
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Log in with phone and password' })
  @ApiBody({ type: LoginDto })
  login(@Body() input: LoginDto) {
    return this.auth.login(input);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out on the client' })
  logout() {
    return { message: 'Clear the client token' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user' })
  me(@Req() request: AuthRequest) {
    return this.auth.me(request.identity.userId);
  }
}

export const authProviders = [
  AuthService,
  { provide: APP_GUARD, useClass: JwtAuthGuard },
];
