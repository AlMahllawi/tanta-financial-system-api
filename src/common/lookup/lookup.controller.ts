import { Controller, Get, VERSION_NEUTRAL, UseGuards } from '@nestjs/common';
import { LookupService } from './lookup.service.js';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LookupResponseDto } from './dto/response.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

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
  @ApiResponse({
    status: 200,
    type: LookupResponseDto,
  })
  findAll() {
    return this.lookupService.findAll();
  }
}
