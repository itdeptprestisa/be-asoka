// entities/Products.ts
import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { OrderItems } from "./OrderItems";
import { ProductCategoryNew } from "./ProductCategoryNew";
import { ProductAttribute } from "./ProductAttribute";
import { ProductSupplierEvent } from "./ProductSupplierEvent";
import { PurchaseOrder } from "./PurchaseOrder";
import { InventorySpk } from "./InventorySpk";
import { InventorySpkProduct } from "./InventorySpkProduct";
import { ProductStockEvent } from "./ProductStockEvent";

@Entity("products")
export class Products extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({
    name: "capital_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  capital_price: number;

  @Column({
    name: "sale_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  sale_price: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  qty: number;

  @Column({ type: "text", nullable: true })
  image: string;

  @Column({ type: "int", unsigned: true, nullable: true })
  country: number;

  @Column({ type: "int", unsigned: true, nullable: true })
  province: number;

  @Column({ type: "int", unsigned: true, nullable: true })
  city: number;

  @Column({ name: "product_code", length: 100 })
  product_code: string;

  @Column({ name: "category_id", type: "int", unsigned: true })
  category_id: number;

  @Column({
    name: "product_type",
    type: "int",
    default: 1,
    comment: "0 = normal, 1 = custom",
  })
  product_type: number;

  @Column({ type: "text", nullable: true })
  tags: string;

  @Column({ type: "text" })
  attribute: string;

  @Column({ name: "supplier_id", type: "int", unsigned: true, nullable: true })
  supplier_id: number;

  @Column({ name: "wp_id", type: "int", nullable: true })
  wp_id: number;

  @Column({ type: "decimal", precision: 4, scale: 0, nullable: true })
  rating: number;

  @Column({ name: "item_sold", type: "int", nullable: true })
  item_sold: number;

  @Column({ name: "image_app", type: "text", nullable: true })
  image_app: string;

  @Column({ length: 255, nullable: true })
  dimension: string;

  @Column({ type: "int", nullable: true, default: 1 })
  availability: number;

  @Column({
    name: "customer_app",
    type: "int",
    default: 0,
    comment: "1 = customer app, 0 = lavender, 2 = customer bidding",
  })
  customer_app: number;

  @Column({
    name: "status_capital_price",
    length: 25,
    nullable: true,
    default: "",
  })
  status_capital_price: string;

  @Column({
    name: "min_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  min_price: number;

  @Column({
    name: "suggested_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  suggested_price: number;

  @Column({
    name: "max_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  max_price: number;

  @Column({
    name: "max_suggested_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  max_suggested_price: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  discount: number;

  @Column({ type: "int", nullable: true })
  height: number;

  @Column({ type: "int", nullable: true })
  width: number;

  @Column({ type: "int", nullable: true })
  length: number;

  @Column({ name: "is_pre_order", type: "int", nullable: true })
  is_pre_order: number;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  weight: number;

  @Column({ name: "attribute_color", type: "int", nullable: true })
  attribute_color: number;

  @Column({ name: "attribute_material", type: "int", nullable: true })
  attribute_material: number;

  @Column({ name: "attribute_size", type: "int", nullable: true })
  attribute_size: number;

  @Column({ name: "attribute_size_group", length: 255, nullable: true })
  attribute_size_group: string;

  @Column({ name: "attribute_composition", type: "int", nullable: true })
  attribute_composition: number;

  @Column({ name: "buying_mode", type: "int", nullable: true })
  buying_mode: number;

  @Column({ name: "group_category", length: 255, nullable: true })
  group_category: string;

  @Column({ name: "approval_spv", type: "int", nullable: true })
  approval_spv: number;

  @Column({
    name: "additional_fee",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  additional_fee: number;

  @Column({
    name: "management_fee",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  management_fee: number;

  @Column({ name: "supplier_type", type: "int", nullable: true })
  supplier_type: number;

  @Column({ name: "supplier_specialist_id", type: "int", nullable: true })
  supplier_specialist_id: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  stock_physical: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  stock_display: number;

  @OneToOne(() => OrderItems, { eager: false })
  orderItemsData: OrderItems;

  @ManyToOne(
    () => ProductCategoryNew,
    (productCategoryNew) => productCategoryNew.products,
    {
      nullable: true,
    }
  )
  @JoinColumn({ name: "category_id" })
  productCategoryNewData: ProductCategoryNew;

  @ManyToMany(
    () => ProductAttribute,
    (productAttribute) => productAttribute.productsOccasion
  )
  @JoinTable({
    name: "product_attribute_pivot",
    joinColumn: {
      name: "product_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "product_attribute_id",
      referencedColumnName: "id",
    },
  })
  occasionAttribute: ProductAttribute[];

  @ManyToMany(() => ProductAttribute, (attr) => attr.productsVariant)
  @JoinTable({
    name: "product_attribute_pivot",
    joinColumn: {
      name: "product_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "product_attribute_id",
      referencedColumnName: "id",
    },
  })
  variantAttribute: ProductAttribute[];

  @OneToMany(() => ProductSupplierEvent, (event) => event.product)
  productEvents: ProductSupplierEvent[];

  @OneToMany(() => PurchaseOrder, (po) => po.product)
  purchaseOrders: PurchaseOrder[];

  @OneToOne(() => InventorySpkProduct, { eager: false })
  spkProduct: InventorySpkProduct;

  @OneToOne(() => ProductStockEvent, { eager: false })
  productStockEvent: ProductStockEvent;

  @OneToMany(() => PurchaseOrder, (po) => po.productsData)
  purchaseOrderData: PurchaseOrder[];
}
