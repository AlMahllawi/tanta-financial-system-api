import { Module } from '@nestjs/common';
import { DocumentModule } from '../document/document.module.js';
import { TransactionService } from './transaction.service.js';
import { TransactionController } from './transaction.controller.js';

@Module({
  imports: [DocumentModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
