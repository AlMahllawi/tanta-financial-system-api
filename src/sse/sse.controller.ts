import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtSseAuthGuard } from '../auth/guards/jwt-sse-auth.guard.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { User } from '../user/entities/user.entity.js';
import { SseService } from './sse.service.js';

@ApiTags('SSE')
@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('stream')
  @UseGuards(JwtSseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Subscribe to user events stream',
    description:
      'Connect to this endpoint using EventSource to receive real-time updates. The JWT token can be provided in the Authorization header or as a ?token= query parameter.',
  })
  @ApiOkResponse({
    description: 'Establish SSE connection',
    content: {
      'text/event-stream': {
        schema: {
          type: 'object',
          properties: {
            data: { type: 'object', description: 'The event payload' },
            type: { type: 'string', description: 'The event type' },
          },
        },
        examples: {
          budgetOverflow: {
            summary: 'Budget allocation overflow attempt',
            value: {
              type: 'notification',
              data: {
                id: 1,
                userId: 1,
                timestamp: '2026-05-04T15:00:00.000Z',
                seen: false,
                type: 'WARNING',
                code: 'BUDGET_ALLOCATION_OVERFLOW_ATTEMPT',
                args: {
                  transactionId: '123',
                  categoryName: 'General',
                  availableAmount: '1000',
                  requestedAmount: '1500',
                  attemptedBy: '1',
                },
              },
            },
          },
          forwardReceived: {
            summary: 'Transaction forwarded to user',
            value: {
              type: 'notification',
              data: {
                id: 2,
                userId: 5,
                timestamp: '2026-05-04T15:00:00.000Z',
                seen: false,
                type: 'INFO',
                code: 'TRANSACTION_FORWARD_RECEIVED',
                args: {
                  transactionId: '123',
                  forwardId: '1',
                  senderName: 'John Doe',
                },
              },
            },
          },
          forwardResponded: {
            summary: 'Receiver responded to forwarded transaction',
            value: {
              type: 'notification',
              data: {
                id: 3,
                userId: 2,
                timestamp: '2026-05-04T15:00:00.000Z',
                seen: false,
                type: 'INFO',
                code: 'TRANSACTION_FORWARD_RESPONDED',
                args: {
                  transactionId: '123',
                  forwardId: '1',
                  receiverName: 'Jane Smith',
                  status: 'APPROVED',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiErrorResponses(ErrorCode.INVALID_CREDENTIALS)
  subscribeToUserEvents(@CurrentUser() user: User): Observable<MessageEvent> {
    return this.sseService.subscribeToUser(user.id);
  }
}
