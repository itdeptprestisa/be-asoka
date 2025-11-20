import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { InventorySpk } from "./InventorySpk";
import { Users } from "./Users";

@Entity("inventory_good_received")
export class InventoryGoodReceived extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    spk_id: number;

    @Column({ nullable: true })
    user_id: number;

    @Column({ type: "text", nullable: true })
    receipt: string;

    @Column({ nullable: true })
    completed_date!: Date;

    @ManyToOne(() => InventorySpk, (e) => e.goodReceived)
    @JoinColumn({ name: "spk_id" })
    spkData: InventorySpk;

    @OneToOne(() => Users, (e) => e.goodReceived)
    @JoinColumn({ name: "user_id" })
    users: Users;

}
