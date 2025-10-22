import random from "random";
import { setSeederFactory } from "typeorm-extension";
import { TransactionForward } from "../entities/transaction.forward.entity.js";
import { TransactionForwardStatus } from "../types/enums.js";

const status = Object.values(TransactionForwardStatus);
[TransactionForwardStatus.REJECTED, TransactionForwardStatus.APPROVED].forEach(
	(state) => {
		status.splice(status.indexOf(state), 1);
	},
);

export default setSeederFactory(TransactionForward, (faker) => {
	const transactionForward = new TransactionForward();
	transactionForward.status = random.choice(status) as TransactionForwardStatus;
	return transactionForward;
});
