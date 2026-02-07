import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { TransactionForwardService } from './transaction-forward.service';
import { TransactionForwardController } from './transaction-forward.controller';

@Module({
  imports: [UserModule],
  controllers: [TransactionForwardController],
  providers: [TransactionForwardService],
})
export class TransactionForwardModule {}
