import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class BasicAdminAuthGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    this.adminAuthService.ensureEnabled();

    if (!authorization) {
      throw new UnauthorizedException('Missing authorization');
    }

    if (authorization.startsWith('Bearer ')) {
      const token = authorization.slice('Bearer '.length).trim();
      if (!this.adminAuthService.verifySessionToken(token)) {
        throw new UnauthorizedException('Invalid admin session');
      }
      return true;
    }

    if (!authorization.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing basic authorization');
    }

    const encoded = authorization.slice('Basic '.length).trim();
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : '';
    const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';

    if (!this.adminAuthService.validateBasicCredentials(username, password)) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return true;
  }
}
