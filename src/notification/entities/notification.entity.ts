import { ApiProperty } from '@nestjs/swagger';

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
  title: string;

  @ApiProperty()
  description: string;
}
