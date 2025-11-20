// entities/ProductCategoryNew.ts
import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Products } from "./Products";

@Entity("product_category_new")
export class ProductCategoryNew extends BaseEntity {
  @Column({ type: "int", nullable: true })
  parent: number | null;

  @Column({ length: 100, nullable: true })
  name: string | null;

  @Column({ length: 255, nullable: true })
  description: string | null;

  @Column({ length: 255, nullable: true })
  alias: string | null;

  @Column({ length: 10, nullable: true })
  level: string | null;

  @Column({ length: 191, nullable: true })
  code: string | null;

  @Column({ length: 255, nullable: true })
  icon: string | null;

  @Column({ type: "int", nullable: true })
  app: number | null;

  @Column({ type: "int", nullable: true })
  last_child: number | null;

  @Column({ length: 20, nullable: true })
  back_color: string | null;

  @OneToMany(() => Products, (product) => product.productCategoryNewData)
  products: Products[];
}
