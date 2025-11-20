const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrderPayments = sequelize.define(
  "OrderPayments",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    transaction_id: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    receipt: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    approved: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    log: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "order_payments",
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true, // handles created_at and updated_at
    paranoid: true, // handles deleted_at
    underscored: true, // snake_case columns
  }
);

module.exports = OrderPayments;
