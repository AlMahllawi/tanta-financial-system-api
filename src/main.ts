import "reflect-metadata";
import chalk from "chalk";
import type { Express } from "express";
import express from "express";
import "express-async-errors";
import type { Server } from "node:http";
import cors, { type CorsOptions } from "cors";
import datasource from "./datasource.js";
import errorHandler from "./middlewares/error.middleware.js";
import {
	documentRouter,
	transactionRouter,
	userRouter,
} from "./routes/index.js";
import { ALLOWED_ORIGINS, PORT } from "./utils/env.js";
import { Exceptions } from "./utils/exceptions.js";
import { logger } from "./utils/logger.js";

const app: Express = express();

app.disable("x-powered-by");

if (ALLOWED_ORIGINS.length > 0) {
	const corsOptions: CorsOptions = {
		credentials: true,
	};

	if (ALLOWED_ORIGINS.length === 1 && ALLOWED_ORIGINS[0] === "*")
		corsOptions.origin = true;
	else {
		corsOptions.origin = (origin, callback) => {
			if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
			else
				callback(
					new Exceptions.Invalid(
						`CORS Blocked: Origin '${origin}' is not allowed.`,
					),
					false,
				);
		};
	}

	app.use(cors(corsOptions));

	logger.info(
		chalk.green(
			`CORS Mode: ${
				corsOptions.origin === true ? "Allow All (Reflected)" : "Whitelist"
			}`,
		),
	);
} else {
	logger.info(chalk.yellow("CORS not configured. Middleware not applied."));
}

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// TODO: log actions

app.use(userRouter);

app.use(documentRouter);

app.use(transactionRouter);

app.use((req, res) => {
	res.status(404).json({ status: "not-found" });
});

app.use(errorHandler);

let server: Server | undefined;

datasource
	.initialize()
	.then(() => {
		logger.info(chalk.green("Connected to the database"));
		server = app.listen(PORT, () => {
			logger.info(`${chalk.green("Listening on port")} ${chalk.magenta(PORT)}`);
		});
	})
	.catch((err) => {
		logger.error(err);
		process.exit(1);
	});

async function cleanup() {
	if (server) {
		await new Promise<void>((resolve) => {
			if (!server || !server.listening) return resolve();
			server.close((err) => {
				if (err) {
					logger.info(chalk.red("Failed to close the HTTP server"));
					logger.error(err);
				} else {
					logger.info(chalk.green("Closed the HTTP server"));
				}
				resolve();
			});
		});
	}

	try {
		if (!datasource.isInitialized) return;
		await datasource.destroy();
		logger.info(chalk.green("Closed the database connection"));
	} catch (err) {
		logger.info(chalk.red("Failed to closed the database connection"));
		logger.error(err);
	}
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
