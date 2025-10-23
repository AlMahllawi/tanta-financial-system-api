import { DataSource, type DataSourceOptions } from "typeorm";
import type { SeederOptions } from "typeorm-extension";
import entities from "./entities/index.js";
import factories from "./factories/index.js";
import seeds from "./seeds/index.js";
import {
	DB_HOST,
	DB_NAME,
	DB_PASSWORD,
	DB_PORT,
	DB_USERNAME,
	NODE_ENV,
} from "./utils/env.js";

export default new DataSource({
	type: "postgres",
	host: DB_HOST,
	port: DB_PORT,
	username: DB_USERNAME,
	password: DB_PASSWORD,
	database: DB_NAME,
	entities,
	factories,
	seeds,
	seedTableName: "Seeds",
	migrationsTableName: "Migrations",
	migrations: ["src/migrations/*.ts"],
	synchronize: NODE_ENV === "development",
	logging: NODE_ENV === "development",
} as DataSourceOptions & SeederOptions);
