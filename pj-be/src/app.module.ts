import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './core/admin';
import { AuthController, authProviders } from './core/auth';
import { CatalogController } from './core/catalog';
import { DbService } from './core/db';
import { MemberController } from './core/member';
import { OwnerController } from './core/owner';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    AuthController,
    CatalogController,
    MemberController,
    OwnerController,
    AdminController,
  ],
  providers: [DbService, ...authProviders],
})
export class AppModule {}
