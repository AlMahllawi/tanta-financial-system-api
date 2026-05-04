import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSeenDto {
  @ApiProperty({ description: 'Whether to set the notification as seen' })
  @IsBoolean()
  seen: boolean;
}
