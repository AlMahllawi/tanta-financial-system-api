import { Router } from "express";
import {
	createTransactionType,
	viewTransactionTypes,
} from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/user.middleware.js";

const router: Router = Router();

router.post("/transactions/types", authMiddleware, createTransactionType);

router.get("/transactions/types", authMiddleware, viewTransactionTypes);

export default router;
