import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from "typeorm";
import { Roles } from "./Roles";

@Entity({ name: "permissions" })
export class Permissions {
  @PrimaryGeneratedColumn({ type: "int", unsigned: true })
  id: number;

  @CreateDateColumn({ name: "created_at", type: "datetime", nullable: true })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime", nullable: true })
  updated_at: Date;

  @Column({ type: "varchar", length: 191 })
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "varchar", length: 191 })
  slug: string;

  @ManyToMany(() => Roles, (role) => role.permissionsData)
  rolesData: Roles[];
}
