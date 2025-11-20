// entities/ShippingCostEstimation.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("shipping_cost_estimation")
export class ShippingCostEstimation extends BaseEntity {
  @Column({ type: "int", unsigned: true })
  city_id: number;

  @Column({ type: "double" })
  distance: number;

  @Column({ type: "int", unsigned: true })
  cost_per_km: number;

  @Column({ length: 255 })
  courier_name: string;

  @Column({ type: "int", unsigned: true })
  shipping_cost: number;

  @Column({ type: "int", unsigned: true, nullable: true, default: null })
  order_items_id: number | null;

  @Column({ type: "longtext", nullable: true, default: null })
  error_log: string | null;
}
