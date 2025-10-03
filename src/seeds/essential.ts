import { genSaltSync, hash } from "bcrypt";
import type { DataSource } from "typeorm";
import type { Seeder, SeederFactoryManager } from "typeorm-extension";
import { User } from "../entities/user.entity.js";
import { UserGroups } from "../types/enums.js";

const BCRYPT_SALT = genSaltSync();

export class Essential implements Seeder {
	track = true;

	public async run(
		dataSource: DataSource,
		factoryManager: SeederFactoryManager,
	): Promise<any> {
		await dataSource.getRepository(User).save({
			name: "admin",
			hashedPassword: await hash("admin1234", BCRYPT_SALT),
			group: UserGroups.ADMIN,
		});
	}
}
