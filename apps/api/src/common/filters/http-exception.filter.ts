import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/** Errores conocidos de Prisma que se traducen a códigos HTTP claros. */
const PRISMA_ERRORS: Record<string, { status: number; message: string }> = {
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Registro no encontrado' },
  P2002: { status: HttpStatus.CONFLICT, message: 'El registro ya existe' },
  P2003: {
    status: HttpStatus.CONFLICT,
    message: 'El registro está referenciado por otros datos',
  },
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      PRISMA_ERRORS[exception.code]
    ) {
      ({ status, message } = PRISMA_ERRORS[exception.code]);
    } else {
      const err = exception instanceof Error ? exception : null;
      this.logger.error(
        `${request.method} ${request.url} - ${err?.message ?? String(exception)}`,
        err?.stack,
      );
      // En producción no se exponen detalles internos (SQL, rutas, stack)
      if (process.env.NODE_ENV !== 'production' && err) {
        message = err.message;
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: message,
    });
  }
}
