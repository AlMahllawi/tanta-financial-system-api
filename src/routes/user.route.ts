import { Router } from "express";
import {
	authorizeUser,
	createUser,
	viewAllUsers,
	viewUser,
} from "../controllers/user.controller.js";
import { permissionsMiddleware } from "../middlewares/permissions.middleware.js";
import { authMiddleware } from "../middlewares/user.middleware.js";

const router: Router = Router();

router.post(
	"/users",
	authMiddleware,
	permissionsMiddleware("CreateUser"),
	createUser,
);

router.post("/auth", authorizeUser);

router.get(
	"/users",
	authMiddleware,
	permissionsMiddleware("ViewAllUsers"),
	viewAllUsers,
);

router.get("/users/:name", authMiddleware, viewUser);

export default router;
