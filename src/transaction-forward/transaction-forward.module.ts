import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module.js';
import { TransactionForwardService } from './transaction-forward.service.js';
import { TransactionForwardController } from './transaction-forward.controller.js';

@Module({
  imports: [UserModule],
  controllers: [TransactionForwardController],
  providers: [TransactionForwardService],
})
export class TransactionForwardModule {}
