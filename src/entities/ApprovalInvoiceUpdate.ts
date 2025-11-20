// entities/ApprovalInvoiceUpdate.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("approval_invoice_update")
export class ApprovalInvoiceUpdate extends BaseEntity {
  @Column({ type: "int", nullable: true })
  user_id: number | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "int", default: 0 })
  type: number;

  @Column({ type: "int", nullable: true })
  customer_id: number | null;

  @Column({ type: "int", nullable: true })
  order_id: number | null;

  @Column({ type: "int", default: 0 })
  approval_retention: number;

  @Column({ type: "int", default: 0 })
  approval_finance: number;

  @Column({ length: 255, nullable: true })
  name: string | null;

  @Column({ length: 255, nullable: true })
  email: string | null;

  @Column({ length: 255, nullable: true })
  phone: string | null;
}
