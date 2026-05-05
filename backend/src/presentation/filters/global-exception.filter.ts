import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ConversationNotFoundException,
  AllProvidersExhaustedException,
  PrivateConversationNoLocalProviderException,
} from '../../domain/exceptions/domain.exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof ConversationNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else if (
      exception instanceof AllProvidersExhaustedException ||
      exception instanceof PrivateConversationNoLocalProviderException
    ) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else {
      this.logger.error('Unhandled exception', (exception as Error).stack);
    }

    if (!res.headersSent) {
      res.status(status).json({ statusCode: status, message });
    }
  }
}