import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { NotificationType } from '../../../prisma/generated/enums.js';

export class Notification {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  seen: boolean;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  args?: Record<string, unknown>;
}
