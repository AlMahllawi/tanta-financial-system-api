import { Module } from '@nestjs/common';
import { TransactionForwardService } from './transaction-forward.service';
import { TransactionForwardController } from './transaction-forward.controller';

@Module({
  controllers: [TransactionForwardController],
  providers: [TransactionForwardService],
})
export class TransactionForwardModule {}
