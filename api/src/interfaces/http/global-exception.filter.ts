import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

import { RateLimitExceededError } from '@api/domain/errors/rate-limit.error';
import { ExternalAPIError } from '@api/domain/errors/external-api.error';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof RateLimitExceededError) {
      return response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        status: 'error',
        code: HttpStatus.TOO_MANY_REQUESTS,
        message: exception.message,
      });
    }

    if (exception instanceof ExternalAPIError) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : (res as any).message ?? 'Error';

      return response.status(status).json({
        status: 'error',
        code: status,
        message,
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    });
  }
}
