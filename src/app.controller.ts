import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SystemStatusResponse } from './common/dto/app.dto';

@ApiTags('Entry')
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'API Entry Point & Health Check',
    description: 'Returns API metadata and current system health status.',
  })
  @ApiOkResponse({ type: SystemStatusResponse })
  getSystemInfo(): SystemStatusResponse {
    return {
      ...this.appService.getApiMetadata(),
      health: this.appService.getHealthStatus(),
    };
  }
}
