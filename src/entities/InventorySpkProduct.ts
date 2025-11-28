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
import { InventorySpk } from "./InventorySpk";
import { InventoryGoodReceived } from "./InventoryGoodReceived";

@Entity("inventory_spk_product")
export class InventorySpkProduct extends BaseEntity {

    @Column({ name: "spk_id", type: "int", unsigned: true })
    spk_id: number;

    @Column({ name: "product_id", type: "int", unsigned: true })
    product_id: number;

    @Column({ type: "double" })
    qty: number;

    @Column({ type: "double", precision: 15, scale: 2, nullable: true })
    price!: number;

    @Column({ type: "double", precision: 15, scale: 2, nullable: true })
    total_price!: number;

    @Column({ type: "longtext", nullable: true })
    receipt: string;

    @ManyToOne(() => InventorySpk, (e) => e.inventoryProductData)
    @JoinColumn({ name: "spk_id" })
    spkData: InventorySpk;

    @OneToOne(() => Products, (products) => products.spkProduct)
    @JoinColumn({ name: "product_id" })
    productsData: Products;

    @OneToMany(() => InventoryGoodReceived, (e) => e.spkProduct)
    @JoinColumn({ name: "spk_product_id" })
    goodReceivedData: Products;

}
