// entities/ShippingCost.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("shipping_cost") // adjust if your actual table name differs
export class ShippingCost extends BaseEntity {
  @Column({ type: "int", nullable: false })
  province: number;

  @Column({ type: "int", nullable: false })
  city: number;

  @Column({ type: "int", nullable: true })
  vehicle_type: number | null;

  @Column({ type: "double", precision: 10, scale: 2, nullable: true })
  shipping_cost: number | null;

  @Column({ length: 255, nullable: true })
  notes: string | null;
}
