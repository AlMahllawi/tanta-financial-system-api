import dotenv from "dotenv";

dotenv.config();

function variable(key: string): string | undefined;
function variable(key: string, required: true): string;
function variable(key: string, _default: string): string;
function variable(key: string, param?: string | true) {
	const value = process.env[key];
	if (!value) {
		if (param === true)
			throw new Error(`Missing environment variable: "${key}".`);
		if (typeof param === "string") return param;
	}
	return value;
}

function isValidPort(port: any) {
	return !Number.isNaN(port) && port > 0 && port < 2 ** 16;
}

export const NODE_ENV = variable("NODE_ENV", "development");

export const DB_HOST = variable("DB_HOST", "localhost");

export const DB_PORT = (() => {
	const raw = variable("DB_PORT");
	if (!raw) return 5432;
	const parsed = parseInt(raw, 10);
	if (!isValidPort(parsed)) throw new RangeError(`Invalid PORT: ${raw}.`);
	return parsed;
})();

export const DB_USERNAME = variable("DB_USERNAME", "tanta");

export const DB_PASSWORD = variable("DB_PASSWORD", "n0nS3cure");

export const DB_NAME = variable("DB_NAME", "TantaFinancial");

export const PORT = (() => {
	const raw = variable("PORT");
	if (!raw) return 3000;
	const parsed = parseInt(raw, 10);
	if (!isValidPort(parsed)) throw new RangeError(`Invalid PORT: ${raw}.`);
	return parsed;
})();

import { genSaltSync } from "bcrypt";
export const BCRYPT_SALT = variable("BCRYPT_SALT", genSaltSync());

export const JWT_SECRET = variable("JWT_SECRET", "not-secure");

import { join } from "node:path";
export const DOCUMENTS_PATH = variable(
	"DOCUMENTS_PATH",
	join(process.cwd(), "documents"),
);

import fs from "node:fs";

if (!fs.existsSync(DOCUMENTS_PATH)) fs.mkdirSync(DOCUMENTS_PATH);
if (!fs.statSync(DOCUMENTS_PATH).isDirectory())
	throw new Error("Invalid documents path.");

export const ALLOWED_ORIGINS = (() => {
	const raw = variable("ALLOWED_ORIGINS");
	if (!raw) return [];
	return raw.split(",").map((origin) => origin.trim());
})();
