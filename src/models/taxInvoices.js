const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TaxInvoices = sequelize.define(
  "TaxInvoices",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    request_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    completed_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    order_number: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    npwp_number: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    npwp_name: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    npwp_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tax_invoice_number: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    physical_document_delivery: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
    },
    physical_document_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    document_delivery_status: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
    },
    shipping_receipt_number: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    tax_invoice_file: {
      type: DataTypes.STRING(191),
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
    upload_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    receipt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    npwp_file: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "tax_invoices", // 👈 adjust if actual table name differs
    timestamps: true,
    paranoid: true, // enables deleted_at soft delete
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  }
);

module.exports = TaxInvoices;
