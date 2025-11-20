const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrderProblemsPayments = sequelize.define(
  "OrderProblemsPayments",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
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
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    order_problem_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    order_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    transaction_id: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(9),
      allowNull: false,
    },
    receipt: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    notes: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    tableName: "order_problems_payments",
    timestamps: true,
    paranoid: true, // enables deleted_at
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  }
);

module.exports = OrderProblemsPayments;
