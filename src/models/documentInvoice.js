const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DocumentInvoice = sequelize.define(
  "DocumentInvoice",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    request_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    complete_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    order_number: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    is_send_invoice: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
    },
    send_invoice_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    send_document_status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    receipt_number: {
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
  },
  {
    sequelize,
    tableName: "document_invoice",
    timestamps: true,
    paranoid: true, // Soft deletes like Laravel's SoftDeletes
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  }
);

module.exports = DocumentInvoice;
