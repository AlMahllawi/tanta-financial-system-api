import "reflect-metadata";
import chalk from "chalk";
import type { Express } from "express";
import express from "express";
import datasource from "./datasource.js";
import errorHandler from "./middlewares/error.middleware.js";
import { PORT } from "./utils/env.js";
import { logger } from "./utils/logger.js";
import { ResponseStatus } from "./utils/response.status.js";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res
		.status(200)
		.json({ status: ResponseStatus.OK, timestamp: new Date().toISOString() });
});

app.use(errorHandler);

datasource
	.initialize()
	.then(() => {
		logger.info(chalk.green("Connected to the database"));
		app.listen(PORT, () => {
			logger.info(`${chalk.green("Listening on port")} ${chalk.magenta(PORT)}`);
		});
	})
	.catch((err) => {
		logger.error(err);
		process.exit(1);
	});
