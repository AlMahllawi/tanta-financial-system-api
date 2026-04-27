import { ApiProperty } from '@nestjs/swagger';

import { HealthState } from '../enums/app.enum.js';

export class HealthStatus {
  @ApiProperty({ enum: HealthState })
  status: HealthState;

  @ApiProperty()
  uptime: number;

  @ApiProperty()
  memoryUsage: number;
}

export class ApiMetadata {
  @ApiProperty()
  name: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  docs: string;

  @ApiProperty()
  timestamp: string;
}

export class SystemStatusResponse extends ApiMetadata {
  @ApiProperty()
  health: HealthStatus;
}
