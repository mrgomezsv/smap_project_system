import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Servir archivos estáticos de productos (/media)
  app.use('/media', express.static(join(process.cwd(), 'media')));
  app.use('/media', express.static(join(process.cwd(), '..', 'media')));

  // CORS
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
  });

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
