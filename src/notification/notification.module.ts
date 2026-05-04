import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { SseModule } from '../sse/sse.module.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';

@Module({
  imports: [PrismaModule, SseModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
