import { DataSource, type DataSourceOptions } from "typeorm";
import type { SeederOptions } from "typeorm-extension";
import entities from "./entities/index.js";
import factories from "./factories/index.js";
import seeds from "./seeds/index.js";
import { DB_CONNECTION_URL, NODE_ENV } from "./utils/env.js";

export default new DataSource({
	type: "postgres",
	url: DB_CONNECTION_URL,
	entities,
	factories,
	seeds,
	seedTableName: "Seeds",
	migrationsTableName: "Migrations",
	migrations: ["src/migrations/*.ts"],
	synchronize: NODE_ENV === "development",
	logging: NODE_ENV === "development",
} as DataSourceOptions & SeederOptions);
