// entities/Users.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { RoleUser } from "./RoleUser";
import { Roles } from "./Roles";
import { OrderPayments } from "./OrderPayments";
import { Order } from "./Order";
import { PrProblems } from "./PrProblems";
import { InventorySpk } from "./InventorySpk";
import { ProductStockEvent } from "./ProductStockEvent";
import { InventoryGoodReceived } from "./InventoryGoodReceived";

@Entity("users")
export class Users extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: "datetime", nullable: true })
  email_verified_at: Date | null;

  @Column()
  password: string;

  @Column({ nullable: true })
  remember_token: string | null;

  @OneToMany(() => RoleUser, (roleUser) => roleUser.userData)
  roleUserData: RoleUser[];

  @ManyToMany(() => Roles, (role) => role.usersData)
  @JoinTable({
    name: "role_user", // pivot table
    joinColumn: {
      name: "user_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "role_id",
      referencedColumnName: "id",
    },
  })
  rolesData: Roles[];

  @OneToMany(() => OrderPayments, (orderPayments) => orderPayments.usersData)
  orderPayments: OrderPayments[];

  @OneToMany(() => Order, (order) => order.ownerData)
  orderData: Order[];

  @OneToMany(() => PrProblems, (problem) => problem.ownerData)
  prProblemsData: PrProblems[];

  @OneToMany(() => InventorySpk, (e) => e.users)
  inventorySpk: InventorySpk[];

  @OneToMany(() => ProductStockEvent, (e) => e.users)
  productStockEvent: ProductStockEvent[];

  @OneToMany(() => InventoryGoodReceived, (e) => e.users)
  goodReceived: InventoryGoodReceived[];


  
}
