import { Body, Controller, Get, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { BasicAdminAuthGuard } from './basic-admin-auth.guard';

type LoginBody = {
  username?: string;
  password?: string;
};

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập admin và nhận session token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['username', 'password'],
    },
  })
  login(@Body() body: LoginBody) {
    const username = body.username?.trim() ?? '';
    const password = body.password?.trim() ?? '';
    if (!username || !password) {
      throw new UnauthorizedException('Username and password are required');
    }

    return this.adminAuthService.login(username, password);
  }

  @Get('session')
  @ApiSecurity('basic')
  @UseGuards(BasicAdminAuthGuard)
  @ApiOperation({ summary: 'Kiểm tra admin session token hoặc basic auth' })
  session() {
    return { authenticated: true };
  }
}
