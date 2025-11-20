const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrderCustomer = sequelize.define(
  "OrderCustomer",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    company_type: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    company_address: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    company_email: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    company_phone: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    no_finance: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    no_finance_2: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    logs: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    npwp_number: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "nomor npwp",
    },
    npwp_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "nama npwp",
    },
    npwp_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "alamat di npwp",
    },
    npwp_file: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "npwp document",
    },
    npwp_notify_customer: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0,
      comment: "customer request hardcopy faktur, 1=yes, 0=no",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "order_customer",
    timestamps: true,
    paranoid: true, // uses deleted_at
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  }
);

module.exports = OrderCustomer;
