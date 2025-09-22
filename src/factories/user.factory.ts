import { genSaltSync, hashSync } from "bcrypt";
import { setSeederFactory } from "typeorm-extension";
import { User } from "../entities/user.entity.js";

export const BCRYPT_SALT = genSaltSync();

export default setSeederFactory(User, (faker) => {
	const user = new User();
	user.name = faker.person.fullName();
	user.hashedPassword = hashSync("Pass1234", BCRYPT_SALT);
	return user;
});
