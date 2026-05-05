import {
  Body,
  Controller,
  Get,
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
import { NotificationMetadata } from '../common/constants/notification-metadata.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { User } from '../user/entities/user.entity.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';
import { UpdateSeenDto } from './dto/update-seen.dto.js';
import { Notification } from './entities/notification.entity.js';
import { NotificationService } from './notification.service.js';

const NOTIFICATION_EXAMPLE = {
  data: Object.entries(NotificationMetadata).map(([code, meta], index) => ({
    id: index + 1,
    userId: 1,
    timestamp: new Date(),
    seen: false,
    type: meta.type,
    code,
    args: meta.args,
  })),
  pagination: {
    total: Object.keys(NotificationMetadata).length,
    lastPage: 1,
    currentPage: 1,
    perPage: 10,
    prev: null,
    next: null,
  },
};

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all notifications for the current user' })
  @ApiPaginatedResponse(
    Notification,
    'List of notifications with their metadata and arguments',
    NOTIFICATION_EXAMPLE,
  )
  findAll(@CurrentUser() user: User, @Query() queryDto: NotificationQueryDto) {
    return this.notificationService.findAll(user.id, queryDto);
  }

  @Patch(':id/seen')
  @ApiOperation({ summary: 'Update the seen status of a notification' })
  @ApiOkResponse({
    type: Notification,
    description: 'Notification seen status updated successfully',
  })
  @ApiErrorResponses(ErrorCode.NOTIFICATION_NOT_FOUND)
  updateSeen(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() updateSeenDto: UpdateSeenDto,
  ) {
    return this.notificationService.updateSeen(id, user.id, updateSeenDto.seen);
  }
}
