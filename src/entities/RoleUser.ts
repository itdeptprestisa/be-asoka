// entities/RoleUser.ts
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Users } from "./Users";
import { Roles } from "./Roles";

@Entity("role_user")
export class RoleUser extends BaseEntity {
  @Column({ type: "int", unsigned: true, nullable: true })
  role_id: number | null;

  @Column({ type: "int", unsigned: true, nullable: true })
  user_id: number | null;

  @ManyToOne(() => Users, (user) => user.roleUserData)
  @JoinColumn({ name: "user_id" })
  userData: Users;

  @ManyToOne(() => Roles, (role) => role.rolesData)
  @JoinColumn({ name: "role_id" })
  rolesData: Roles;
}
