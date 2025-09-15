import { DataSource } from "typeorm";
import entities from "./entities/index.js";
import { DB_CONNECTION_URL, NODE_ENV } from "./utils/env.js";

export default new DataSource({
	type: "postgres",
	url: DB_CONNECTION_URL,
	entities,
	synchronize: NODE_ENV === "development",
	logging: NODE_ENV === "development",
});
