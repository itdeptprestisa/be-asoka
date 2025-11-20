// entities/Logs.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("logs")
export class Logs extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column("text")
  data: string;
}
