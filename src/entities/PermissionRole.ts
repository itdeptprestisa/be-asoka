import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Roles } from "./Roles";
import { Permissions } from "./Permissions";

@Entity({ name: "permission_role" })
export class PermissionRole {
  @PrimaryGeneratedColumn("increment", { type: "bigint", unsigned: true })
  id: number;

  @Column({ type: "bigint", unsigned: true })
  permission_id: number;

  @Column({ type: "bigint", unsigned: true })
  role_id: number;

  @CreateDateColumn({ name: "created_at", type: "datetime", nullable: true })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime", nullable: true })
  updated_at: Date;

  // Optional: relations for eager loading
  @ManyToOne(() => Permissions, { eager: false })
  @JoinColumn({ name: "permission_id" })
  permissionsData: Permissions;

  @ManyToOne(() => Roles, { eager: false })
  @JoinColumn({ name: "role_id" })
  rolesData: Roles;
}
