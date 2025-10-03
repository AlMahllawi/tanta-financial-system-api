import transactionDocumentFactory from "./transaction.document.factory.js";
import transactionFactory from "./transaction.factory.js";
import transactionForwardFactory from "./transaction.forward.factory.js";
import transactionTypeFactory from "./transaction.type.factory.js";
import userFactory from "./user.factory.js";

export default [
	userFactory,
	transactionTypeFactory,
	transactionFactory,
	transactionDocumentFactory,
	transactionForwardFactory,
];
