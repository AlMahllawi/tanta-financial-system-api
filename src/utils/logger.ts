import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { inspect } from "node:util";
import chalk, { type ChalkInstance } from "chalk";
import yaml from "js-yaml";
import { config, createLogger, format, transports } from "winston";
import { NODE_ENV } from "./env.js";

const levelsBackground: { [key: string]: ChalkInstance } = {
	error: chalk.bgRed,
	warn: chalk.bgYellow,
	info: chalk.bgWhite,
	http: chalk.bgWhite,
	verbose: chalk.bgCyan,
	debug: chalk.bgBlue,
	silly: chalk.bgMagenta,
};

const LOG_DIR = process.env.LOGS_DIRECTORY ?? join(process.cwd(), "logs");

mkdirSync(LOG_DIR, { recursive: true });

let consoleMetadataFormat = (metadata: object) =>
	Object.keys(metadata).length > 0
		? ` ${inspect(metadata, { colors: true, depth: Infinity })}`
		: "";

if (NODE_ENV !== "development") consoleMetadataFormat = () => "";

export const logger = createLogger({
	level: Object.entries(config.npm.levels).reduce(
		(maxKey, [key, value]) =>
			value > (config.npm.levels[maxKey] ?? -Infinity) ? key : maxKey,
		"",
	),
	levels: config.npm.levels,
	format: format.combine(
		format((info) => {
			info.timestamp ??= new Date().toISOString();
			return info;
		})(),
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
			...(NODE_ENV === "development" ? {} : { level: "info" }),
			format: format.printf(
				({ level, message, timestamp, ...metadata }) =>
					chalk.bgGray.white(` ${timestamp} `) +
					(levelsBackground[level] ?? chalk.bgGray).black(
						` ${level.toUpperCase()} `,
					) +
					` ${message}` +
					consoleMetadataFormat(metadata),
			),
		}),
	],
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection", {
		promise,
		reason: reason instanceof Error ? reason.stack : reason,
	});
});

process.on("uncaughtException", (error) => {
	logger.error("Uncaught Exception", {
		error: error.stack,
	});
});
