import { type RequestHandler, Router } from "express";
import {
	authorizeUser,
	createUser,
	viewAllUsers,
	viewUser,
} from "../controllers/user.controller.js";
import {
	authMiddleware,
	userAuthSchema,
	userCreationSchema,
} from "../middlewares/user.middleware.js";

const router: Router = Router();

router.post("/users", authMiddleware, userCreationSchema, createUser);

router.post("/auth", userAuthSchema, authorizeUser);

router.get("/users", authMiddleware, viewAllUsers);

router.get("/users/:id", authMiddleware, viewUser as unknown as RequestHandler); // TODO: handle better

export default router;
