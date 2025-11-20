// entities/ProductStock.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("product_stock")
export class ProductStock extends BaseEntity {
  @Column({ type: "int", nullable: true })
  product_id: number | null;

  @Column({ type: "int", nullable: true })
  user_id: number | null;

  @Column({ type: "int", nullable: true })
  qty: number | null;

  @Column({ length: 10, nullable: true })
  type: string | null;

  @Column({ length: 255, nullable: true })
  remarks: string | null;

  @Column({ type: "tinyint", nullable: true })
  category: number | null;
}
