import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Supplier } from "./Supplier";
import { Products } from "./Products";

@Entity({ name: "product_supplier_event" })
export class ProductSupplierEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updated_at: Date;

  @Column()
  supplier_id: number;

  @Column()
  product_id: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.productEvents)
  @JoinColumn({ name: "supplier_id" })
  supplier: Supplier;

  @ManyToOne(() => Products, (product) => product.productEvents)
  @JoinColumn({ name: "product_id" })
  product: Products;
}
