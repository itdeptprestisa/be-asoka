const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrderSelection = sequelize.define(
  "OrderSelection",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pr_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    confirm_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estimated_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date_estimated: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    time_estimated: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  },
  {
    tableName: "order_selection",
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: false, // handles created_at and updated_at
    paranoid: false, // handles deleted_at
    underscored: true, // snake_case columns
  }
);

module.exports = OrderSelection;
