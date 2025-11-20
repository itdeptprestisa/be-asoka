// entities/MetaValues.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("meta_values")
export class MetaValues extends BaseEntity {
  @Column({
    type: "double",
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
  })
  online_price: number | null;

  @Column({
    type: "double",
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
  })
  offline_price: number | null;

  @Column({
    type: "double",
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
  })
  reseller_price: number | null;

  @Column({ type: "int", nullable: true, default: null })
  online_stock: number | null;

  @Column({ type: "int", nullable: true, default: null })
  offline_stock: number | null;

  @Column({ type: "int", nullable: true, default: null })
  reseller_stock: number | null;

  @Column({ type: "int", nullable: true, default: null })
  product_id: number | null;

  @Column({
    type: "int",
    nullable: true,
    default: null,
    comment: "perhitungan pre order bertambah dan berkurang",
  })
  counter_pre_order: number | null;
}
