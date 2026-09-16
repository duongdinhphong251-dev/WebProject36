import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ResponseEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((payload) => {
        // If handler already returns { data, meta } shape, pass through
        if (payload && typeof payload === 'object' && 'data' in payload) {
          return payload as ResponseEnvelope<T>;
        }
        return { data: payload };
      }),
    );
  }
}
