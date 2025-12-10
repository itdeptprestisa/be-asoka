// entities/Whatsapp.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "wa_webhook" })
export class WaWebhook extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", unsigned: true })
  id: number;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date;

  @Column({ type: "text", nullable: true })
  body: string | null;

  @Column({ type: "text", nullable: true })
  file: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  mimetype: string | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  msgfrom: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  number: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  cs_nomor: string | null;

  @Column({ type: "text", nullable: true })
  token: string | null;

  @Column({ type: "timestamp", nullable: true })
  expired_at: Date | null;

  @Column({ type: "int", nullable: true })
  po_id: number | null;
}
