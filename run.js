import { execSync } from "node:child_process";

switch (process.argv[2]) {
	case "migration:generate":
		execSync(
			`pnpm typeorm migration:generate ./src/migrations/${process.argv[3] ?? "migration"}`,
			{ stdio: [0, 1, 2] },
		);
		break;
	default:
		process.exit(1);
}
