import { HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { Prisma } from '../../prisma/generated/client.js';
import { NotificationType } from '../../prisma/generated/enums.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SseService } from '../sse/sse.service.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';
import { Notification } from './entities/notification.entity.js';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
  ) {}

  async create(
    userId: number,
    type: NotificationType,
    code: string,
    args?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        code,
        args: args as Prisma.InputJsonValue,
      },
    });

    this.sseService.emitToUser(userId, 'notification', notification);

    return plainToInstance(Notification, notification);
  }

  async findAll(userId: number, queryDto: NotificationQueryDto) {
    const { skip, take, page, perPage } = createPaginator(queryDto);

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (queryDto.startDate || queryDto.endDate) {
      const timestamp: Prisma.DateTimeFilter = {};
      if (queryDto.startDate) timestamp.gte = new Date(queryDto.startDate);
      if (queryDto.endDate) timestamp.lte = new Date(queryDto.endDate);
      where.timestamp = timestamp;
    }

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return createPaginatedResult(
      plainToInstance(Notification, notifications),
      total,
      page,
      perPage,
    );
  }

  async updateSeen(id: number, userId: number, seen: boolean) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification)
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOTIFICATION_NOT_FOUND,
        { id },
      );

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { seen },
    });

    return plainToInstance(Notification, updated);
  }
}
