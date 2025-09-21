import { Router } from "express";
import {
	createTransaction,
	createTransactionForward,
	createTransactionType,
	deleteTransaction,
	deleteTransactionForward,
	updateTransaction,
	updateTransactionForwardStatus,
	viewTransaction,
	viewTransactions,
	viewTransactionTypes,
} from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/user.middleware.js";

const router: Router = Router();

router.post("/transactions/types", authMiddleware, createTransactionType);

router.get("/transactions/types", authMiddleware, viewTransactionTypes);

// router.post("/transactions/documents", authMiddleware, ...);

// router.get("/transactions/documents/:user/:document", authMiddleware, ...);

router.post("/transactions", authMiddleware, createTransaction);

router.get("/transactions", authMiddleware, viewTransactions);

router.get("/transactions/:id", authMiddleware, viewTransaction);

router.patch("/transactions/:id", authMiddleware, updateTransaction);

router.delete("/transactions/:id", authMiddleware, deleteTransaction);

router.post(
	"/transactions/:id/forwards",
	authMiddleware,
	createTransactionForward,
);

router.get(
	"/transactions/:id/forwards",
	authMiddleware,
	createTransactionForward,
);

router.patch(
	"/transactions/:id/forwards/:forwardId",
	authMiddleware,
	updateTransactionForwardStatus,
);

router.delete(
	"/transactions/:id/forwards/:forwardId",
	authMiddleware,
	deleteTransactionForward,
);

export default router;
