import { execSync } from "node:child_process";

switch (process.argv[2]) {
	case "migration:generate":
		execSync(
			`pnpm typeorm migration:generate --dataSource ./src/datasource.ts ./src/migrations/${process.argv[3] ?? "migration"}`,
			{ stdio: [0, 1, 2] },
		);
		break;
	case "entity:create":
		execSync(
			`pnpm typeorm entity:create ./src/entities/${process.argv[3] ?? "entity"}.entity`,
			{ stdio: [0, 1, 2] },
		);
		break;
	default:
		process.exit(1);
}
