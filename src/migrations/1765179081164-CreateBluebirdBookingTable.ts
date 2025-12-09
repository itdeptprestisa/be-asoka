import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateBluebirdBookingTable1765179081164
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "bluebird_booking",
        columns: [
          {
            name: "id",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
            unsigned: true,
          },
          {
            name: "reference_no",
            type: "bigint",
            unsigned: true,
            isNullable: false,
            comment: "id of purchase_order",
          },
          {
            name: "bluebird_order_id",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "order_status_id",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "order_status_description",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "note",
            type: "text",
            isNullable: true,
          },
          {
            name: "vehicle_no",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "driver_name",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "driver_phone",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "sender_name",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "receiver_name",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "signature_key",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "event_time",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "change_by",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "price",
            type: "decimal",
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: "order_date",
            type: "datetime",
            isNullable: true,
          },
          {
            name: "photo_sender_1",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "photo_sender_2",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "photo_receiver_1",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "photo_receiver_2",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "delivery_status",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "undelivery_reason",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "tracking_link",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "datetime",
            isNullable: true,
            default: null,
          },
          {
            name: "created_by",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "updated_at",
            type: "datetime",
            isNullable: true,
            default: null,
          },
        ],
      }),
      false // Don't skip if exists
    );

    // Create indexes
    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_reference_no",
        columnNames: ["reference_no"],
      })
    );

    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_bluebird_order_id",
        columnNames: ["bluebird_order_id"],
      })
    );

    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_order_status_id",
        columnNames: ["order_status_id"],
      })
    );

    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_delivery_status",
        columnNames: ["delivery_status"],
      })
    );

    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_order_date",
        columnNames: ["order_date"],
      })
    );

    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_vehicle_no",
        columnNames: ["vehicle_no"],
      })
    );

    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_driver_phone",
        columnNames: ["driver_phone"],
      })
    );

    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_created_at",
        columnNames: ["created_at"],
      })
    );

    // Composite indexes
    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_reference_order_date",
        columnNames: ["reference_no", "order_date"],
      })
    );

    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_status_date",
        columnNames: ["order_status_id", "order_date"],
      })
    );

    await queryRunner.createIndex(
      "bluebird_booking",
      new TableIndex({
        name: "idx_delivery_status_date",
        columnNames: ["delivery_status", "order_date"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes first
    await queryRunner.dropIndex("bluebird_booking", "idx_delivery_status_date");
    await queryRunner.dropIndex("bluebird_booking", "idx_status_date");
    await queryRunner.dropIndex("bluebird_booking", "idx_reference_order_date");
    await queryRunner.dropIndex("bluebird_booking", "idx_created_at");
    await queryRunner.dropIndex("bluebird_booking", "idx_driver_phone");
    await queryRunner.dropIndex("bluebird_booking", "idx_vehicle_no");
    await queryRunner.dropIndex("bluebird_booking", "idx_order_date");
    await queryRunner.dropIndex("bluebird_booking", "idx_delivery_status");
    await queryRunner.dropIndex("bluebird_booking", "idx_order_status_id");
    await queryRunner.dropIndex("bluebird_booking", "idx_bluebird_order_id");
    await queryRunner.dropIndex("bluebird_booking", "idx_reference_no");

    // Drop the table
    await queryRunner.dropTable("bluebird_booking");
  }
}
