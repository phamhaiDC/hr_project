import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

/** Sensitive field names whose values are redacted from request-body logs. */
const REDACTED_FIELDS = new Set(['password', 'confirmPassword', 'currentPassword', 'token', 'secret']);

function redactBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (REDACTED_FIELDS.has(key)) clone[key] = '***';
  }
  return clone;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url } = req;
    const start = Date.now();

    // Log incoming request (body only for mutating methods)
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body && Object.keys(req.body).length) {
      this.logger.debug(`${method} ${url} body=${JSON.stringify(redactBody(req.body))}`);
    }

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`${method} ${url} → ${res.statusCode} (${ms}ms)`);
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        const status = err?.status ?? err?.statusCode ?? 500;
        const msg = err?.message ?? 'Unknown error';
        if (status >= 500) {
          this.logger.error(`${method} ${url} → ${status} (${ms}ms) — ${msg}`, err?.stack);
        } else {
          this.logger.warn(`${method} ${url} → ${status} (${ms}ms) — ${msg}`);
        }
        return throwError(() => err);
      }),
    );
  }
}
