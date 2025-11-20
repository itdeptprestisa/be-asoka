// entities/OrderCustomer.ts
import { Entity, Column, OneToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";

@Entity("order_customer")
export class OrderCustomer extends BaseEntity {
  @Column({ type: "int", unsigned: true })
  order_id: number;

  @Column({ type: "int" })
  type: number;

  @Column({ length: 191 })
  email: string;

  @Column({ length: 191 })
  phone: string;

  @Column({ length: 191 })
  name: string;

  @Column({ type: "int", nullable: true })
  company_type: number | null;

  @Column({ length: 191, nullable: true })
  company_name: string | null;

  @Column({ type: "longtext", nullable: true })
  company_address: string | null;

  @Column({ length: 191, nullable: true })
  company_email: string | null;

  @Column({ length: 191, nullable: true })
  company_phone: string | null;

  @Column({ length: 100, nullable: true })
  no_finance: string | null;

  @Column({ length: 100, nullable: true })
  no_finance_2: string | null;

  @Column({ type: "longtext", nullable: true })
  logs: string | null;

  @Column({ length: 200, nullable: true, comment: "nomor npwp" })
  npwp_number: string | null;

  @Column({ length: 200, nullable: true, comment: "nama npwp" })
  npwp_name: string | null;

  @Column({ length: 255, nullable: true, comment: "alamat di npwp" })
  npwp_address: string | null;

  @Column({ length: 255, nullable: true, comment: "npwp document" })
  npwp_file: string | null;

  @Column({
    type: "int",
    width: 11,
    default: 0,
    comment: "customer request hardcopy faktur, 1=yes, 0=no",
  })
  npwp_notify_customer: number;

  @OneToOne(() => Order, (order) => order.orderCustomerData)
  @JoinColumn({ name: "order_id" })
  orderData: Order;
}
