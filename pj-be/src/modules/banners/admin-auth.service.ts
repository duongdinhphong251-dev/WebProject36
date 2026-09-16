import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

@Injectable()
export class AdminAuthService {
  constructor(private readonly configService: ConfigService) {}

  ensureEnabled() {
    const username = this.configService.get<string>('ADMIN_BASIC_AUTH_USERNAME')?.trim() ?? '';
    const password = this.configService.get<string>('ADMIN_BASIC_AUTH_PASSWORD')?.trim() ?? '';
    if (!username || !password) {
      throw new ForbiddenException('Admin API is disabled');
    }
  }

  validateBasicCredentials(username: string, password: string): boolean {
    const configuredUsername = this.configService.get<string>('ADMIN_BASIC_AUTH_USERNAME')?.trim() ?? '';
    const configuredPassword = this.configService.get<string>('ADMIN_BASIC_AUTH_PASSWORD')?.trim() ?? '';
    return Boolean(
      configuredUsername
      && configuredPassword
      && username === configuredUsername
      && password === configuredPassword,
    );
  }

  issueSessionToken(username: string): string {
    const payload = JSON.stringify({
      username,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
    const signature = this.sign(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  verifySessionToken(token: string | null | undefined): boolean {
    if (!token) return false;

    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return false;

    const expectedSignature = this.sign(encodedPayload);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (providedBuffer.length !== expectedBuffer.length) return false;
    if (!timingSafeEqual(providedBuffer, expectedBuffer)) return false;

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
        username?: string;
        expiresAt?: number;
      };

      if (!payload.username?.trim()) return false;
      if (typeof payload.expiresAt !== 'number') return false;
      if (payload.expiresAt <= Date.now()) return false;
      return true;
    } catch {
      return false;
    }
  }

  login(username: string, password: string) {
    this.ensureEnabled();
    if (!this.validateBasicCredentials(username, password)) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return {
      token: this.issueSessionToken(username),
      expiresIn: SESSION_TTL_MS / 1000,
    };
  }

  private sign(value: string): string {
    return createHmac('sha256', this.getSessionSecret()).update(value).digest('base64url');
  }

  private getSessionSecret(): string {
    return this.configService.get<string>('ADMIN_SESSION_SECRET')
      ?? this.configService.get<string>('ADMIN_BASIC_AUTH_PASSWORD')
      ?? this.configService.get<string>('ADMIN_BASIC_AUTH_USERNAME')
      ?? 'tuoi-admin-session-secret';
  }
}
