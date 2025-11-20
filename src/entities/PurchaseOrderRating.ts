import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Order } from "./Order";
import { PurchaseOrder } from "./PurchaseOrder";

@Entity({ name: "purchase_order_rating" })
export class PurchaseOrderRating {
  @PrimaryGeneratedColumn({ type: "int", unsigned: true })
  id: number;

  @CreateDateColumn({ name: "created_at", type: "datetime", nullable: true })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime", nullable: true })
  updated_at: Date;

  @Column({ type: "int", nullable: true })
  po_id: number;

  @Column({ type: "decimal", precision: 2, scale: 1, nullable: true })
  rating_location_image: number;

  @Column({ type: "decimal", precision: 2, scale: 1, nullable: true })
  flower_rating: number;

  @Column({ type: "text", nullable: true })
  flower_comment: string;

  @Column({ type: "decimal", precision: 2, scale: 1, nullable: true })
  cs_rating: number;

  @Column({ type: "text", nullable: true })
  cs_comment: string;

  @Column({ type: "datetime", nullable: true })
  rating_expired_at: Date;

  @Column({ type: "text", nullable: true })
  log: string;

  @Column({ type: "int", nullable: true, comment: "1 = customer , 2 = sales" })
  rating_by: number;

  @Column({ type: "int", nullable: true })
  customer_id: number;

  @Column({ type: "text", nullable: true })
  complaint_category: string;

  @OneToOne(
    () => PurchaseOrder,
    (purchaseOrderData) => purchaseOrderData.purchaseOrderRatingData
  )
  @JoinColumn({ name: "po_id" })
  purchaseOrderData: PurchaseOrder;
}
