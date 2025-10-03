import { compare, hash } from "bcrypt";
import jwt from "jsonwebtoken";
import datasource from "../datasource.js";
import type { UserDTO } from "../dto/user.dto.js";
import { User } from "../entities/user.entity.js";
import { BCRYPT_SALT, JWT_SECRET } from "../utils/env.js";
import { Exceptions } from "../utils/exceptions.js";

export namespace UserAdaptor {
	export async function authorize(name: string, password: string) {
		const user = await datasource.getRepository(User).findOneBy({ name });

		if (!user || !(await compare(password, user.hashedPassword)))
			throw new Exceptions.Invalid("Invalid authentication credentials.");

		const content: UserDTO.Token = { name: user.name };

		return jwt.sign(content, JWT_SECRET, { expiresIn: "1d" });
	}

	export async function create(name: string, password: string) {
		const user = new User();

		user.name = name;
		user.hashedPassword = await hash(password, BCRYPT_SALT);

		try {
			await datasource.getRepository(User).insert(user);
		} catch (error: any) {
			if (error.driverError?.constraint !== "PK_User") throw error;

			throw new Exceptions.Conflict(
				`There exist a user with the name: ${name}. Can't proceed with the creation.`,
			);
		}

		return user;
	}

	export async function view(name: string) {
		return await datasource.getRepository(User).findOneBy({ name });
	}

	export async function viewAll() {
		// TODO: paging
		return await datasource.getRepository(User).find();
	}
}
