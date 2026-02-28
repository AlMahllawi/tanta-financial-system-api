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
    isFulfilled?: boolean;
  } = {},
) => {
  const isLast = overrides.isLast ?? false;
  const receiverResponded = isLast && faker.datatype.boolean();

  return {
    transactionId,
    senderId,
    receiverId,
    status:
      overrides.status ??
      (isLast && !receiverResponded && !overrides.isFulfilled
        ? TransactionForwardStatus.WAITING
        : faker.helpers.arrayElement(
            Object.values(TransactionForwardStatus).filter(
              (s) => s !== TransactionForwardStatus.WAITING,
            ),
          )),
    senderComment: faker.lorem.sentence(),
    receiverComment:
      isLast && !receiverResponded && !overrides.isFulfilled
        ? null
        : faker.lorem.sentence(),
    senderSeen:
      overrides.senderSeen ??
      (overrides.isFulfilled && isLast
        ? true
        : receiverResponded
          ? false
          : true),
    receiverSeen:
      overrides.receiverSeen ??
      (overrides.isFulfilled && isLast
        ? true
        : receiverResponded
          ? true
          : !isLast),
  };
};
