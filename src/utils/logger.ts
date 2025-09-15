import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { inspect } from "node:util";
import chalk from "chalk";
import yaml from "js-yaml";
import { createLogger, format, transports } from "winston";
import { NODE_ENV } from "./env.js";

const LOG_DIR = process.env.LOGS_DIRECTORY ?? join(process.cwd(), "logs");

mkdirSync(LOG_DIR, { recursive: true });

export const logger = createLogger({
	level: "info",
	format: format.combine(
		format.timestamp({
			format: "YYYY-MM-DD HH:mm:ss",
		}),
		format.errors({ stack: true }),
	),
	transports: [
		new transports.File({
			format: format.printf(
				({ level, message, timestamp, ...meta }) =>
					`---\n${yaml.dump(
						{
							timestamp,
							level,
							message:
								typeof message === "string"
									? // biome-ignore lint/suspicious/noControlCharactersInRegex: remove control characters to save in file
										message.replace(/\x1B\[[0-9;]*m/g, "")
									: message,
							meta: Object.keys(meta).length ? meta : undefined,
						},
						{ skipInvalid: true },
					)}\n...`,
			),
			filename: join(
				LOG_DIR,
				NODE_ENV === "development"
					? "development.yaml"
					: `${NODE_ENV}-${new Date().toISOString()}.yaml`,
			),
		}),
		new transports.Console({
			format: format.printf(
				({ level, message, timestamp, ...metadata }) =>
					chalk.bgGray.white(` ${timestamp} `) +
					chalk.bgWhite.black(` ${level.toUpperCase()} `) +
					` ${message}` +
					(Object.keys(metadata).length > 0
						? ` ${inspect(metadata, { colors: true, depth: Infinity })}`
						: ""),
			),
		}),
	],
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection at:", {
		promise,
		reason: reason instanceof Error ? reason.stack : reason,
	});
});

process.on("uncaughtException", (error) => {
	logger.error("Uncaught Exception:", {
		error: error.stack,
	});
});
