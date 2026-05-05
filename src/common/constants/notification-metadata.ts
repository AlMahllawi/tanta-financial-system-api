import { NotificationType } from '../../../prisma/generated/enums.js';

export const NotificationMetadata = {
  BUDGET_ALLOCATION_OVERFLOW_ATTEMPT: {
    type: NotificationType.WARNING,
    description: 'A user attempted to allocate more than the available budget',
    args: {
      transactionId: '123',
      categoryName: 'General',
      availableAmount: '1000',
      requestedAmount: '1500',
      attemptedBy: '1',
    },
  },
} as const;
