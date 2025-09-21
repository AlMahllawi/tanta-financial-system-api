import bodyParser from "body-parser";
import { Router } from "express";
import {
	deleteDocument,
	upload,
	uploadDocument,
} from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/user.middleware.js";

const router: Router = Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.post(
	"/documents",
	authMiddleware,
	upload.single("file"),
	uploadDocument,
);

router.delete("/documents/:userName/:document", authMiddleware, deleteDocument);

export default router;
