import { Injectable } from '@nestjs/common';
import {
  TransactionForwardStatus,
  TransactionPriority,
  UserGroups,
} from 'prisma/generated/enums';
import { LookupResponseDto } from './dto/response.dto';

@Injectable()
export class LookupService {
  findAll(): LookupResponseDto {
    return {
      UserGroups: Object.values(UserGroups),
      TransactionPriority: Object.values(TransactionPriority),
      TransactionForwardStatus: Object.values(TransactionForwardStatus),
    };
  }
}
