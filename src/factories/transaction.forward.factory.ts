import random from "random";
import { setSeederFactory } from "typeorm-extension";
import { TransactionForward } from "../entities/transaction.forward.entity.js";
import { TransactionForwardStatus } from "../types/enums.js";

const status = Object.values(TransactionForwardStatus);
status.splice(status.indexOf(TransactionForwardStatus.FULFILLED), 1);

export default setSeederFactory(TransactionForward, (faker) => {
	const transactionForward = new TransactionForward();
	transactionForward.status = random.choice(status) as TransactionForwardStatus;
	return transactionForward;
});
