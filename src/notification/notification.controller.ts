import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { User } from '../user/entities/user.entity.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';
import { UpdateSeenDto } from './dto/update-seen.dto.js';
import { Notification } from './entities/notification.entity.js';
import { NotificationService } from './notification.service.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all notifications for the current user' })
  @ApiPaginatedResponse(Notification)
  findAll(@CurrentUser() user: User, @Query() queryDto: NotificationQueryDto) {
    return this.notificationService.findAll(user.id, queryDto);
  }

  @Patch(':id/seen')
  @ApiOperation({ summary: 'Update the seen status of a notification' })
  @ApiOkResponse({
    type: Notification,
    description: 'Notification seen status updated successfully',
  })
  @ApiErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found or does not belong to the user',
    errorCode: ErrorCode.NOTIFICATION_NOT_FOUND,
    args: { id: 1 },
  })
  updateSeen(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() updateSeenDto: UpdateSeenDto,
  ) {
    return this.notificationService.updateSeen(id, user.id, updateSeenDto.seen);
  }
}
