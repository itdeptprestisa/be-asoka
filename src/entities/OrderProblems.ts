// entities/OrderProblems.ts
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";
import { OrderProblemsPayments } from "./OrderProblemsPayments";

@Entity("order_problems")
export class OrderProblems extends BaseEntity {
  @Column({ type: "varchar", nullable: true })
  order_id: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  order_number: string | null;

  @Column({ type: "longtext" })
  notes: string;

  @Column({ type: "int", nullable: true })
  amount_customer_debit: number | null;

  @Column({ type: "int", nullable: true })
  amount_customer_kredit: number | null;

  @Column({ length: 255, nullable: true })
  account_number: string | null;

  @Column({ type: "int" })
  payment_method: number;

  @Column({ length: 255, nullable: true })
  payment_status: string | null;

  @Column({ length: 255, nullable: true })
  account_holder: string | null;

  @Column({ type: "longtext" })
  status_log: string;

  @Column({ type: "int", unsigned: true, nullable: true })
  owner: number | null;

  @Column({ type: "int", nullable: true })
  approved: number | null;

  @Column({ type: "longtext", nullable: true })
  approved_notes: string | null;

  @Column({ type: "longtext", nullable: true })
  item_references: string | null;

  @Column({ type: "datetime", nullable: true })
  approved_at: Date | null;

  @Column({ type: "text", nullable: true })
  complaint_category: string | null;

  @Column({ type: "varchar", nullable: true })
  payment_method_problem: String | null;

  @Column({ type: "varchar", nullable: true })
  va_bank: String | null;

  @Column({ type: "varchar", nullable: true })
  bank_name: String | null;

  @Column({ type: "varchar", nullable: true })
  va_account_number: String | null;

  @Column({ type: "varchar", nullable: true })
  va_external_id: String | null;

  @Column({ type: "varchar", nullable: true })
  va_id: String | null;

  @ManyToOne(() => Order, (order) => order.orderProblemsData, {
    nullable: false,
  })
  @JoinColumn({ name: "order_id" })
  orderData: Order;

  @ManyToOne(
    () => OrderProblemsPayments,
    (orderProblemsPayments) => orderProblemsPayments.orderProblemsData,
    {
      nullable: true,
    }
  )
  @JoinColumn({ name: "order_id" })
  orderProblemsPaymentsData: OrderProblemsPayments;
}
