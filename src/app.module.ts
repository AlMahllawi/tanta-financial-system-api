import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TerminusModule } from '@nestjs/terminus';
import Joi from 'joi';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { BudgetCategoriesModule } from './budget-categories/budget-categories.module.js';
import { DURATION_REGEX } from './common/constants/regex.constants.js';
import { LookupModule } from './common/lookup/lookup.module.js';
import { DepartmentModule } from './department/department.module.js';
import { DocumentModule } from './document/document.module.js';
import { PrismaInterceptor } from './prisma/interceptors/prisma.interceptor.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SseModule } from './sse/sse.module.js';
import { TransactionModule } from './transaction/transaction.module.js';
import { TransactionForwardModule } from './transaction-forward/transaction-forward.module.js';
import { TransactionTypeModule } from './transaction-type/transaction-type.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    TerminusModule,
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
    EventEmitterModule.forRoot(),
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
    SseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PrismaInterceptor,
    },
  ],
})
export class AppModule {}
