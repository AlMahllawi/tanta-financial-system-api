import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SystemStatusResponse } from './common/dto/app.dto.js';

@ApiTags('Entry')
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'API Entry Point & Health Check',
    description: 'Returns API metadata and current system health status.',
  })
  @ApiOkResponse({
    type: SystemStatusResponse,
    description: 'System status retrieved successfully',
  })
  async getSystemInfo(): Promise<SystemStatusResponse> {
    return {
      ...this.appService.getApiMetadata(),
      health: await this.appService.getHealthStatus(),
    };
  }
}
