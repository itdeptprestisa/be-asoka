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
import { Users } from "./Users";
import { Supplier } from "./Supplier";
import { InventorySpk } from "./InventorySpk";
import { Products } from "./Products";
import { PurchaseOrder } from "./PurchaseOrder";

@Entity("product_stock_event")
export class ProductStockEvent extends BaseEntity {

    @Column({ name: "product_id", type: "int", unsigned: true })
    product_id: number;

    @Column({ name: "user_id", type: "int", unsigned: true })
    user_id: number;

    @Column({ name: "supplier_id", type: "int", unsigned: true })
    supplier_id: number;

    @Column({ name: "spk_id", type: "int", unsigned: true })
    spk_id: number;

    @Column({ type: "double" })
    qty: number;

    @Column({ type: "double" })
    stock_left: number;

    @Column({ type: "double" })
    stock_type: number;

    @Column({ nullable: true })
    type!: string;

    @Column({ nullable: true })
    remarks!: string;

    @Column({ nullable: true })
    category!: number;

    @OneToOne(() => Products, (e) => e.productStockEvent)
    @JoinColumn({ name: "product_id" })
    products: Products;

    @OneToOne(() => Users, (e) => e.productStockEvent)
    @JoinColumn({ name: "user_id" })
    users: Users;

    @OneToOne(() => Supplier, (e) => e.productStockEvent)
    @JoinColumn({ name: "supplier_id" })
    suppliers: Supplier;

    @ManyToOne(() => InventorySpk, (e) => e.stockEvent)
    @JoinColumn({ name: "spk_id" })
    spkData: InventorySpk;

    @OneToOne(() => PurchaseOrder, (e) => e.stockEvent)
    @JoinColumn({ name: "po_id" })
    poData: PurchaseOrder;

}
