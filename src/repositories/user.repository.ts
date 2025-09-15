import { compare, hash } from "bcrypt";
import type { FindOptionsSelect } from "typeorm";
import datasource from "../datasource.js";
import { User } from "../entities/user.entity.js";
import { ExpectedError } from "../utils/custom.errors.js";
import { BCRYPT_SALT } from "../utils/env.js";

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
				// TODO: check pk increase even though operation failed?
				throw err.driverError?.constraint === "UniqueUserName"
					? new ExpectedError(
							"user-exists",
							`There exist a user with the name: ${name}. Can't proceed with the creation.`,
						)
					: err;
			});
		return await this.findOne({
			where: { id: insertResult.identifiers[0]?.id },
			select: User.VisibleColumns as FindOptionsSelect<User>,
		});
	},

	async authorize(name: string, password: string) {
		const user = await this.findOneBy({ name });
		if (user && (await compare(password, user.hashedPassword))) return user;
	},

	async view(id: number) {
		return await this.findOne({
			where: { id },
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
