import { Router } from "express";
import {
	authorizeUser,
	changePassword,
	createUser,
	viewAllUsers,
	viewUser,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/user.middleware.js";

const router: Router = Router();

router.post("/users", authMiddleware, createUser);

router.post("/auth", authorizeUser);

router.get("/users", authMiddleware, viewAllUsers);

router.get("/users/:name", authMiddleware, viewUser);

router.patch("/users/:name", authMiddleware, changePassword);

export default router;
