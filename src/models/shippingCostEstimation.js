const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ShippingCostEstimation = sequelize.define(
  "ShippingCostEstimation",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    city_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    distance: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    cost_per_km: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    courier_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    shipping_cost: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    order_items_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    error_log: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "shipping_cost_estimation", // adjust if needed
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

module.exports = ShippingCostEstimation;
