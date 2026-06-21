import { faker } from '@faker-js/faker';

import { NotificationType } from '../generated/enums.js';

type NotificationSeed = {
  userId: number;
  type: NotificationType;
  code: string;
  args: Record<string, string>;
  seen: boolean;
};

export const transactionForwardReceivedFactory = (
  userId: number,
  transactionId: number,
  forwardId: number,
  senderName: string,
): NotificationSeed => ({
  userId,
  type: NotificationType.INFO,
  code: 'TRANSACTION_FORWARD_RECEIVED',
  args: {
    transactionId: String(transactionId),
    forwardId: String(forwardId),
    senderName,
  },
  seen: faker.datatype.boolean(0.4),
});

export const transactionForwardRespondedFactory = (
  userId: number,
  transactionId: number,
  forwardId: number,
  receiverName: string,
  status: string,
): NotificationSeed => ({
  userId,
  type: NotificationType.INFO,
  code: 'TRANSACTION_FORWARD_RESPONDED',
  args: {
    transactionId: String(transactionId),
    forwardId: String(forwardId),
    receiverName,
    status,
  },
  seen: faker.datatype.boolean(0.4),
});
