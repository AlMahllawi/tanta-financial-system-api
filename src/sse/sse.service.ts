import { Injectable, MessageEvent, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { defer, fromEvent, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { UserPresence } from '../../prisma/generated/enums.js';
import { UserService } from '../user/user.service.js';

@Injectable()
export class SseService implements OnModuleInit {
  private activeConnections = new Map<number, number>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly userService: UserService,
  ) {}

  async onModuleInit() {
    // Reset all users to OFFLINE on startup to ensure no stale "ONLINE" status after a crash
    await this.userService.resetAllPresence();
  }

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
  subscribeToUser(userId: number): Observable<MessageEvent> {
    return defer(() => {
      // Start connection
      const count = this.activeConnections.get(userId) || 0;
      if (count === 0)
        this.userService
          .updatePresence(userId, UserPresence.ONLINE)
          .catch((err) =>
            console.error(`Failed to set user ${userId} online:`, err),
          );
      this.activeConnections.set(userId, count + 1);

      return fromEvent(this.eventEmitter, `sse.user.${userId}`).pipe(
        map((payload: { type: string; data: string | object }) => ({
          data: payload.data,
          type: payload.type,
        })),
        finalize(() => {
          // End connection
          const currentCount = this.activeConnections.get(userId) || 0;
          if (currentCount <= 1) {
            this.activeConnections.delete(userId);
            this.userService
              .updatePresence(userId, UserPresence.OFFLINE)
              .catch((err) =>
                console.error(`Failed to set user ${userId} offline:`, err),
              );
          } else this.activeConnections.set(userId, currentCount - 1);
        }),
      );
    });
  }
}
