// entities/Settings.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("settings")
export class Settings extends BaseEntity {
  @Column({ type: "text", nullable: true })
  meta_value: string | null;

  @Column({ length: 191, nullable: true })
  meta_key: string | null;

  @Column({ type: "double", precision: 15, scale: 2 })
  transfer_fee: number;

  @Column({ type: "double", precision: 15, scale: 2 })
  additional_price: number;

  @Column({ length: 255 })
  description: string;
}
