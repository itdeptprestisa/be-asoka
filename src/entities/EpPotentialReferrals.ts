// entities/EpPotentialReferrals.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("ep_potential_referrals")
export class EpPotentialReferrals extends BaseEntity {
  @Column({ type: "int", unsigned: true })
  upline_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  phone: string;

  @Column({ type: "datetime", nullable: true, default: null })
  join_date: Date | null;
}
