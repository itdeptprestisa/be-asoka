const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BluebirdBooking = sequelize.define(
  "BluebirdBooking",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    reference_no: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: "id of purchase_order",
    },
    bluebird_order_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    order_status_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    order_status_description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vehicle_no: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    driver_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    driver_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    sender_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    receiver_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    signature_key: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    event_time: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    change_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    photo_sender_1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    photo_sender_2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    photo_receiver_1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    photo_receiver_2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    delivery_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    undelivery_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tracking_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "bluebird_booking",
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "idx_reference_no",
        fields: ["reference_no"],
      },
      {
        name: "idx_bluebird_order_id",
        fields: ["bluebird_order_id"],
      },
      {
        name: "idx_order_status_id",
        fields: ["order_status_id"],
      },
      {
        name: "idx_delivery_status",
        fields: ["delivery_status"],
      },
      {
        name: "idx_order_date",
        fields: ["order_date"],
      },
      {
        name: "idx_vehicle_no",
        fields: ["vehicle_no"],
      },
      {
        name: "idx_driver_phone",
        fields: ["driver_phone"],
      },
      {
        name: "idx_created_at",
        fields: ["created_at"],
      },
      {
        name: "idx_reference_order_date",
        fields: ["reference_no", "order_date"],
      },
      {
        name: "idx_status_date",
        fields: ["order_status_id", "order_date"],
      },
      {
        name: "idx_delivery_status_date",
        fields: ["delivery_status", "order_date"],
      },
    ],
  }
);

module.exports = BluebirdBooking;
