import { Entity, ManyToMany, PrimaryColumn } from "typeorm";
import { User } from "./user.entity.js";

@Entity("Permissions")
export class Permission {
	@PrimaryColumn({
		type: "varchar",
		length: 255,
		primaryKeyConstraintName: "PK_Permission",
	})
	name!: string;

	@ManyToMany(
		() => User,
		(user) => user.permissions,
	)
	users!: User[];
}
