// entities/PurchaseOrder.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";
import { PurchaseOrderRating } from "./PurchaseOrderRating";
import { Supplier } from "./Supplier";
import { OrderItems } from "./OrderItems";
import { Customer } from "./Customer";
import { Products } from "./Products";
import { InventorySpk } from "./InventorySpk";
import { ProductStockEvent } from "./ProductStockEvent";
import { GojekBooking } from "./GojekBooking";
import { BluebirdBooking } from "./BluebirdBooking";

@Entity("purchase_order")
export class PurchaseOrder extends BaseEntity {
  @Column({ type: "int", unsigned: true })
  supplier_id: number;

  @Column({ type: "int", unsigned: true })
  order_id: number;

  @Column({ type: "int" })
  customer_id: number;

  @Column({ type: "int", unsigned: true })
  pr_id: number;

  @Column({ type: "int", default: 0 })
  app: number;

  @Column({ type: "datetime", nullable: true })
  app_assign: Date;

  @Column({ type: "datetime", nullable: true })
  app_payreq: Date;

  @Column({ type: "int", unsigned: true })
  country: number;

  @Column({ type: "int", unsigned: true })
  province: number;

  @Column({ type: "int", unsigned: true })
  city: number;

  @Column({ type: "int", unsigned: true })
  owner: number;

  @Column()
  product_name: string;

  @Column()
  product_code: string;

  @Column({ type: "longtext" })
  image: string;

  @Column({ type: "int" })
  qty: number;

  @Column({ type: "double", precision: 10, scale: 2 })
  capital_price: number;

  @Column({ type: "double", precision: 12, scale: 2 })
  real_price: number;

  @Column({ type: "double", precision: 12, scale: 2 })
  total: number;

  @Column({ type: "double", precision: 10, scale: 2 })
  amount_after_problem: number;

  @Column()
  sender_name: string;

  @Column()
  sender_phone: string;

  @Column()
  receiver_name: string;

  @Column()
  receiver_phone: string;

  @Column({ type: "longtext" })
  greetings: string;

  @Column({ type: "longtext" })
  shipping_address: string;

  @Column({ type: "datetime" })
  date_time: Date;

  @Column({ type: "longtext" })
  notes: string;

  @Column({ type: "longtext" })
  real_image: string;

  @Column()
  status: string;

  @Column()
  payment_status: string;

  @Column({ length: 25 })
  payment_type: string;

  @Column()
  warehouse_expedition: string;

  @Column()
  shipper_order_id: string;

  @Column()
  courier_phone: string;

  @Column({ type: "datetime", nullable: true })
  shipped_date: Date;

  @Column({ type: "datetime", nullable: true })
  tax_invoice_date: Date;

  @Column()
  tracking_number: string;

  @Column()
  shipping_expedition: string;

  @Column({ type: "longtext" })
  delivery_receipt: string;

  @Column({ type: "longtext" })
  delivery_location: string;

  @Column({ type: "longtext" })
  status_log: string;

  @Column({ type: "double", precision: 10, scale: 2 })
  shipping_cost: number;

  @Column({ type: "longtext" })
  reason: string;

  @Column({ type: "datetime", nullable: true })
  due_date: Date;

  @Column({ type: "datetime", nullable: true })
  payment_date: Date;

  @Column({ type: "longtext" })
  payment_notes: string;

  @Column({ type: "int" })
  real_image_late: number;

  @Column({ type: "int" })
  shipping_receipt_image_late: number;

  @Column({ type: "int", unsigned: true })
  product_id: number;

  @Column({ type: "int", default: 0 })
  sales_rating: number;

  @Column({ type: "int", default: 0 })
  report_rating: number;

  @Column({ type: "int", default: 0 })
  shipping_rating: number;

  @Column({ type: "int", default: 0 })
  flower_rating: number;

  @Column({ type: "longtext" })
  complaint_notes: string;

  @Column({ type: "longtext" })
  complaint_resolution: string;

  @Column({ length: 191 })
  resolution_status: string;

  @Column({ length: 191 })
  resolution_check: string;

  @Column({ length: 191 })
  resolution_complaint: string;

  @Column({ type: "int", unsigned: true, default: 0 })
  resolution_admin: number;

  @Column({ type: "longtext" })
  over_pricing_notes: string;

  @Column({ type: "longtext" })
  general_notes: string;

  @Column({ type: "mediumtext" })
  notes_internal: string;

  @Column({ type: "longtext" })
  controller_notes: string;

  @Column({ type: "int" })
  revision: number;

  @Column({ length: 25 })
  photo_approval: string;

  @Column({ type: "longtext" })
  photo_approval_notes: string;

  @Column({ type: "longtext" })
  real_image_revision: string;

  @Column({ type: "longtext" })
  delivery_location_revision: string;

  @Column({ type: "longtext" })
  delivery_receipt_revision: string;

  @Column({ type: "longtext" })
  photo_revision_notes: string;

  @Column({ type: "int" })
  approve_image_result: number;

  @Column({ type: "int" })
  approve_image_location: number;

  @Column({ type: "int" })
  approve_delivery_order: number;

  @Column({ length: 4 })
  hp_type: string;

  @Column({ type: "int" })
  revision_image: number;

  @Column({ type: "longtext" })
  revision_image_log: string;

  @Column({ type: "int" })
  approved_payment: number;

  @Column({ type: "longtext" })
  approved_payment_notes: string;

  @Column({ type: "longtext" })
  resolution_logs: string;

  @Column({ type: "longtext" })
  photo_approval_logs: string;

  @Column({ type: "longtext" })
  photo_revision_logs: string;

  @Column({ type: "int" })
  real_image_approval: number;

  @Column({ type: "int" })
  photo_rev_counter: number;

  @Column({ type: "longtext" })
  app_revision_logs: string;

  @Column({ type: "datetime", nullable: true })
  finish_time: Date;

  @Column({ type: "longtext" })
  recomendation_logs: string;

  @Column({ type: "longtext" })
  action_recomendation_logs: string;

  @Column({ length: 5 })
  count_search_logs: string;

  @Column({ type: "longtext" })
  action_search_logs: string;

  @Column({ type: "longtext" })
  pushnotif_counter: string;

  @Column({ type: "int", default: 0 })
  auto_po: number;

  @Column({ type: "int" })
  wa_rating_point: number;

  @Column()
  wa_rating_note: string;

  @Column({ type: "int", default: 0 })
  po_blast_status: number;

  @Column({ type: "datetime", nullable: true })
  po_blast_time: Date;

  @Column({ type: "int" })
  delivery_location_unconfirmed: number;

  @Column({ type: "int" })
  delivery_location_unconfirmed_index: number;

  @Column()
  capital_price_reason: string;

  @Column({ type: "int" })
  po_type: number;

  @Column({ type: "int" })
  shipping_method: number;

  @Column({ type: "int" })
  address_type: number;

  @Column({ type: "decimal", precision: 9, scale: 6 })
  pickup_lat: number;

  @Column({ type: "decimal", precision: 9, scale: 6 })
  pickup_long: number;

  @Column({ type: "datetime", nullable: true })
  pickup_date: Date;

  @ManyToOne(() => Order, (order) => order.purchaseOrderData)
  @JoinColumn({ name: "order_id" })
  orderData: Order;

  @OneToOne(() => Supplier, (supplier) => supplier.purchaseOrderData)
  @JoinColumn({ name: "supplier_id" })
  supplierData: Supplier;

  @OneToOne(() => OrderItems, (orderItems) => orderItems.purchaseOrderData, {
    nullable: true,
  })
  @JoinColumn({ name: "pr_id" })
  orderItemsData: OrderItems;

  @OneToOne(() => PurchaseOrderRating, (rating) => rating.purchaseOrderData, {
    cascade: true,
    nullable: true,
  })
  purchaseOrderRatingData: PurchaseOrderRating;

  @ManyToOne(() => Customer, (customer) => customer.purchaseOrderData, {
    nullable: true,
  })
  @JoinColumn({ name: "customer_id" })
  customerData: Customer;

  @ManyToOne(() => Products, (product) => product.purchaseOrders)
  @JoinColumn({ name: "product_id" })
  product: Products;

  @OneToMany(() => InventorySpk, (inventory_spk) => inventory_spk.poData)
  inventorySpk: InventorySpk[];

  @OneToOne(() => ProductStockEvent, (e) => e.poData)
  stockEvent: ProductStockEvent[];

  @OneToMany(() => GojekBooking, (booking) => booking.purchaseOrderData)
  gojekBookingData: GojekBooking[];

  @ManyToOne(() => Products, (product) => product.purchaseOrderData)
  @JoinColumn({ name: "product_id" })
  productsData: Products;

  @OneToOne(() => BluebirdBooking, (po) => po.purchaseOrderData)
  blueBirdBookingData: PurchaseOrder;
}
