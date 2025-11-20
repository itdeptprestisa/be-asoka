// entities/OrderSelection.ts
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { OrderItems } from "./OrderItems";

@Entity("order_selection")
export class OrderSelection extends BaseEntity {
  @Column({ type: "int", nullable: true })
  pr_id: number | null;

  @Column({ type: "int", nullable: true })
  supplier_id: number | null;

  @Column({ length: 100, nullable: true })
  status: string | null;

  @Column({ type: "datetime", nullable: true })
  confirm_time: Date | null;

  @Column({ type: "int", nullable: true })
  estimated_time: number | null;

  @Column({ type: "date", nullable: true })
  date_estimated: string | null;

  @Column({ type: "time", nullable: true })
  time_estimated: string | null;

  @ManyToOne(() => OrderItems, { nullable: true })
  @JoinColumn({ name: "pr_id" })
  orderItemsData: OrderItems;
}
