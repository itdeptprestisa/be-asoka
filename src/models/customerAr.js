const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CustomerAr = sequelize.define(
  "CustomerAr",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    tax_invoice: {
      type: DataTypes.TINYINT(1), // tinyint(1) → boolean
      allowNull: true,
    },
    send_physical_invoice: {
      type: DataTypes.TINYINT(1), // tinyint(1) → boolean
      allowNull: true,
    },
    send_physical_invoice_address: {
      type: DataTypes.STRING(4096),
      allowNull: true,
    },
    payment_order_type: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    term_of_payment: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    credit_limit: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    corporate_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_person_finance: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_number_finance: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_person_purchasing: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_number_purchasing: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    npwp_data_1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    npwp_number_1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    npwp_name_1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    npwp_address_1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    npwp_data_2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    npwp_number_2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    npwp_name_2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    npwp_address_2: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    sequelize,
    tableName: "customer_ar", // 👈 check actual table name
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true, // enables deleted_at
    deletedAt: "deleted_at",
  }
);

module.exports = CustomerAr;
