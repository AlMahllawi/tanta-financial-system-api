import { Module } from '@nestjs/common';

import { NotificationModule } from '../notification/notification.module.js';
import { TransactionController } from './transaction.controller.js';
import { TransactionService } from './transaction.service.js';

@Module({
  imports: [NotificationModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
