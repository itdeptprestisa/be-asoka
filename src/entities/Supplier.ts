import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { PurchaseOrder } from "./PurchaseOrder";
import { ProductSupplierEvent } from "./ProductSupplierEvent";
import { InventorySpk } from "./InventorySpk";
import { ProductStockEvent } from "./ProductStockEvent";

@Entity({ name: "supplier" })
export class Supplier {
  @PrimaryGeneratedColumn({ type: "int", unsigned: true })
  id: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updated_at: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deleted_at?: Date;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  password: string;

  @Column({ type: "varchar", length: 255 })
  fbasekey: string;

  @Column({ type: "int" })
  login: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  phone: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  website: string;

  @Column({ type: "longtext", nullable: true })
  operational_hour: string;

  @Column({ type: "longtext", nullable: true })
  speciality: string;

  @Column({ type: "longtext", nullable: true })
  address: string;

  @Column({ type: "int", unsigned: true, nullable: true })
  country: number;

  @Column({ type: "int", unsigned: true, nullable: true })
  province: number;

  @Column({ type: "int", unsigned: true, nullable: true })
  city: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  contact_person: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  account_number: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  account_holder: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  bank: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  payment_terms: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  supplier_code: string;

  @Column({ type: "double" })
  longitude: number;

  @Column({ type: "double" })
  latitude: number;

  @Column({ type: "double", default: 0 })
  this_week_orders: number;

  @Column({ type: "tinyint" })
  verified: number;

  @Column({
    type: "varchar",
    length: 120,
    default: "https://lavender.prestisa.id/assets/images/bg-banner.jpg",
  })
  banner_app: string;

  @Column({ type: "longtext", nullable: true })
  dynamic_banner: string;

  @Column({ type: "varchar", length: 15 })
  csapp_no: string;

  @Column({ type: "mediumtext" })
  tutorial_url: string;

  @Column({
    type: "varchar",
    length: 800,
    default: "jangan lupa tarik tagihan yaa",
  })
  msgbox: string;

  @Column({ type: "tinyint" })
  force_tagihan: number;

  @Column({ type: "varchar", length: 15 })
  app_register: string;

  @Column({ type: "varchar", length: 255 })
  app_register_ktp: string;

  @Column({ type: "varchar", length: 255 })
  app_register_selfie: string;

  @Column({ type: "varchar", length: 150 })
  owner: string;

  @Column({ type: "varchar", length: 150 })
  owner_name: string;

  @Column({ type: "varchar", length: 255 })
  nik: string;

  @Column({ type: "varchar", length: 255 })
  experience: string;

  @Column({ type: "longtext", nullable: true })
  app_register_log: string;

  @Column({ type: "mediumint", default: 0 })
  total_price_this_week: number;

  @Column({ type: "int", default: 0 })
  status_price_this_week: number;

  @Column({ type: "tinyint" })
  accept_tos: number;

  @Column({ type: "int", default: 4 })
  settings_id: number;

  @Column({ type: "varchar", length: 50 })
  device_os: string;

  @Column({ type: "varchar", length: 150 })
  device_type: string;

  @Column({ type: "double", default: 0 })
  avg_point: number;

  @Column({ type: "int", nullable: true })
  wp_id: number;

  @Column({ type: "longtext", nullable: true })
  unlock_logs: string;

  @Column({ type: "int", default: 0 })
  total_item_this_week: number;

  @Column({ type: "int", default: 0 })
  total_item_this_week_parcel: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  pin_code: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  saldo: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  saldo_ps: number;

  @Column({ type: "int", nullable: true })
  point: number;

  @Column({ type: "int", default: 0 })
  status_parcel_this_week: number;

  @Column({ type: "int", default: 0 })
  status_this_week: number;

  @Column({ type: "int", nullable: true })
  active: number;

  @Column({ type: "int", nullable: true })
  avg_rating_to: number;

  @Column({ type: "int", nullable: true })
  app_version: number;

  @Column({ type: "text", nullable: true })
  app_register_notes: string;

  @Column({ type: "tinyint", nullable: true })
  password_error_counter: number;

  @Column({ type: "tinyint", nullable: true })
  pin_error_counter: number;

  @Column({ type: "varchar", length: 12, nullable: true })
  reset_password: string;

  @Column({ type: "varchar", length: 12, nullable: true })
  reset_pin: string;

  @Column({ type: "json", nullable: true })
  transaction_logs: any;

  @Column({ type: "longtext", nullable: true })
  banks: string;

  @Column({ type: "longtext", nullable: true })
  detail_address: string;

  @Column({ type: "double", precision: 3, scale: 1, default: 0.0 })
  avg_delivery_time: number;

  @Column({ type: "double", precision: 3, scale: 1, default: 0.0 })
  avg_response_time: number;

  @Column({
    type: "varchar",
    length: 250,
    default:
      "https://dcassetcdn.com/design_img/2087714/573914/573914_11025883_2087714_f86ce87b_image.png",
  })
  image_profile: string;

  @Column({ type: "int", default: 0 })
  staging: number;

  @Column({ type: "int", default: 0 })
  order_bid_done: number;

  @Column({ type: "int", default: 0 })
  order_app_done: number;

  @Column({ type: "int", default: 0 })
  order_auto_po_done: number;

  @Column({ type: "int", default: 0 })
  sort_auto_po_daily: number;

  @Column({ type: "longtext", nullable: true })
  req_account_del: string;

  @Column({ type: "datetime", nullable: true })
  freeze_until: Date;

  @Column({ type: "double", precision: 4, scale: 2, nullable: true })
  avg_rating: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  type: string;

  @Column({ type: "varchar", length: 15, nullable: true })
  bank_verified: string;

  @Column({ type: "tinyint", nullable: true })
  has_order_subdomain: number;

  @OneToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.supplierData)
  purchaseOrderData: PurchaseOrder;

  @OneToMany(() => ProductSupplierEvent, (event) => event.supplier)
  productEvents: ProductSupplierEvent[];

  @OneToMany(() => InventorySpk, (inventory_spk) => inventory_spk.suppliers)
  inventorySpk: InventorySpk[];

  @OneToMany(() => ProductStockEvent, (e) => e.suppliers)
  productStockEvent: ProductStockEvent[];
}
