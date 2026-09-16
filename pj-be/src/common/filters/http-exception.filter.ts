import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

const logger = new Logger('HttpExceptionFilter');

function walkErrorChain(exception: unknown): unknown[] {
  const chain: unknown[] = [];
  let cur: unknown = exception;
  const seen = new Set<unknown>();
  while (cur && typeof cur === 'object' && !seen.has(cur)) {
    seen.add(cur);
    chain.push(cur);
    cur = (cur as { cause?: unknown }).cause;
  }
  return chain;
}

function isDbUnreachableError(exception: unknown): boolean {
  for (const err of walkErrorChain(exception)) {
    if (!(err instanceof Error)) continue;
    const code = (err as NodeJS.ErrnoException).code;
    // 53300 = too_many_connections (Postgres max_connections đầy)
    if (
      code === 'ETIMEDOUT' ||
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === '53300'
    ) {
      return true;
    }
    const msg = err.message;
    if (
      /connect ETIMEDOUT|connection terminated|remaining connection slots are reserved/i.test(msg)
    ) {
      return true;
    }
  }
  return false;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!(exception instanceof HttpException)) {
      logger.error(exception);
    }

    const dbUnreachable = isDbUnreachableError(exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : dbUnreachable
          ? HttpStatus.SERVICE_UNAVAILABLE
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as { message?: string })?.message ?? exception.message
        : dbUnreachable
          ? 'Database unavailable'
          : 'Internal server error';

    response.status(status).json({
      error: {
        statusCode: status,
        message,
        path: request.url,
      },
    });
  }
}
