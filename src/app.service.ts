import { Injectable } from '@nestjs/common';
import packageJson from '../package.json' with { type: 'json' };
import { ApiMetadata, HealthStatus } from './common/dto/app.dto.js';
import { HealthState } from './common/enums/app.enum.js';
import { SWAGGER_PATH } from './common/constants/app.constants.js';

@Injectable()
export class AppService {
  getApiMetadata(): ApiMetadata {
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      docs: `/${SWAGGER_PATH}`,
      timestamp: new Date().toISOString(),
    };
  }

  getHealthStatus(): HealthStatus {
    // TODO: integrate @nestjs/terminus for DB checks
    return {
      status: HealthState.UP,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }
}
