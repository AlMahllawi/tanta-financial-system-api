import { setSeederFactory } from "typeorm-extension";
import { TransactionType } from "../entities/transaction.type.entity.js";

export default setSeederFactory(TransactionType, (faker) => {
	const type = new TransactionType();
	type.name = faker.word.noun({ length: { min: 5, max: 255 } });
	return type;
});
