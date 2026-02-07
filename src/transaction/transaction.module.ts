import { Module } from '@nestjs/common';
import { DocumentModule } from '../document/document.module';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';

@Module({
  imports: [DocumentModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
