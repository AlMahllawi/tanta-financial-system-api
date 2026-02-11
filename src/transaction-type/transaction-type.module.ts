import { Module } from '@nestjs/common';
import { TransactionTypeService } from './transaction-type.service.js';
import { TransactionTypeController } from './transaction-type.controller.js';

@Module({
  controllers: [TransactionTypeController],
  providers: [TransactionTypeService],
})
export class TransactionTypeModule {}
