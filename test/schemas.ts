import { z } from 'zod';

import {
  NotificationType,
  TransactionForwardStatus,
  TransactionPriority,
  UserPresence,
  UserRole,
} from '../prisma/generated/enums.js';
import type { BudgetCategoryQueryDto } from '../src/budget-categories/dto/budget-category-query.dto.js';
import type { BudgetEntryQueryDto } from '../src/budget-categories/dto/budget-entry-query.dto.js';
import type { CreateBudgetEntryDto } from '../src/budget-categories/dto/create-budget-entry.dto.js';
import type { UpdateBudgetCategoryDto } from '../src/budget-categories/dto/update-budget-category.dto.js';
import type {
  BudgetCategory,
  BudgetEntry,
} from '../src/budget-categories/entities/budget-category.entity.js';
import type { CreateDepartmentDto } from '../src/department/dto/create-department.dto.js';
import type { DepartmentQueryDto } from '../src/department/dto/department-query.dto.js';
import type { UpdateDepartmentDto } from '../src/department/dto/update-department.dto.js';
import type { Department } from '../src/department/entities/department.entity.js';
import type { Document } from '../src/document/entities/document.entity.js';
import type { NotificationQueryDto } from '../src/notification/dto/notification-query.dto.js';
import type { UpdateSeenDto } from '../src/notification/dto/update-seen.dto.js';
import type { Notification } from '../src/notification/entities/notification.entity.js';
import type { CreateTransactionDto } from '../src/transaction/dto/create-transaction.dto.js';
import type { Transaction } from '../src/transaction/entities/transaction.entity.js';
import type { TransactionSummary } from '../src/transaction/entities/transaction-summary.entity.js';
import type { CreateTransactionForwardDto } from '../src/transaction-forward/dto/create-transaction-forward.dto.js';
import type { UpdateTransactionForwardDto } from '../src/transaction-forward/dto/update-transaction-forward.dto.js';
import type { UpdateTransactionForwardSenderDto } from '../src/transaction-forward/dto/update-transaction-forward-sender.dto.js';
import type { TransactionForward } from '../src/transaction-forward/entities/transaction-forward.entity.js';
import type { TransactionType } from '../src/transaction-type/entities/transaction-type.entity.js';
import type { CreateUserDto } from '../src/user/dto/create-user.dto.js';
import type { UserQueryDto } from '../src/user/dto/user-query.dto.js';
import type { User } from '../src/user/entities/user.entity.js';

export const dataWrapperSchema = z.object({ data: z.unknown() });

export const apiExceptionResponseSchema = z.object({
  statusCode: z.number(),
  message: z.object({
    key: z.string(),
    args: z.record(z.string(), z.any()).optional(),
  }),
  error: z.string(),
});

export const paginationSchema = z.object({
  currentPage: z.number(),
  perPage: z.number(),
  total: z.number(),
});

export const paginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  pagination: paginationSchema,
});

type Serialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K] extends Date | undefined
        ? string | undefined
        : T[K] extends Date | null | undefined
          ? string | null | undefined
          : T[K] extends Array<infer U>
            ? Array<Serialized<U>>
            : T[K] extends object
              ? Serialized<T[K]>
              : T[K];
};

type OmittedUser = Omit<Serialized<User>, 'hashedPassword'>;

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string(),
  active: z.boolean(),
  role: z.enum(UserRole),
  presence: z.enum(UserPresence),
  lastLogin: z.string().nullable(),
  departmentName: z.string(),
}) satisfies z.ZodType<OmittedUser>;

export const authResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: userSchema,
});

export const createDepartmentDtoSchema = z.object({
  name: z.string(),
}) satisfies z.ZodType<CreateDepartmentDto>;

export const updateDepartmentDtoSchema = z.object({
  name: z.string().optional(),
  managerId: z.number().optional(),
}) satisfies z.ZodType<UpdateDepartmentDto>;

export const departmentQueryDtoSchema = z.object({
  page: z.number().optional(),
  perPage: z.number().optional(),
  name: z.string().optional(),
  manager: z.string().optional(),
}) satisfies z.ZodType<DepartmentQueryDto>;

export const departmentSchema = z.object({
  name: z.string(),
  managerId: z.number().nullable(),
}) satisfies z.ZodType<Serialized<Department>>;

export const createUserDtoSchema = z.object({
  name: z.string(),
  departmentName: z.string(),
  password: z.string(),
  role: z.enum(UserRole).default(UserRole.USER),
}) satisfies z.ZodType<CreateUserDto>;

export const userQueryDtoSchema = z.object({
  page: z.number().optional(),
  perPage: z.number().optional(),
  name: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(UserRole).optional(),
  active: z.boolean().optional(),
}) satisfies z.ZodType<UserQueryDto>;

type OmittedDocument = Omit<Serialized<Document>, 'content'>;

export const documentSchema = z.object({
  id: z.number(),
  title: z.string(),
  uploadedAt: z.string(),
  uploaderId: z.number(),
  downloadURI: z.string(),
}) satisfies z.ZodType<OmittedDocument>;

export const transactionTypeSchema = z.object({
  name: z.string(),
  creatorId: z.number(),
}) satisfies z.ZodType<Serialized<TransactionType>>;

export const createTransactionDtoSchema = z.object({
  title: z.string(),
  description: z.string(),
  typeName: z.string(),
  priority: z.enum(TransactionPriority).default(TransactionPriority.LOW),
  documentsIds: z.array(z.number()).optional(),
}) satisfies z.ZodType<CreateTransactionDto>;

type OmittedTransaction = Omit<
  Serialized<Transaction>,
  'documents' | 'budgetName' | 'budgetAllocation'
> & {
  documents?: OmittedDocument[];
  budgetName?: string | null;
  budgetAllocation?: number | null;
};

export const transactionSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  typeName: z.string(),
  fulfilled: z.boolean(),
  budgetName: z.string().nullable().optional(),
  budgetAllocation: z.number().nullable().optional(),
  priority: z.enum(TransactionPriority),
  lastForwardStatus: z.enum(TransactionForwardStatus).optional(),
  creatorId: z.number(),
  createdAt: z.string(),
  documents: z.array(documentSchema).optional(),
}) satisfies z.ZodType<OmittedTransaction>;

export const transactionSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  createdAt: z.string(),
  typeName: z.string(),
  fulfilled: z.boolean(),
  priority: z.enum(TransactionPriority),
  lastForwardStatus: z.enum(TransactionForwardStatus).optional(),
  documentsCount: z.number(),
}) satisfies z.ZodType<Serialized<TransactionSummary>>;

export const createTransactionForwardDtoSchema = z.object({
  receiverId: z.number(),
  comment: z.string().optional(),
}) satisfies z.ZodType<CreateTransactionForwardDto>;

export const updateTransactionForwardDtoSchema = z.object({
  status: z.enum(TransactionForwardStatus).optional(),
  comment: z.string().optional(),
}) satisfies z.ZodType<UpdateTransactionForwardDto>;

export const updateTransactionForwardSenderDtoSchema = z.object({
  comment: z.string().optional(),
}) satisfies z.ZodType<UpdateTransactionForwardSenderDto>;

type OmittedTransactionForward = Omit<
  Serialized<TransactionForward>,
  'senderId' | 'receiverId' | 'sender' | 'receiver'
> & {
  sender: OmittedUser;
  receiver: OmittedUser;
};

export const transactionForwardSchema = z.object({
  id: z.number(),
  status: z.enum(TransactionForwardStatus),
  senderComment: z.string().nullable(),
  receiverComment: z.string().nullable(),
  sender: userSchema,
  receiver: userSchema,
  senderSeen: z.boolean(),
  senderSeenAt: z.string().nullable(),
  receiverSeen: z.boolean(),
  receiverSeenAt: z.string().nullable(),
  forwardedAt: z.string(),
  updatedAt: z.string(),
  transactionId: z.number(),
}) satisfies z.ZodType<OmittedTransactionForward>;

export const budgetCategoryQueryDtoSchema = z.object({
  page: z.number().optional(),
  perPage: z.number().optional(),
  name: z.string().optional(),
}) satisfies z.ZodType<BudgetCategoryQueryDto>;

export const budgetEntryQueryDtoSchema = z.object({
  page: z.number().optional(),
  perPage: z.number().optional(),
  inputter: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
}) satisfies z.ZodType<Serialized<BudgetEntryQueryDto>>;

export const createBudgetEntryDtoSchema = z.object({
  amount: z.number().min(1),
}) satisfies z.ZodType<CreateBudgetEntryDto>;

export const updateBudgetCategoryDtoSchema = z.object({
  newName: z.string().optional(),
  preallocation: z.number().optional(),
}) satisfies z.ZodType<UpdateBudgetCategoryDto>;

export const budgetEntrySchema = z.object({
  id: z.number(),
  inputterId: z.number(),
  amount: z.number(),
  budgetName: z.string(),
  createdAt: z.string(),
}) satisfies z.ZodType<Serialized<BudgetEntry>>;

export const budgetCategorySchema = z.object({
  name: z.string(),
  budget: z.number(),
  allocated: z.number(),
  available: z.number(),
  preallocation: z.number(),
}) satisfies z.ZodType<Serialized<BudgetCategory>>;

export const notificationQueryDtoSchema = z.object({
  page: z.number().optional(),
  perPage: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}) satisfies z.ZodType<NotificationQueryDto>;

export const updateSeenDtoSchema = z.object({
  seen: z.boolean(),
}) satisfies z.ZodType<UpdateSeenDto>;

export const notificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  timestamp: z.string(),
  seen: z.boolean(),
  type: z.enum(NotificationType),
  code: z.string(),
  args: z.record(z.string(), z.any()).optional(),
}) satisfies z.ZodType<Serialized<Notification>>;

export const budgetAllocationOverflowArgsSchema = z.object({
  transactionId: z.string(),
  categoryName: z.string(),
  availableAmount: z.string(),
  requestedAmount: z.string(),
  attemptedBy: z.string(),
});

export const transactionForwardReceivedArgsSchema = z.object({
  transactionId: z.string(),
  forwardId: z.string(),
  senderName: z.string(),
});

export const transactionForwardRespondedArgsSchema = z.object({
  transactionId: z.string(),
  forwardId: z.string(),
  receiverName: z.string(),
  status: z.string(),
});
