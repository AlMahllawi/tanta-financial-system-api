import { DataSource, type DataSourceOptions } from "typeorm";
import type { SeederOptions } from "typeorm-extension";
import entities from "./entities/index.js";
import { DB_CONNECTION_URL, NODE_ENV } from "./utils/env.js";

export default new DataSource({
	type: "postgres",
	url: DB_CONNECTION_URL,
	entities,
	migrationsTableName: "Migrations",
	migrations: ["src/migrations/*.ts"],
	seeds: ["src/seeds/*.ts"],
	synchronize: NODE_ENV === "development",
	logging: NODE_ENV === "development",
} as DataSourceOptions & SeederOptions);
