import { genSaltSync, hash } from "bcrypt";
import type { DataSource } from "typeorm";
import type { Seeder, SeederFactoryManager } from "typeorm-extension";
import { Permission } from "../entities/permission.entity.js";
import { User } from "../entities/user.entity.js";

const BCRYPT_SALT = genSaltSync();

export class Essential implements Seeder {
	track = true;

	public async run(
		dataSource: DataSource,
		factoryManager: SeederFactoryManager,
	): Promise<any> {
		const permissions = await dataSource
			.getRepository(Permission)
			.save([{ name: "Administrator" }]);

		await dataSource.getRepository(User).save({
			name: "admin",
			hashedPassword: await hash("admin1234", BCRYPT_SALT),
			permissions,
		});
	}
}
