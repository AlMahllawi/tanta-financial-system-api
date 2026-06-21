import { Module } from '@nestjs/common';

import { NotificationModule } from '../notification/notification.module.js';
import { TransactionForwardController } from './transaction-forward.controller.js';
import { TransactionForwardService } from './transaction-forward.service.js';

@Module({
  imports: [NotificationModule],
  controllers: [TransactionForwardController],
  providers: [TransactionForwardService],
})
export class TransactionForwardModule {}
