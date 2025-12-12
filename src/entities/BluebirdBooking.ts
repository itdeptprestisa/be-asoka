import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "bluebird_booking" })
export class BluebirdBooking extends BaseEntity {
  @Column({
    type: "bigint",
    unsigned: true,
    nullable: false,
    comment: "id of purchase_order",
  })
  reference_no: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  bluebird_order_id: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  order_status_id: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  order_status_description: string;

  @Column({ type: "text", nullable: true })
  note: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  vehicle_no: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  driver_name: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  driver_phone: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  sender_name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  receiver_name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  signature_key: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  event_time: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  change_by: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  price: string;

  @Column({ type: "datetime", nullable: true })
  order_date: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  photo_sender_1: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  photo_sender_2: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  photo_receiver_1: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  photo_receiver_2: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  delivery_status: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  undelivery_reason: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  tracking_link: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  created_by: string;
}
