import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DepartmentModule } from './department/department.module';
import { UserModule } from './user/user.module';
import { DocumentModule } from './document/document.module';
import { TransactionTypeModule } from './transaction-type/transaction-type.module';
import { TransactionModule } from './transaction/transaction.module';
import { TransactionForwardModule } from './transaction-forward/transaction-forward.module';
import { LookupModule } from './common/lookup/lookup.module';
import Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        HOST: Joi.string().default('0.0.0.0'),
        PORT: Joi.number().default(3000),
        ALLOWED_ORIGINS: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        SHADOW_DATABASE_URL: Joi.string().required(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    DepartmentModule,
    UserModule,
    DocumentModule,
    TransactionTypeModule,
    TransactionModule,
    TransactionForwardModule,
    LookupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
