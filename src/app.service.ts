import { Injectable } from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

import packageJson from '../package.json' with { type: 'json' };
import { SWAGGER_PATH } from './common/constants/app.constants.js';
import { ApiMetadata, HealthStatus } from './common/dto/app.dto.js';
import { HealthState } from './common/enums/app.enum.js';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class AppService {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  getApiMetadata(): ApiMetadata {
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      docs: `/${SWAGGER_PATH}`,
      timestamp: new Date().toISOString(),
    };
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const isUp = await this.health
      .check([() => this.prismaHealth.pingCheck('database', this.prisma)])
      .then((result) => result.status === 'ok')
      .catch(() => false);

    return {
      status: isUp ? HealthState.UP : HealthState.DOWN,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }
}
