const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    sales_from: DataTypes.STRING(100),
    order_number: DataTypes.STRING,
    real_invoice: DataTypes.STRING,
    vip: DataTypes.STRING(10),
    payment_type: DataTypes.STRING,
    refcode: DataTypes.STRING(950),
    customer_id: DataTypes.INTEGER.UNSIGNED,
    owner: DataTypes.INTEGER.UNSIGNED,
    website: DataTypes.INTEGER.UNSIGNED,
    unique_code: DataTypes.INTEGER,
    status: DataTypes.STRING(191),
    tax_type: DataTypes.STRING(10),
    tax_result: DataTypes.DOUBLE(15, 2),
    verify: DataTypes.INTEGER,
    total: DataTypes.DOUBLE(15, 2),
    cashback: DataTypes.DOUBLE(15, 2),
    inquiry_id: DataTypes.INTEGER.UNSIGNED,
    payment_status: DataTypes.STRING,
    payment_duedate: DataTypes.DATE,
    payment_notes: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    invoice_address: DataTypes.TEXT,
    invoice_receipt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    moota_stat: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    payment_revision: DataTypes.STRING(18),
    approve_logs: DataTypes.TEXT,
    tax_invoice: DataTypes.STRING(3),
    receipt: DataTypes.STRING(3),
    tele_created: DataTypes.INTEGER,
    service_fee: DataTypes.INTEGER,
    meta: DataTypes.JSON,
    referto: DataTypes.STRING,
    auto_cancel: DataTypes.INTEGER,
    last_fu_ar_date: DataTypes.DATE,
    app: DataTypes.INTEGER,
    tx_id: DataTypes.STRING(100),
    voucher_amount: DataTypes.DOUBLE(15, 0),
    voucher_id: DataTypes.INTEGER,
    is_staging: DataTypes.INTEGER,
    voucher: DataTypes.INTEGER,
    all_po_finish: DataTypes.INTEGER,
    app_factur_status: DataTypes.INTEGER,
    mitra_id: DataTypes.INTEGER,
    payment_method: DataTypes.STRING,
    va_bank: DataTypes.STRING,
    va_account_number: DataTypes.STRING,
    va_external_id: DataTypes.STRING,
    va_id: DataTypes.STRING,
    total_gross: DataTypes.INTEGER,
    approved_at: DataTypes.DATE,
    auto_cancel_time: DataTypes.DATE,
    has_point: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment:
        "0: Belum dicek, 1: Ada point, sudah masuk, 2: Sudah dicek, tidak ada point",
    },
    canceled_at: DataTypes.DATE,
  },
  {
    tableName: "order",
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true, // handles created_at and updated_at
    paranoid: true, // handles deleted_at
    underscored: true, // snake_case columns
  }
);

module.exports = Order;
