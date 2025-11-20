// entities/TaxInvoices.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("tax_invoices")
export class TaxInvoices extends BaseEntity {
  @Column({ type: "date", nullable: true })
  request_date: string | null;

  @Column({ type: "date", nullable: true })
  completed_date: string | null;

  @Column({ length: 191, nullable: true })
  order_number: string | null;

  @Column({ length: 191, nullable: true })
  npwp_number: string | null;

  @Column({ length: 191, nullable: true })
  npwp_name: string | null;

  @Column({ type: "text", nullable: true })
  npwp_address: string | null;

  @Column({ length: 191, nullable: true })
  tax_invoice_number: string | null;

  @Column({ type: "tinyint", default: 0, nullable: true })
  physical_document_delivery: number | null;

  @Column({ type: "text", nullable: true })
  physical_document_address: string | null;

  @Column({ type: "tinyint", default: 0, nullable: true })
  document_delivery_status: number | null;

  @Column({ length: 191, nullable: true })
  shipping_receipt_number: string | null;

  @Column({ length: 191, nullable: true })
  tax_invoice_file: string | null;

  @Column({ type: "datetime", nullable: true })
  upload_date: Date | null;

  @Column({ type: "text", nullable: true })
  receipt: string | null;

  @Column({ type: "text", nullable: true })
  npwp_file: string | null;
}
