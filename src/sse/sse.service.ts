import { Injectable, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { fromEvent, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SseService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emit an event to a specific user's SSE stream.
   * @param userId The ID of the user to send the event to
   * @param eventType The type of the event (e.g., 'transaction-forwarded')
   * @param data The payload data to send
   */
  emitToUser(
    userId: number | string,
    eventType: string,
    data: string | object,
  ) {
    this.eventEmitter.emit(`sse.user.${userId}`, { type: eventType, data });
  }

  /**
   * Subscribe to a specific user's SSE stream.
   */
  subscribeToUser(userId: number | string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, `sse.user.${userId}`).pipe(
      map((payload: { type: string; data: string | object }) => ({
        data: payload.data,
        type: payload.type,
      })),
    );
  }
}
