// entities/Roles.ts
import {
  Entity,
  Column,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { RoleUser } from "./RoleUser";
import { Users } from "./Users";
import { Permissions } from "./Permissions";

@Entity("roles")
export class Roles extends BaseEntity {
  @Column({ length: 191 })
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column({ length: 191 })
  slug: string;

  @Column({ length: 100 })
  special: string;

  @OneToMany(() => RoleUser, (role) => role.rolesData)
  @JoinColumn({ name: "role_id" })
  rolesData: RoleUser;

  @ManyToMany(() => Users, (user) => user.rolesData)
  usersData: Users[];

  @ManyToMany(() => Permissions, (permissions) => permissions.rolesData)
  @JoinTable({
    name: "permission_role",
    joinColumn: {
      name: "role_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "permission_id",
      referencedColumnName: "id",
    },
  })
  permissionsData: Permissions[];
}
