import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { DocumentModule } from './document/document.module';
import { TransactionTypeModule } from './transaction-type/transaction-type.module';

@Module({
  imports: [UserModule, DocumentModule, TransactionTypeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
