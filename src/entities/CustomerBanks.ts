// entities/CustomerBanks.ts
import { Entity, Column, OneToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Customer } from "./Customer";

@Entity("customer_banks")
export class CustomerBanks extends BaseEntity {
  @Column({ length: 255 })
  account_number: string;

  @Column({ length: 255 })
  account_holder: string;

  @Column({ length: 255 })
  bank_name: string;

  @Column({ length: 255, nullable: true })
  bank_verified: string | null;

  @Column({ length: 255 })
  customer_id: string;

  @OneToOne(() => Customer, (customer) => customer.customerBanksData)
  customerData: Customer;
}
