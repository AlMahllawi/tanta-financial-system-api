import { compare, hash } from "bcrypt";
import jwt from "jsonwebtoken";
import datasource from "../datasource.js";
import type { UserDTO } from "../dto/user.dto.js";
import { User } from "../entities/user.entity.js";
import type { UserGroups } from "../types/enums.js";
import { BCRYPT_SALT, JWT_SECRET } from "../utils/env.js";
import { Exceptions } from "../utils/exceptions.js";

export namespace UserAdaptor {
	export async function authorize(name: string, password: string) {
		const user = await datasource.getRepository(User).findOneBy({ name });

		if (!user || !(await compare(password, user.hashedPassword)))
			throw new Exceptions.Invalid("Invalid authentication credentials.");

		const content: UserDTO.Token = { name: user.name };

		return { token: jwt.sign(content, JWT_SECRET, { expiresIn: "1d" }), user };
	}

	export async function create(
		name: string,
		password: string,
		group: UserGroups,
	) {
		const user = new User();

		user.name = name;
		user.group = group;
		user.hashedPassword = await hash(password, BCRYPT_SALT);

		try {
			await datasource.getRepository(User).insert(user);
		} catch (error: any) {
			if (error.driverError?.constraint !== "PK_User") throw error;

			throw new Exceptions.Conflict(
				`There exist a user with the name: "${name}". Can't proceed with the creation.`,
			);
		}

		return user;
	}

	export async function view(name: string) {
		return await datasource.getRepository(User).findOneBy({ name });
	}

	export async function viewAll(pageNumber: number, pageSize: number) {
		return await datasource.getRepository(User).find({
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
			order: {
				name: "asc",
			},
		});
	}

	export async function changePassword(name: string, password: string) {
		const userRepository = datasource.getRepository(User);

		const user = await userRepository.findOneBy({ name });

		if (!user) return null;

		user.hashedPassword = await hash(password, BCRYPT_SALT);

		return await userRepository.save(user);
	}
}
