// entities/Geo.ts
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("geo")
export class Geo {
  @PrimaryGeneratedColumn("increment", { unsigned: true })
  id: number;

  @Column({ type: "int", nullable: true })
  parent_id: number | null;

  @Column({ type: "int", nullable: true })
  left: number | null;

  @Column({ type: "int", nullable: true })
  right: number | null;

  @Column({ type: "int", nullable: true })
  depth: number | null;

  @Column({ type: "varchar", nullable: true })
  name: string | null;

  @Column({ type: "text", nullable: true })
  alternames: string | null;

  @Column({ length: 2, nullable: true })
  country: string | null;

  @Column({ length: 10, nullable: true })
  level: string | null;

  @Column({ type: "bigint", nullable: true })
  population: number | null;

  @Column({ type: "decimal", precision: 9, scale: 6, nullable: true })
  lat: number | null;

  @Column({ type: "decimal", precision: 9, scale: 6, nullable: true })
  long: number | null;

  @Column({ type: "varchar", nullable: true })
  subadminarea_gmaps_api: string | null;
}
