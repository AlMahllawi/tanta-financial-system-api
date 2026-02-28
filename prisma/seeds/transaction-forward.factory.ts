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
  } = {},
) => {
  return {
    transactionId,
    senderId,
    receiverId,
    status:
      overrides.status ??
      faker.helpers.arrayElement(Object.values(TransactionForwardStatus)),
    senderComment: faker.lorem.sentence(),
    receiverComment: faker.lorem.sentence(),
    senderSeen: overrides.senderSeen ?? true,
    receiverSeen: overrides.receiverSeen ?? false,
  };
};
