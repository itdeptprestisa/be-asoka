const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrderProblems = sequelize.define(
  "OrderProblems",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      // ⚠️ no autoIncrement mentioned in schema,
      // if it's supposed to be auto_increment, add `autoIncrement: true`
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    order_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    order_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    amount_customer_debit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amount_customer_kredit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    account_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    account_holder: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status_log: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    owner: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    approved: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approved_notes: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    item_references: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "order_problems",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true, // soft delete
    deletedAt: "deleted_at",
  }
);

module.exports = OrderProblems;
