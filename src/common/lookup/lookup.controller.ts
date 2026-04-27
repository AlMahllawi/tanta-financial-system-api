import { Controller, Get, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { LookupResponseDto } from './dto/response.dto.js';
import { LookupService } from './lookup.service.js';

@ApiTags('Lookups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'lookups',
  version: VERSION_NEUTRAL,
})
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system constants and dropdown values' })
  @ApiOkResponse({
    type: LookupResponseDto,
    description: 'Lookup values retrieved successfully',
  })
  findAll() {
    return this.lookupService.findAll();
  }
}
