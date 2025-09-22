import type { DataSource } from "typeorm";
import type { Seeder, SeederFactoryManager } from "typeorm-extension";
import { User } from "../entities/user.entity.js";

export class Dump implements Seeder {
	track = false;

	public async run(
		dataSource: DataSource,
		factoryManager: SeederFactoryManager,
	): Promise<any> {
		const userFactory = await factoryManager.get(User);

		await userFactory.saveMany(15);
	}
}
