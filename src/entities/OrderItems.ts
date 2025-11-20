// entities/OrderItems.ts
import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Products } from "./Products";
import { Order } from "./Order";
import { PurchaseOrder } from "./PurchaseOrder";
import { Geo } from "./Geo";

@Entity("order_items")
export class OrderItems extends BaseEntity {
  @Column({ type: "int", unsigned: true })
  assignment: number;

  @Column({ type: "int", unsigned: true })
  order_id: number;

  @Column({ type: "int" })
  product_id: number;

  @Column({ length: 191 })
  name: string;

  @Column({ type: "double", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "double", precision: 10, scale: 2, default: 0.0 })
  capital_price: number;

  @Column({ type: "double" })
  qty: number;

  @Column({ type: "double", default: 0 })
  bought: number;

  @Column({ type: "longtext" })
  image: string;

  @Column({ length: 191 })
  product_code: string;

  @Column({ type: "double", precision: 12, scale: 2, default: 0.0 })
  subtotal: number;

  @Column({ type: "double", precision: 10, scale: 2, default: 0.0 })
  shipping_cost: number;

  @Column({ length: 191, nullable: true })
  shipping_expedition: string;

  @Column({ length: 255, nullable: true })
  shipping_expedition_note: string;

  @Column({ type: "longtext", nullable: true })
  shipping_address: string;

  @Column({ length: 191, nullable: true })
  sender_name: string;

  @Column({ type: "longtext", nullable: true })
  greetings: string;

  @Column({ length: 191, nullable: true })
  receiver_name: string;

  @Column({ length: 191, nullable: true })
  receiver_phone: string;

  @Column({ type: "longtext", nullable: true })
  notes: string;

  @Column({ type: "mediumtext" })
  notes_internal: string;

  @Column({ length: 20 })
  occasion: string;

  @Column({ type: "int", unsigned: true })
  city: number;

  @Column({ type: "int", unsigned: true })
  country: number;

  @Column({ type: "int", unsigned: true })
  province: number;

  @Column({ type: "datetime" })
  date_time: Date;

  @Column({ type: "text" })
  checked: string;

  @Column({ type: "int", default: 0 })
  problem: number;

  @Column({ type: "int", nullable: true })
  fu_er: number;

  @Column({ length: 50, nullable: true })
  order_status: string;

  @Column({ type: "int", default: 0 })
  is_staging: number;

  @Column({ type: "longtext", nullable: true })
  track_order_logs: string;

  @Column({ type: "int", default: 0 })
  shipping_express: number;

  @Column({ type: "int", nullable: true })
  refund_status: number;

  @Column({ type: "double", precision: 10, scale: 2, nullable: true })
  price_after_refund: number;

  @Column({ type: "longtext", nullable: true })
  special_request_image: string;

  @Column({ type: "longtext", nullable: true })
  special_request_logo: string;

  @Column({ length: 100, default: "0" })
  receiver_longitude: string;

  @Column({ length: 100, nullable: true })
  receiver_latitude: string;

  @Column({ type: "int", default: 0 })
  auto_po: number;

  @Column({ length: 255, nullable: true })
  district: string;

  @Column({ type: "int", nullable: true })
  id_district: number;

  @Column({ length: 255, nullable: true })
  sub_district: string;

  @Column({ type: "int", nullable: true })
  id_sub_district: number;

  @Column({ length: 255, nullable: true })
  product_type: string;

  @Column({ type: "int", nullable: true })
  po_type: number;

  @Column({ type: "int", nullable: true })
  shipping_method: number;

  @Column({ type: "int", nullable: true })
  address_type: number;

  @Column({ type: "decimal", precision: 9, scale: 6, nullable: true })
  pickup_lat: number;

  @Column({ type: "decimal", precision: 9, scale: 6, nullable: true })
  pickup_long: number;

  @Column({ type: "double", precision: 10, scale: 2, nullable: true })
  shipping_cost_by_estimation: number;

  @Column({ type: "double", precision: 10, scale: 2, nullable: true })
  marked_up_shipping_cost: number;

  @Column({ type: "double", precision: 10, scale: 2, nullable: true })
  assembly_cost: number;

  @Column({ type: "double", precision: 10, scale: 2, nullable: true })
  express_fee: number;

  @Column({ type: "text", nullable: true })
  greetings_card: string;

  @Column({ type: "tinyint", nullable: true })
  on_time_delivery: number | null;

  @Column({ type: "datetime", nullable: true })
  deleted_at: Date | null;

  @OneToOne(() => Products, (products) => products.orderItemsData)
  @JoinColumn({ name: "product_id" })
  productsData: Products;

  @ManyToOne(() => Order, (order) => order.orderItemsData)
  @JoinColumn({ name: "order_id" })
  orderData: Order;

  @OneToOne(
    () => PurchaseOrder,
    (purchaseOrder) => purchaseOrder.orderItemsData
  )
  purchaseOrderData: PurchaseOrder[];

  @ManyToOne(() => Geo, { nullable: true })
  @JoinColumn({ name: "city" })
  geoCityData: Geo;

  @ManyToOne(() => Geo, { nullable: true })
  @JoinColumn({ name: "province" })
  geoProvinceData: Geo;

  @ManyToOne(() => Geo, { nullable: true })
  @JoinColumn({ name: "country" })
  geoCountryData: Geo;
}
