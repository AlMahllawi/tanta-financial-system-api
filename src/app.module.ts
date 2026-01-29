import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { DocumentModule } from './document/document.module';
import { TransactionTypeModule } from './transaction-type/transaction-type.module';
import { TransactionModule } from './transaction/transaction.module';
import { TransactionForwardModule } from './transaction-forward/transaction-forward.module';

@Module({
  imports: [
    UserModule,
    DocumentModule,
    TransactionTypeModule,
    TransactionModule,
    TransactionForwardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
