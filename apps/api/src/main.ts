import { join, resolve } from 'path';
import { existsSync } from 'fs';
import express from 'express';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const uploadDir = resolve(process.env.UPLOAD_DIR ?? join(process.cwd(), 'media'));
  app.use(
    '/media',
    (req, res, next) => {
      const requested = req.path.replace(/^\/+/, '');
      const direct = resolve(uploadDir, requested);
      if (existsSync(direct)) {
        return express.static(uploadDir, { fallthrough: false })(req, res, next);
      }
      const stripped = requested.replace(/^product_images\//, '');
      const fallback = resolve(uploadDir, stripped);
      if (existsSync(fallback) && fallback !== direct) {
        const rewritable = `/media/${stripped}`;
        req.url = `/${stripped}`;
        return express.static(uploadDir, { fallthrough: false })(req, res, next);
      }
      return express.static(uploadDir, { fallthrough: false })(req, res, next);
    },
  );

  // Validation pipe global (whitelist rechaza campos extra, forbidNonWhitelisted los marca como error)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Exception filter global (traduce errores HTTP a JSON consistente)
  app.useGlobalFilters(new HttpExceptionFilter());

  // BigInt interceptor global (convierte BigInt a Number en respuestas JSON)
  app.useGlobalInterceptors(new BigIntInterceptor());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`API corriendo en http://localhost:${port}`, 'Bootstrap');
  Logger.log(`CORS habilitado para: ${origins.join(', ')}`, 'Bootstrap');
}
bootstrap();
