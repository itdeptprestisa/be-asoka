// entities/PrProblems.ts
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";
import { Users } from "./Users";

@Entity("pr_problems")
export class PrProblems extends BaseEntity {
  @Column({ type: "int", nullable: true })
  order_id: number | null;

  @Column({ length: 10, nullable: true })
  jenis_masalah: string | null;

  @Column({ length: 255, nullable: true })
  pesan: string | null;

  @Column({ type: "int", nullable: true })
  status: number | null;

  @Column({ type: "int", nullable: true })
  pr_id: number | null;

  @Column({ type: "int", nullable: true })
  customer_phone: number | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "int", nullable: true })
  owner: number | null;

  @Column({ type: "longtext", nullable: true })
  status_log: string | null;

  @ManyToOne(() => Order, (order) => order.prProblemsData)
  @JoinColumn({ name: "order_id" })
  orderData: Order;

  @ManyToOne(() => Users, (users) => users.prProblemsData, {
    nullable: true,
  })
  @JoinColumn({ name: "owner" })
  ownerData: Users;
}
