import { HealthState } from '../enums/app.enum.js';

export class HealthStatus {
  status: HealthState;
  uptime: number;
  memoryUsage: number;
}

export class ApiMetadata {
  name: string;
  version: string;
  description: string;
  docs: string;
  timestamp: string;
}

export class SystemStatusResponse extends ApiMetadata {
  health: HealthStatus;
}
