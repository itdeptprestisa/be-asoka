// entities/CustomerAr.ts
import { Entity, Column, OneToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Customer } from "./Customer";

@Entity("customer_ar")
export class CustomerAr extends BaseEntity {
  @Column({ type: "int", unsigned: true, nullable: true })
  customer_id: number | null;

  @Column({ type: "tinyint", nullable: true })
  tax_invoice: number | null;

  @Column({ type: "tinyint", nullable: true })
  send_physical_invoice: number | null;

  @Column({ length: 4096, nullable: true })
  send_physical_invoice_address: string | null;

  @Column({ length: 5, nullable: true })
  payment_order_type: string | null;

  @Column({ type: "int", nullable: true })
  term_of_payment: number | null;

  @Column({ type: "double", nullable: true })
  credit_limit: number | null;

  @Column({ length: 255, nullable: true })
  corporate_name: string | null;

  @Column({ length: 255, nullable: true })
  contact_person_finance: string | null;

  @Column({ length: 255, nullable: true })
  contact_number_finance: string | null;

  @Column({ length: 255, nullable: true })
  contact_person_purchasing: string | null;

  @Column({ length: 255, nullable: true })
  contact_number_purchasing: string | null;

  @Column({ length: 255, nullable: true })
  npwp_data_1: string | null;

  @Column({ length: 255, nullable: true })
  npwp_number_1: string | null;

  @Column({ length: 255, nullable: true })
  npwp_name_1: string | null;

  @Column({ length: 255, nullable: true })
  npwp_address_1: string | null;

  @Column({ length: 255, nullable: true })
  npwp_data_2: string | null;

  @Column({ length: 255, nullable: true })
  npwp_number_2: string | null;

  @Column({ length: 255, nullable: true })
  npwp_name_2: string | null;

  @Column({ length: 255, nullable: true })
  npwp_address_2: string | null;

  @OneToOne(() => Customer, (customer) => customer.customerArData)
  @JoinColumn({ name: "customer_id" })
  customerData: Customer;
}
