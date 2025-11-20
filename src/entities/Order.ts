import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { OrderCustomer } from "./OrderCustomer";
import { PurchaseOrder } from "./PurchaseOrder";
import { PurchaseOrderRating } from "./PurchaseOrderRating";
import { Customer } from "./Customer";
import { OrderPayments } from "./OrderPayments";
import { Website } from "./Website";
import { OrderItems } from "./OrderItems";
import { PrProblems } from "./PrProblems";
import { join } from "node:path/win32";
import { Users } from "./Users";
import { OrderProblems } from "./OrderProblems";

@Entity({ name: "order" })
export class Order extends BaseEntity {
  @Column({ length: 100, nullable: true })
  sales_from!: string;

  @Column({ nullable: true })
  order_number!: string;

  @Column({ nullable: true })
  real_invoice!: string;

  @Column({ length: 10, nullable: true })
  vip!: string;

  @Column({ nullable: true })
  payment_type!: string;

  @Column({ length: 950, nullable: true })
  refcode!: string;

  @Column({ unsigned: true, nullable: true })
  customer_id!: number;

  @Column({ unsigned: true, nullable: true })
  owner!: number;

  @Column({ unsigned: true, nullable: true })
  website!: number;

  @Column({ nullable: true })
  unique_code!: number;

  @Column({ length: 191, nullable: true })
  status!: string;

  @Column({ length: 10, nullable: true })
  tax_type!: string;

  @Column({ type: "double", precision: 15, scale: 2, nullable: true })
  tax_result!: number;

  @Column({ nullable: true })
  verify!: number;

  @Column({ type: "double", precision: 15, scale: 2, nullable: true })
  total!: number;

  @Column({ type: "double", precision: 15, scale: 2, nullable: true })
  cashback!: number;

  @Column({ unsigned: true, nullable: true })
  inquiry_id!: number;

  @Column({ nullable: true })
  payment_status!: string;

  @Column({ nullable: true })
  payment_duedate!: Date;

  @Column("text", { default: "" })
  payment_notes!: string;

  @Column("text", { nullable: true })
  invoice_address!: string;

  @Column("text", { default: "" })
  invoice_receipt!: string;

  @Column("text", { default: "" })
  moota_stat!: string;

  @Column({ length: 18, nullable: true })
  payment_revision!: string;

  @Column("text", { nullable: true })
  approve_logs!: string;

  @Column({ length: 3, nullable: true })
  tax_invoice!: string;

  @Column({ length: 3, nullable: true })
  receipt!: string;

  @Column({ nullable: true })
  tele_created!: number;

  @Column({ nullable: true })
  service_fee!: number;

  @Column("simple-json", { nullable: true })
  meta!: any;

  @Column({ nullable: true })
  referto!: string;

  @Column({ nullable: true })
  auto_cancel!: number;

  @Column({ nullable: true })
  last_fu_ar_date!: Date;

  @Column({ nullable: true })
  app!: number;

  @Column({ length: 100, nullable: true })
  tx_id!: string;

  @Column({ type: "double", precision: 15, scale: 0, nullable: true })
  voucher_amount!: number;

  @Column({ nullable: true })
  voucher_id!: number;

  @Column({ nullable: true })
  is_staging!: number;

  @Column({ nullable: true })
  voucher!: number;

  @Column({ nullable: true })
  all_po_finish!: number;

  @Column({ nullable: true })
  app_factur_status!: number;

  @Column({ nullable: true })
  mitra_id!: number;

  @Column({ nullable: true })
  payment_method!: string;

  @Column({ nullable: true })
  va_bank!: string;

  @Column({ nullable: true })
  va_account_number!: string;

  @Column({ nullable: true })
  va_external_id!: string;

  @Column({ nullable: true })
  va_id!: string;

  @Column({ nullable: true })
  total_gross!: number;

  @Column({ nullable: true })
  approved_at!: Date;

  @Column({ nullable: true })
  auto_cancel_time!: Date;

  @Column({
    unsigned: true,
    default: 0,
    comment:
      "0: Belum dicek, 1: Ada point, sudah masuk, 2: Sudah dicek, tidak ada point",
  })
  has_point!: number;

  @Column({ nullable: true })
  canceled_at!: Date;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "timestamp",
    nullable: true,
  })
  deleted_at: Date | null;

  @OneToOne(() => OrderCustomer, (orderCustomer) => orderCustomer.orderData)
  orderCustomerData: OrderCustomer;

  @OneToMany(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.orderData)
  purchaseOrderData: PurchaseOrder[];

  @ManyToOne(() => Customer, (customer) => customer.orderData)
  @JoinColumn({ name: "customer_id" })
  customerData: Customer;

  @OneToMany(() => OrderPayments, (orderPayments) => orderPayments.orderData)
  orderPaymentsData: OrderPayments[];

  @ManyToOne(() => Website, (website) => website.orderData)
  @JoinColumn({ name: "website" })
  websiteData: Website;

  @OneToMany(() => OrderItems, (orderItems) => orderItems.orderData)
  orderItemsData: OrderItems[];

  @OneToMany(() => PrProblems, (prProblems) => prProblems.orderData)
  prProblemsData: PrProblems[];

  @ManyToOne(() => Users, (users) => users.orderData, {
    nullable: true,
  })
  @JoinColumn({ name: "owner" })
  ownerData: Users;

  @OneToMany(() => OrderProblems, (orderProblems) => orderProblems.orderData)
  orderProblemsData: OrderProblems[];
}
