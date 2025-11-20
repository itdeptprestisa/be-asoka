// entities/OrderPayments.ts
import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";
import { Banks } from "./Banks";
import { Users } from "./Users";

@Entity("order_payments")
export class OrderPayments extends BaseEntity {
  @Column({ type: "datetime" })
  transaction_date: Date;

  @Column({ type: "int", unsigned: true, nullable: true })
  order_id: number | null;

  @Column({ length: 191, nullable: true })
  transaction_id: string | null;

  @Column({ type: "int", unsigned: true, nullable: true })
  payment_method: number | null;

  @Column({ length: 10, nullable: true })
  status: string | null;

  @Column({ type: "longtext", nullable: true })
  receipt: string | null;

  @Column({ type: "int", nullable: true })
  approved: number | null;

  @Column({ type: "double", precision: 15, scale: 2, nullable: true })
  amount: number | null;

  @Column({ type: "longtext" })
  notes: string;

  @Column({ type: "int", unsigned: true, nullable: true })
  user_id: number | null;

  @Column({ type: "longtext", nullable: true })
  log: string | null;

  @ManyToOne(() => Order, (order) => order.orderPaymentsData)
  @JoinColumn({ name: "order_id" })
  orderData: Order;

  @ManyToOne(() => Banks, (banks) => banks.orderPaymentsData)
  @JoinColumn({ name: "payment_method" })
  bankData: Banks;

  @ManyToOne(() => Users, (users) => users.orderPayments, {
    nullable: true,
  })
  @JoinColumn({ name: "user_id" })
  usersData: Users;
}
