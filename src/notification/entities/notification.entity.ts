import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { NotificationType } from '../../../prisma/generated/enums.js';

export class Notification<
  TCode extends string = string,
  TArgs extends Record<string, string> = Record<string, string>,
> {
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
  code: TCode;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  args?: TArgs;
}
