import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DepartmentModule } from './department/department.module.js';
import { UserModule } from './user/user.module.js';
import { DocumentModule } from './document/document.module.js';
import { TransactionTypeModule } from './transaction-type/transaction-type.module.js';
import { TransactionModule } from './transaction/transaction.module.js';
import { TransactionForwardModule } from './transaction-forward/transaction-forward.module.js';
import { BudgetCategoriesModule } from './budget-categories/budget-categories.module.js';
import { LookupModule } from './common/lookup/lookup.module.js';
import { DURATION_REGEX } from './common/constants/regex.constants.js';
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
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.alternatives()
          .try(Joi.number(), Joi.string().regex(DURATION_REGEX))
          .default('1d'),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_EXPIRATION: Joi.alternatives()
          .try(Joi.number(), Joi.string().regex(DURATION_REGEX))
          .default('7d'),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    PrismaModule,
    AuthModule,
    DepartmentModule,
    UserModule,
    DocumentModule,
    TransactionTypeModule,
    TransactionModule,
    TransactionForwardModule,
    BudgetCategoriesModule,
    LookupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
