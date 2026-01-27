import { Injectable } from '@nestjs/common';
import * as packageJson from '../package.json';
import { ApiMetadata, HealthStatus } from './common/dto/app.dto';
import { HealthState } from './common/enums/app.enum';
import { SWAGGER_PATH } from './common/constants/app.constants';

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
