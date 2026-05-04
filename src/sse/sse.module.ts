import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module.js';
import { SseController } from './sse.controller.js';
import { SseService } from './sse.service.js';

@Module({
  imports: [UserModule],
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService],
})
export class SseModule {}
