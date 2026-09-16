import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { join } from 'node:path';
import express from 'express';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { assertNoNullBytes } from './common/http/request-sanitizer';
import { applySecurityHeaders } from './common/http/security-headers';

async function bootstrap() {
  // `API_PROFILE=1` — log debug profile (DealsService / PagesService). `PHOTO_VERBOSE=1` bật log verbose (PhotoCache).
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.API_PROFILE === '1'
        ? process.env.PHOTO_VERBOSE === '1'
          ? (['error', 'warn', 'log', 'debug', 'verbose'] as const)
          : (['error', 'warn', 'log', 'debug'] as const)
        : undefined,
  });
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.use('/uploads', express.static(join(process.cwd(), 'uploads'), { index: false, fallthrough: true }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors();

  app.use((request: Request, _: Response, next: NextFunction) => {
    try {
      assertNoNullBytes(request.originalUrl || request.url);
      next();
    } catch (error) {
      next(error instanceof BadRequestException ? error : new BadRequestException('Malformed request path'));
    }
  });

  app.use((_: Request, response: Response, next: NextFunction) => {
    applySecurityHeaders(response);
    next();
  });

  // Global validation pipe (for DTOs)
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Global response envelope + error shape
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Deals API')
    .setDescription('API cho trang săn deals spa & làm đẹp')
    .setVersion('1.0')
    .addBasicAuth()
    .addTag('locations')
    .addTag('services')
    .addTag('deals')
    .addTag('spas')
    .addTag('pages')
    .addTag('seo')
    .addTag('banners')
    .addTag('admin-banners')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
