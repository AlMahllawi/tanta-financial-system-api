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
  const isFulfilled = overrides.isFulfilled ?? false;

  // A forward is only physically waiting for receiver's response if it is
  // the very last forward in an unfulfilled transaction. The faker decides
  // whether the receiver has gotten around to responding yet.
  const isPending = isLast && !isFulfilled && faker.datatype.boolean();

  let status = overrides.status;
  if (!status)
    if (isPending) status = TransactionForwardStatus.WAITING;
    else if (isLast && isFulfilled)
      status = faker.helpers.arrayElement([
        TransactionForwardStatus.APPROVED,
        TransactionForwardStatus.REJECTED,
      ]);
    else
      status = faker.helpers.arrayElement(
        Object.values(TransactionForwardStatus).filter(
          (s) => s !== TransactionForwardStatus.WAITING,
        ),
      );

  // If the receiver has responded but the transaction isn't fulfilled,
  // the sender hasn't necessarily seen their response yet.
  const senderSeen =
    overrides.senderSeen ?? !(isLast && !isFulfilled && !isPending);

  // If the forward is still pending, the receiver hasn't acted/seen it.
  const receiverSeen = overrides.receiverSeen ?? !isPending;

  return {
    transactionId,
    senderId,
    receiverId,
    status,
    senderComment: faker.lorem.sentence(),
    receiverComment: isPending ? null : faker.lorem.sentence(),
    senderSeen,
    receiverSeen,
  };
};
