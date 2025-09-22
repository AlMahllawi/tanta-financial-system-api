import { Permission } from "./permission.entity.js";
import { TransactionDocument } from "./transaction.document.entity.js";
import { Transaction } from "./transaction.entity.js";
import { TransactionForward } from "./transaction.forward.entity.js";
import { TransactionType } from "./transaction.type.entity.js";
import { User } from "./user.entity.js";

export default [
	User,
	Permission,
	TransactionType,
	Transaction,
	TransactionDocument,
	TransactionForward,
];
