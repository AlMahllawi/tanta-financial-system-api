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
  TRANSACTION_FORWARD_RECEIVED: {
    type: NotificationType.INFO,
    description: 'A transaction has been forwarded to the user for review',
    args: {
      transactionId: '123',
      forwardId: '1',
      senderName: 'John Doe',
    },
  },
  TRANSACTION_FORWARD_RESPONDED: {
    type: NotificationType.INFO,
    description: 'The receiver has responded to a forwarded transaction',
    args: {
      transactionId: '123',
      forwardId: '1',
      receiverName: 'Jane Smith',
      status: 'APPROVED',
    },
  },
} as const;
