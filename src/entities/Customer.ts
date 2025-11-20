import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { CustomerAr } from "./CustomerAr";
import { Order } from "./Order";
import { PurchaseOrder } from "./PurchaseOrder";
import { CustomerBanks } from "./CustomerBanks";

@Entity({ name: "customer" })
export class Customer extends BaseEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column({ length: 7 })
  gender: string;

  @Column()
  cust_status: string;

  @Column({ type: "text" })
  status_log: string;

  @Column()
  mou_status: string;

  @Column({ type: "text" })
  notes: string;

  @Column()
  npwp: string;

  @Column()
  nik: string;

  @Column({ type: "text" })
  ktp_img: string;

  @Column({ type: "text" })
  npwp_img: string;

  @Column({ type: "mediumtext" })
  address: string;

  @Column({ type: "int" })
  type: number;

  @Column({ length: 15 })
  refcode: string;

  @Column({ type: "int", unsigned: true })
  company_type: number;

  @Column()
  company_name: string;

  @Column({ type: "text" })
  company_address: string;

  @Column()
  company_email: string;

  @Column()
  company_phone: string;

  @Column({ type: "double", precision: 20, scale: 2 })
  points: number;

  @Column({ length: 100 })
  device_type: string;

  @Column({ length: 100 })
  device_os: string;

  @Column()
  customer_settings: string;

  @Column({ type: "double", precision: 20, scale: 2 })
  credits: number;

  @Column({ type: "text" })
  label: string;

  @Column({ type: "int", unsigned: true })
  owner: number;

  @DeleteDateColumn({ name: "deleted_at" })
  deleted_at: Date;

  @Column({ type: "text" })
  google_id: string;

  @Column({ type: "text" })
  avatar: string;

  @Column({ type: "text" })
  avatar_original: string;

  @Column({ type: "int" })
  is_member: number;

  @Column({ type: "datetime" })
  member_since: Date;

  @Column({ length: 100 })
  no_finance: string;

  @Column({ length: 100 })
  no_finance_2: string;

  @Column({ type: "text" })
  invoice_address: string;

  @Column({ type: "int" })
  is_ba: number;

  @Column({ length: 191 })
  my_referral_code: string;

  @Column({ length: 191 })
  upline_referral_code: string;

  @Column({ type: "int", unsigned: true, name: "_lft" })
  _lft: number;

  @Column({ type: "int", unsigned: true, name: "_rgt" })
  _rgt: number;

  @Column({ type: "int", unsigned: true })
  parent_id: number;

  @Column({ type: "int" })
  wp_id: number;

  @Column({ type: "text" })
  application_letter: string;

  @Column({ type: "int" })
  login: number;

  @Column()
  fbasekey: string;

  @Column()
  google_sso: string;

  @Column({ length: 12 })
  reset_password: string;

  @Column({ type: "int" })
  verified: number;

  @Column({ type: "int" })
  invoice_tax_status: number;

  @Column({ type: "int" })
  is_staging: number;

  @Column({ type: "datetime" })
  ep_join_date: Date;

  @Column({ type: "text" })
  avatar_image: string;

  @Column({ length: 12 })
  verified_token: string;

  @Column({ length: 20 })
  bank: string;

  @Column({ type: "int" })
  account_number: number;

  @Column({ length: 50 })
  account_name: string;

  @Column({ type: "int" })
  notif_status_pemesanan_produk: number;

  @Column({ type: "int" })
  notif_status_pembayaran: number;

  @Column({ type: "int" })
  notif_penggunaan_point: number;

  @Column({ type: "int" })
  notif_downline_baru: number;

  @Column({ type: "int" })
  notif_point_downline: number;

  @Column({ type: "int" })
  sso: number;

  @Column({ type: "datetime" })
  verify_email_expired_date: Date;

  @Column({ type: "int" })
  layer: number;

  @Column({ type: "int" })
  program: number;

  @Column({ type: "int" })
  mgm: number;

  @Column({ length: 15 })
  finance_phone_mou: string;

  @Column()
  mou_docs: string;

  @Column({ type: "int" })
  mou_type: number;

  @Column({ type: "int" })
  mgm_downline_id: number;

  @Column({ length: 15 })
  finance_phone_mgm: string;

  @Column({ type: "int" })
  approval_mou_operation: number;

  @Column({ type: "int" })
  approval_mou_finance: number;

  @Column({ type: "int" })
  approval_mgm_operation: number;

  @Column({ type: "int" })
  approval_mgm_finance: number;

  @Column({ type: "text" })
  log_program: string;

  @Column({ type: "text" })
  log_mou: string;

  @Column({ type: "datetime" })
  mou_end_date: Date;

  @Column({ type: "int" })
  mgm_upline_id: number;

  @Column({ length: 100 })
  uuid: string;

  @Column({ type: "int" })
  level: number;

  @Column({ type: "double", precision: 20, scale: 2 })
  redeemed_points: number;

  @OneToOne(() => CustomerAr, (customerAr) => customerAr.customerData)
  customerArData: CustomerAr;

  @OneToMany(() => Order, (order) => order.customerData)
  orderData: Order;

  @OneToMany(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.customerData)
  purchaseOrderData: PurchaseOrder[];

  @OneToOne(
    () => CustomerBanks,
    (customerBanks) => customerBanks.customerData,
    {
      cascade: true,
      nullable: true,
    }
  )
  @JoinColumn({ name: "id", referencedColumnName: "customer_id" })
  customerBanksData: CustomerBanks;
}
