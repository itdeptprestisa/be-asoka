// entities/CapitalPriceProducts.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("capital_price_products")
export class CapitalPriceProducts extends BaseEntity {
  @Column({ type: "int", nullable: true })
  city_id: number | null;

  @Column({ type: "int", nullable: true })
  product_id: number | null;

  @Column({ length: 255, nullable: true })
  product_code: string | null;

  @Column({ type: "double", precision: 10, scale: 2, nullable: true })
  capital_price: number | null;
}
