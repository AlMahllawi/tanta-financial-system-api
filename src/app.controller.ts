import { Controller, Get, HttpStatus, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SystemStatusResponse } from './common/dto/app.dto.js';
import { ApiResponses } from './common/decorators/http.js';

@ApiTags('Entry')
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'API Entry Point & Health Check',
    description: 'Returns API metadata and current system health status.',
  })
  @ApiResponses({
    status: HttpStatus.OK,
    type: SystemStatusResponse,
    description: 'System status retrieved successfully',
  })
  getSystemInfo(): SystemStatusResponse {
    return {
      ...this.appService.getApiMetadata(),
      health: this.appService.getHealthStatus(),
    };
  }
}
