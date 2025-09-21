import bodyParser from "body-parser";
import { Router } from "express";
import { upload, uploadDocument } from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/user.middleware.js";

const router: Router = Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.post(
	"/documents",
	authMiddleware,
	upload.single("file"),
	uploadDocument,
);

export default router;
