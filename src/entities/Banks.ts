// entities/Banks.ts
import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { OrderPayments } from "./OrderPayments";

@Entity("banks")
export class Banks extends BaseEntity {
  @Column({ length: 191 })
  name: string;

  @Column({ length: 191 })
  description: string;

  @Column({ type: "int" })
  hook_account_id: number;

  @OneToMany(() => OrderPayments, (customer) => customer.bankData)
  orderPaymentsData: OrderPayments;
}
