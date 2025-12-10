// entities/PoImageLogs.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PurchaseOrder } from "./PurchaseOrder";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "po_image_logs" })
export class PoImageLogs extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int" })
  id: number;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date;

  @Column({ type: "int", nullable: true })
  po_id: number | null;

  @Column({ type: "int", nullable: true })
  owner: number | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  tipe: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  status_late: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  desc: string | null;

  @Column({ type: "int", nullable: true })
  rev: number | null;

  @Column({ type: "int", nullable: true })
  supplier_owner_photo: number | null; // jika yang upload photo adalah mitra langsung dari aplikasi

  // Optional relation to PurchaseOrder
  //   @ManyToOne(() => PurchaseOrder, (po) => po.poImageLogsData)
  @JoinColumn({ name: "po_id" })
  purchaseOrder: PurchaseOrder;
}
