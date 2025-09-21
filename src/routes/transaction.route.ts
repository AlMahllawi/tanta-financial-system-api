import { Router } from "express";
import {
	createTransaction,
	createTransactionForward,
	createTransactionType,
	deleteTransaction,
	viewTransaction,
	viewTransactions,
	viewTransactionTypes,
} from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/user.middleware.js";

const router: Router = Router();

router.post("/transactions/types", authMiddleware, createTransactionType);

router.get("/transactions/types", authMiddleware, viewTransactionTypes);

router.post("/transactions", authMiddleware, createTransaction);

router.get("/transactions", authMiddleware, viewTransactions);

router.get("/transactions/:id", authMiddleware, viewTransaction);

router.delete("/transactions/:id", authMiddleware, deleteTransaction);

router.post(
	"/transactions/:id/forwards",
	authMiddleware,
	createTransactionForward,
);

export default router;
