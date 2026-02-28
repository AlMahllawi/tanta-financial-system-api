import { faker } from '@faker-js/faker';
import { TransactionForwardStatus } from '../generated/enums.js';

export const transactionForwardFactory = (
  transactionId: number,
  senderId: number,
  receiverId: number,
  overrides: {
    status?: TransactionForwardStatus;
    senderSeen?: boolean;
    receiverSeen?: boolean;
    isLast?: boolean;
  } = {},
) => {
  const isLast = overrides.isLast ?? false;
  return {
    transactionId,
    senderId,
    receiverId,
    status:
      overrides.status ??
      (isLast
        ? TransactionForwardStatus.WAITING
        : faker.helpers.arrayElement(
            Object.values(TransactionForwardStatus).filter(
              (s) => s !== TransactionForwardStatus.WAITING,
            ),
          )),
    senderComment: faker.lorem.sentence(),
    receiverComment: faker.lorem.sentence(),
    senderSeen: overrides.senderSeen ?? true,
    receiverSeen: overrides.receiverSeen ?? !isLast,
  };
};
