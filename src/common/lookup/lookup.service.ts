import { Injectable } from '@nestjs/common';
import {
  TransactionForwardStatus,
  TransactionPriority,
  UserRole,
} from '../../../prisma/generated/enums.js';
import { LookupResponseDto } from './dto/response.dto.js';

@Injectable()
export class LookupService {
  findAll(): LookupResponseDto {
    return {
      UserRole: Object.values(UserRole),
      TransactionPriority: Object.values(TransactionPriority),
      TransactionForwardStatus: Object.values(TransactionForwardStatus),
    };
  }
}
