// entities/ProductAttribute.ts
import { Entity, Column, ManyToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Products } from "./Products";

@Entity("product_attribute")
export class ProductAttribute extends BaseEntity {
  @Column({ length: 50, nullable: true, default: null })
  name: string | null;

  @Column({ length: 255, nullable: true, default: null })
  alias: string | null;

  @Column({
    length: 20,
    nullable: true,
    default: null,
    comment: "ukuran = P x L",
  })
  type: string | null;

  @Column({ type: "int", nullable: true, default: null })
  parent_id: number | null;

  @Column({ length: 20, nullable: true, default: null })
  size_group: string | null;

  @ManyToMany(() => Products, (products) => products.occasionAttribute)
  productsOccasion: Products[];

  @ManyToMany(() => Products, (product) => product.variantAttribute)
  productsVariant: Products[];
}
