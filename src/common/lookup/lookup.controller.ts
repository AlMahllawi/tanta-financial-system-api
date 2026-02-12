import {
  Controller,
  Get,
  HttpStatus,
  VERSION_NEUTRAL,
  UseGuards,
} from '@nestjs/common';
import { LookupService } from './lookup.service.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LookupResponseDto } from './dto/response.dto.js';
import { ApiResponses } from '../decorators/http.js';
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
  @ApiResponses({
    status: HttpStatus.OK,
    type: LookupResponseDto,
    description: 'Lookup values retrieved successfully',
  })
  findAll() {
    return this.lookupService.findAll();
  }
}
