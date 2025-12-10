// entities/GojekBooking.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { PurchaseOrder } from "./PurchaseOrder";

@Entity({ name: "gojek_booking" })
export class GojekBooking extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  booking_id: string; // dari gojek, tidak berubah meskipun driver ganti

  @Column({ type: "varchar", length: 255, nullable: true })
  type: string | null; // status 1, dipakai BE

  @Column({ type: "varchar", length: 255, nullable: true })
  event_id: string | null;

  @Column({ type: "varchar", length: 255, nullable: false })
  booking_type: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  status: string | null; // status 2

  @Column({ type: "varchar", length: 255, nullable: true })
  destination_type: string | null; // angka, rumah/kantor

  @Column({ type: "varchar", length: 255, nullable: true })
  driver_name: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  driver_phone: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  driver_phone2: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  driver_phone3: string | null;

  @Column({ type: "double", nullable: true })
  total_distance_in_kms: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  delivery_eta: string | null;

  @Column({ type: "longtext", nullable: true })
  driver_photo_url: string | null;

  @Column({ type: "double", precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  cancellation_reason: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  error_message: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  prebook: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  prebook_message: string | null;

  @Column({ type: "text", nullable: true })
  live_tracking_url: string | null;

  @Column({ type: "varchar", nullable: true })
  store_order_id: string | null; // purchase_order_id

  @Column({ type: "varchar", length: 255, nullable: true })
  receiver_name: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  gojek_id: string | null;

  @DeleteDateColumn({ type: "timestamp" })
  deleted_at: Date | null;

  @ManyToOne(() => PurchaseOrder, (po) => po.gojekBookingData)
  @JoinColumn({ name: "store_order_id", referencedColumnName: "id" })
  purchaseOrderData: PurchaseOrder;
}
