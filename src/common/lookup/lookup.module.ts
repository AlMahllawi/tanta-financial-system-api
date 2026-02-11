import { Module } from '@nestjs/common';
import { LookupService } from './lookup.service.js';
import { LookupController } from './lookup.controller.js';

@Module({
  controllers: [LookupController],
  providers: [LookupService],
})
export class LookupModule {}
