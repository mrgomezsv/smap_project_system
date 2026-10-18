import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cabeceras de seguridad básicas (equivalente mínimo a helmet)
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use(
    (
      _req: unknown,
      res: { setHeader(name: string, value: string): void },
      next: () => void,
    ) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
      next();
    },
  );

  // Los archivos van por multipart (multer); el JSON más grande es la firma
  // en base64 del contrato, que cabe holgadamente en 10 MB.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

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
