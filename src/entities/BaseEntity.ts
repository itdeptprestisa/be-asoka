import {
  BaseEntity as TypeOrmBaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  PrimaryGeneratedColumn,
} from "typeorm";

export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn("increment", { unsigned: true })
  id: number;

  @Column({
    name: "created_at",
    type: "timestamp",
  })
  created_at: Date;

  @Column({
    name: "updated_at",
    type: "timestamp",
  })
  updated_at: Date;

  @BeforeInsert()
  setTimestampsOnInsert() {
    const now = new Date();
    this.created_at = now;
    this.updated_at = now;
  }

  @BeforeUpdate()
  setTimestampsOnUpdate() {
    this.updated_at = new Date();
  }
}
