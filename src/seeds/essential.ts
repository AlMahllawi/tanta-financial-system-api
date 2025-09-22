import type { Seeder } from "typeorm-seeding";
import { User } from "../entities/user.entity.js";

export default class UserSeeder implements Seeder {
	public async run(factory: Factory): Promise<void> {
		// Generate and insert 50 users with randomized data
		await factory(User)().createMany(50);
	}
}
