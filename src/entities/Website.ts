// entities/Website.ts
import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";

@Entity("website")
export class Website extends BaseEntity {
  @Column({
    type: "longtext",
    nullable: true,
    comment: "google analytic view id",
  })
  view_id: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  email: string | null;

  @Column({ length: 255, nullable: true })
  phone: string | null;

  @Column({ length: 255, nullable: true })
  website: string | null;

  @Column({ type: "longtext", nullable: true })
  slogan: string | null;

  @Column({ type: "longtext", nullable: true })
  address: string | null;

  @Column({ type: "mediumtext" })
  description: string;

  @Column({ type: "mediumtext" })
  account_number: string;

  @Column({ type: "mediumtext" })
  account_number_notax: string;

  @Column({ type: "longtext", nullable: true })
  mail_inboxes: string | null;

  @Column({ type: "longtext", nullable: true })
  sales_inboxes: string | null;

  @Column({ type: "longtext", nullable: true })
  finance_inboxes: string | null;

  @Column({ type: "longtext", nullable: true })
  purchasing_inboxes: string | null;

  @Column({ type: "longtext", nullable: true })
  logo: string | null;

  @Column({ type: "longtext", nullable: true })
  logo_white: string | null;

  @Column({ type: "varchar", nullable: true })
  primary_color: string | null;

  @Column({
    type: "longtext",
    nullable: true,
    comment: "google ads customerid",
  })
  customer_id: string | null;

  @OneToMany(() => Order, (order) => order.websiteData)
  orderData: Order[];
}
