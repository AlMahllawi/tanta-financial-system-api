import { compare, hash } from "bcrypt";
import type { FindOptionsSelect } from "typeorm";
import datasource from "../datasource.js";
import { User } from "../entities/user.entity.js";
import { BCRYPT_SALT } from "../utils/env.js";
import { Exceptions } from "../utils/exceptions.js";

export const userRepository = datasource.getRepository(User).extend({
	async create(name: string, password: string) {
		const hashedPassword = await hash(password, BCRYPT_SALT);
		const insertResult = await this.createQueryBuilder()
			.insert()
			.into(User)
			.values({
				name,
				hashedPassword,
			})
			.execute()
			.catch((err: any) => {
				throw err.driverError?.constraint === "PK_User"
					? new Exceptions.Conflict(
							`There exist a user with the name: ${name}. Can't proceed with the creation.`,
						)
					: err;
			});
		return await this.findOne({
			where: { name: insertResult.identifiers[0]?.name },
			select: User.VisibleColumns as FindOptionsSelect<User>,
		});
	},

	async authorize(name: string, password: string) {
		const user = await this.findOneBy({ name });
		if (user && (await compare(password, user.hashedPassword))) return user;
	},

	async view(name: string) {
		return await this.findOne({
			where: { name },
			select: User.VisibleColumns as FindOptionsSelect<User>,
		});
	},

	async viewAll() {
		// TODO: paging
		return await this.find({
			select: User.VisibleColumns as FindOptionsSelect<User>,
		});
	},
});
