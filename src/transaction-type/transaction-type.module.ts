import { Module } from '@nestjs/common';

import { TransactionTypeController } from './transaction-type.controller.js';
import { TransactionTypeService } from './transaction-type.service.js';

@Module({
  controllers: [TransactionTypeController],
  providers: [TransactionTypeService],
})
export class TransactionTypeModule {}
