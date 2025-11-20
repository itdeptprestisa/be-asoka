import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "document_invoice" })
export class DocumentInvoice extends BaseEntity {
  @Column({ type: "datetime", nullable: true })
  request_date: Date;

  @Column({ type: "datetime", nullable: true })
  complete_date: Date;

  @Column({ type: "varchar", length: 191, nullable: true })
  order_number: string;

  @Column({ type: "tinyint", nullable: true, default: () => "0" })
  is_send_invoice: number;

  @Column({ type: "text", nullable: true })
  send_invoice_address: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  send_document_status: string;

  @Column({ type: "varchar", length: 191, nullable: true })
  receipt_number: string;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deleted_at?: Date;
}
