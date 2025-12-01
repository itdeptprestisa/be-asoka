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
import { Products } from "./Products";
import { Supplier } from "./Supplier";
import { PurchaseOrder } from "./PurchaseOrder";
import { InventorySpkProduct } from "./InventorySpkProduct";
import { Users } from "./Users";
import { ProductStockEvent } from "./ProductStockEvent";
import { InventoryGoodReceived } from "./InventoryGoodReceived";

@Entity("inventory_spk")
export class InventorySpk extends BaseEntity {

    @Column({ nullable: true })
    spk_number!: string;

    @Column({ name: "supplier_id", type: "int", unsigned: true })
    supplier_id: number;

    @Column({ nullable: true })
    type!: string;

    @Column({ name: "po_id", type: "int", unsigned: true })
    po_id: number;

    @Column({ nullable: true })
    due_date!: Date;

    @Column({ name: "user_id", type: "int", unsigned: true })
    user_id: number;

    @Column({ type: "double", precision: 15, scale: 2, nullable: true })
    total_qty!: number;

    @Column({ type: "double", precision: 15, scale: 2, nullable: true })
    total!: number;

    @Column({ nullable: true })
    status!: string;

    // @Column({ nullable: true })
    // receipt!: string;

    @OneToMany(() => InventorySpkProduct, (e) => e.spkData)
    inventoryProductData: InventorySpkProduct[];

    @OneToOne(() => Users, (user) => user.inventorySpk)
    @JoinColumn({ name: "user_id" })
    users: Users;

    @OneToOne(() => Supplier, (supplier) => supplier.inventorySpk)
    @JoinColumn({ name: "supplier_id" })
    suppliers: Supplier;

    @OneToOne(() => PurchaseOrder, (e) => e.inventorySpk)
    @JoinColumn({ name: "po_id" })
    poData: PurchaseOrder;

    @OneToMany(() => ProductStockEvent, (e) => e.spkData)
    stockEvent: ProductStockEvent[];

    @OneToMany(() => InventoryGoodReceived, (e) => e.spkData)
    goodReceived: InventoryGoodReceived[];
}
