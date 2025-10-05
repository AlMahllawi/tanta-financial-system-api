import dotenv from "dotenv";

dotenv.config();

function variable(key: string): string | undefined;
function variable(key: string, required: true): string;
function variable(key: string, _default: string): string;
function variable(key: string, param?: string | boolean) {
	const value = process.env[key];
	if (!value) {
		if (param === true)
			throw new Error(`Missing environment variable: "${key}".`);
		if (typeof param === "string") return param;
	}
	return value;
}

export const NODE_ENV = variable("NODE_ENV", "development");

export const DB_CONNECTION_URL = variable("DB_CONNECTION_URL", true);

export const PORT = (() => {
	const raw = variable("PORT");
	if (!raw) return 3000;
	const parsed = parseInt(raw, 10);
	if (Number.isNaN(parsed) || parsed <= 0 || parsed >= 2 ** 16)
		throw new RangeError(`Invalid PORT: ${parsed}.`);
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
