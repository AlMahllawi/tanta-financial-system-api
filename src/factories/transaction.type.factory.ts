import { setSeederFactory } from "typeorm-extension";
import { TransactionType } from "../entities/transaction.type.entity.js";

export default setSeederFactory(TransactionType, (faker) => {
	const type = new TransactionType();
	type.name = faker.word.noun();
	return type;
});
