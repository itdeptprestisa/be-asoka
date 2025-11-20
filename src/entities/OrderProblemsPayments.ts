// entities/OrderProblemsPayments.ts
import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { OrderProblems } from "./OrderProblems";

@Entity("order_problems_payments")
export class OrderProblemsPayments extends BaseEntity {
  @Column({ type: "datetime" })
  transaction_date: Date;

  @Column({ length: 50 })
  order_problem_id: string;

  @Column({ length: 50 })
  order_id: string;

  @Column({ length: 191, nullable: true })
  transaction_id: string | null;

  @Column({ type: "int", unsigned: true })
  payment_method: number;

  @Column({ length: 9 })
  category: string;

  @Column({ type: "longtext" })
  receipt: string;

  @Column({ type: "double", precision: 15, scale: 2, default: 0.0 })
  amount: number;

  @Column({ type: "longtext", nullable: true })
  notes: string | null;

  @Column({ type: "int", unsigned: true })
  user_id: number;

  @OneToMany(
    () => OrderProblems,
    (orderProblems) => orderProblems.orderProblemsPaymentsData
  )
  orderProblemsData: OrderProblems[];
}
